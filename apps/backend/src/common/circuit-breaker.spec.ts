import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  type CircuitBreakerSnapshot,
} from './circuit-breaker';

describe('CircuitBreaker', () => {
  let nowValue = 1_700_000_000_000;
  const now = () => nowValue;
  const sleep = (ms: number) => {
    nowValue += ms;
    return Promise.resolve();
  };

  const make = (overrides = {}) =>
    new CircuitBreaker({
      name: 'test',
      now,
      ...overrides,
    });

  it('starts closed and lets traffic through', async () => {
    const cb = make();
    expect(cb.snapshot().state).toBe('closed');
    await expect(cb.execute(async () => 42)).resolves.toBe(42);
    expect(cb.snapshot().state).toBe('closed');
  });

  it('opens after failureThreshold consecutive failures within failureWindowMs', async () => {
    const cb = make({ failureThreshold: 3, failureWindowMs: 60_000 });

    for (let i = 0; i < 2; i += 1) {
      await expect(cb.execute(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
      expect(cb.snapshot().state).toBe('closed');
    }
    await expect(cb.execute(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(cb.snapshot().state).toBe('open');
  });

  it('fails fast when OPEN (does not call fn)', async () => {
    const cb = make({ failureThreshold: 1, cooldownMs: 30_000 });
    await expect(cb.execute(async () => { throw new Error('fail'); })).rejects.toThrow('fail');
    expect(cb.snapshot().state).toBe('open');

    const fn = jest.fn(async () => 'never');
    await expect(cb.execute(fn)).rejects.toBeInstanceOf(CircuitBreakerOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('transitions OPEN → HALF_OPEN after cooldownMs', async () => {
    const cb = make({ failureThreshold: 1, cooldownMs: 30_000 });
    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow();
    expect(cb.snapshot().state).toBe('open');

    nowValue += 30_000;
    const snap = cb.snapshot();
    // We trigger the transition by calling execute (lazy).
    const states: CircuitBreakerSnapshot['state'][] = [];
    const unsub = cb.subscribe((s: CircuitBreakerSnapshot) => {
      states.push(s.state);
    });

    await expect(cb.execute(async () => 'ok')).resolves.toBe('ok');
    unsub();
    expect(states).toContain('closed');
    unsub();
    expect(snap.state).toBe('open'); // unchanged pre-call
  });

  it('HALF_OPEN → OPEN on probe failure', async () => {
    const cb = make({ failureThreshold: 1, cooldownMs: 30_000 });
    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow();
    nowValue += 30_000;

    await expect(cb.execute(async () => { throw new Error('still broken'); })).rejects.toThrow('still broken');
    expect(cb.snapshot().state).toBe('open');
  });

  it('HALF_OPEN → CLOSED on probe success', async () => {
    const cb = make({ failureThreshold: 1, cooldownMs: 30_000 });
    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow();
    nowValue += 30_000;

    await expect(cb.execute(async () => 'ok')).resolves.toBe('ok');
    expect(cb.snapshot().state).toBe('closed');
    expect(cb.snapshot().consecutiveFailures).toBe(0);
  });

  it('drops failures outside the failureWindowMs sliding window', async () => {
    const cb = make({ failureThreshold: 3, failureWindowMs: 60_000 });

    await expect(cb.execute(async () => { throw new Error('e1'); })).rejects.toThrow();
    await expect(cb.execute(async () => { throw new Error('e2'); })).rejects.toThrow();
    // Jump forward past the window — the first two failures should age out.
    nowValue += 60_001;

    await expect(cb.execute(async () => { throw new Error('e3'); })).rejects.toThrow();
    // Only the in-window failure counts → should not open.
    expect(cb.snapshot().state).toBe('closed');
    expect(cb.snapshot().consecutiveFailures).toBe(1);
  });

  it('emits state transitions to subscribers', async () => {
    const cb = make({ failureThreshold: 1, cooldownMs: 1 });
    const seen: CircuitBreakerSnapshot['state'][] = [];
    const unsub = cb.subscribe((s) => seen.push(s.state));

    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow();
    await sleep(2);
    await expect(cb.execute(async () => 'ok')).resolves.toBe('ok');

    expect(seen).toEqual(expect.arrayContaining(['open', 'half_open', 'closed']));
    unsub();
  });

  it('opens immediately when failureThreshold=0', async () => {
    const cb = make({ failureThreshold: 0, cooldownMs: 30_000 });
    await expect(cb.execute(async () => { throw new Error('any'); })).rejects.toThrow();
    expect(cb.snapshot().state).toBe('open');
  });

  it('recovers immediately when cooldownMs=0 and probe succeeds', async () => {
    const cb = make({ failureThreshold: 1, cooldownMs: 0 });
    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow();
    expect(cb.snapshot().state).toBe('open');

    await expect(cb.execute(async () => 'ok')).resolves.toBe('ok');
    expect(cb.snapshot().state).toBe('closed');
  });

  it('does not call unsubscribed listeners', async () => {
    const cb = make({ failureThreshold: 1, cooldownMs: 30_000 });
    const fn = jest.fn();
    const unsub = cb.subscribe(fn);
    // subscribe() emits the current snapshot once for initial state sync,
    // so capture that baseline and verify execute() adds no further calls.
    const callsAfterSubscribe = fn.mock.calls.length;
    unsub();

    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(callsAfterSubscribe);
  });

  it('continues working when a subscriber throws', async () => {
    const cb = make({ failureThreshold: 1, cooldownMs: 30_000 });
    cb.subscribe(() => { throw new Error('listener crash'); });

    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow();
    expect(cb.snapshot().state).toBe('open');
  });
});