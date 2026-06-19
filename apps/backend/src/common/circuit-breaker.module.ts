import { Logger } from '@nestjs/common';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  type CircuitBreakerOptions,
  type CircuitBreakerSnapshot,
  type CircuitBreakerState,
} from './circuit-breaker';

const LONG_LIVED_BREAKER_OPTIONS: Partial<CircuitBreakerOptions> = {
  failureThreshold: 5,
  failureWindowMs: 60_000,
  cooldownMs: 30_000,
};

const PASS_THROUGH_BREAKER_OPTIONS: Partial<CircuitBreakerOptions> = {
  failureThreshold: Number.MAX_SAFE_INTEGER,
  cooldownMs: 0,
  failureWindowMs: 60_000,
};

export type CircuitBreakerHandle = {
  name: string;
  /** Current state snapshot. */
  snapshot: () => CircuitBreakerSnapshot;
  /** Subscribe to state transitions; returns an unsubscribe fn. */
  subscribe: (listener: (snap: CircuitBreakerSnapshot) => void) => () => void;
  /** Force-open the circuit (test/maintenance only). */
  forceOpen: (reason?: string) => void;
  /** Force-close the circuit (test/maintenance only). */
  forceClose: (reason?: string) => void;
  /** Underlying breaker instance. */
  breaker: CircuitBreaker;
  /** "Pass-through" stub used when CIRCUIT_BREAKER_DISABLED=1. */
  isDisabled: boolean;
};

export type CircuitBreakerManagerOptions = {
  /** Disable all breakers (CIRCUIT_BREAKER_DISABLED=1). */
  disabled?: boolean;
  /** Override default thresholds for the stellar-rpc breaker. */
  stellarRpc?: Partial<CircuitBreakerOptions>;
};

export class CircuitBreakerManager {
  private readonly breakers = new Map<string, CircuitBreakerHandle>();
  private readonly disabled: boolean;

  constructor(opts: CircuitBreakerManagerOptions = {}) {
    this.disabled = opts.disabled ?? false;
  }

  /**
   * Return (or create) a circuit breaker with the given name. The default
   * behaviour for `name="stellar-rpc"` matches issue #202's spec; pass an
   * `override` to tweak thresholds per call site.
   */
  get(name: string, override?: Partial<CircuitBreakerOptions>): CircuitBreakerHandle {
    const existing = this.breakers.get(name);
    if (existing) return existing;
    const isStellar = name === 'stellar-rpc';
    const defaults = this.disabled
      ? PASS_THROUGH_BREAKER_OPTIONS
      : isStellar
        ? LONG_LIVED_BREAKER_OPTIONS
        : LONG_LIVED_BREAKER_OPTIONS;
    const options: CircuitBreakerOptions = {
      name,
      ...defaults,
      ...override,
      logger: new Logger(`CircuitBreaker:${name}`),
    };
    const breaker = new CircuitBreaker(options);
    const handle: CircuitBreakerHandle = {
      name,
      breaker,
      isDisabled: this.disabled,
      snapshot: () => breaker.snapshot(),
      subscribe: (l) => breaker.subscribe(l),
      forceOpen: (reason = 'forced') => {
        (breaker as unknown as { recordFailure: (e: unknown) => void }).recordFailure(
          new Error(reason),
        );
      },
      forceClose: () => breaker.recordSuccess(),
    };
    this.breakers.set(name, handle);
    return handle;
  }

  list(): CircuitBreakerHandle[] {
    return Array.from(this.breakers.values());
  }
}

export function describeCircuitState(state: CircuitBreakerState): string {
  switch (state) {
    case 'closed':
      return 'closed';
    case 'open':
      return 'open';
    case 'half_open':
      return 'half-open';
  }
}

export { CircuitBreaker, CircuitBreakerOpenError };
export type { CircuitBreakerOptions, CircuitBreakerSnapshot, CircuitBreakerState };