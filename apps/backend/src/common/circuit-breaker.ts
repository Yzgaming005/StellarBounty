import { Logger } from '@nestjs/common';

export type CircuitBreakerState = 'closed' | 'open' | 'half_open';

export type CircuitBreakerOptions = {
  /** Name for logs + metrics labels. */
  name: string;
  /** Consecutive failures within `failureWindowMs` required to open the circuit. Default 5. */
  failureThreshold?: number;
  /** Sliding window for failure counting, in ms. Default 60_000 (60s). */
  failureWindowMs?: number;
  /** Cooldown before allowing a single probe in HALF_OPEN. Default 30_000 (30s). */
  cooldownMs?: number;
  /** Optional logger for state transitions. */
  logger?: Pick<Logger, 'log' | 'warn' | 'error' | 'debug'>;
  /** Optional clock injection for tests. */
  now?: () => number;
};

export type CircuitBreakerSnapshot = {
  name: string;
  state: CircuitBreakerState;
  consecutiveFailures: number;
  openedAt: number | null;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
};

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly breakerName: string, public readonly openedAt: number) {
    super(`Circuit breaker "${breakerName}" is OPEN — failing fast`);
    this.name = 'CircuitBreakerOpenError';
  }
}

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_FAILURE_WINDOW_MS = 60_000;
const DEFAULT_COOLDOWN_MS = 30_000;

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureTimestamps: number[] = [];
  private consecutiveFailures = 0;
  private openedAt: number | null = null;
  private lastFailureAt: number | null = null;
  private lastSuccessAt: number | null = null;
  private readonly listeners = new Set<(snap: CircuitBreakerSnapshot) => void>();

  readonly name: string;
  private readonly failureThreshold: number;
  private readonly failureWindowMs: number;
  private readonly cooldownMs: number;
  private readonly logger: Pick<Logger, 'log' | 'warn' | 'error' | 'debug'>;
  private readonly now: () => number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.failureWindowMs = options.failureWindowMs ?? DEFAULT_FAILURE_WINDOW_MS;
    this.cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.logger = options.logger ?? new Logger(CircuitBreaker.name);
    this.now = options.now ?? Date.now;
  }

  /**
   * Subscribe to state transitions. The listener fires synchronously from
   * {@link recordSuccess} / {@link recordFailure} / {@link execute}.
   */
  subscribe(listener: (snap: CircuitBreakerSnapshot) => void): () => void {
    this.listeners.add(listener);
    // Emit the current snapshot immediately so the listener can sync state.
    // Wrap so a faulty listener does not break subscribe() — listeners must
    // not be able to corrupt the breaker's own state.
    try {
      listener(this.snapshot());
    } catch (err) {
      this.logger.warn?.(
        `[${this.name}] subscriber threw during initial emit: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): CircuitBreakerSnapshot {
    return {
      name: this.name,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      openedAt: this.openedAt,
      lastFailureAt: this.lastFailureAt,
      lastSuccessAt: this.lastSuccessAt,
    };
  }

  /**
   * Run `fn` under the breaker. Throws {@link CircuitBreakerOpenError} without
   * calling `fn` when the circuit is OPEN. Transitions OPEN → HALF_OPEN lazily
   * after the cooldown elapses.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.maybeTransitionToHalfOpen();
    if (this.state === 'open') {
      throw new CircuitBreakerOpenError(this.name, this.openedAt ?? this.now());
    }
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error);
      throw error;
    }
  }

  /** Record a successful operation (also called internally by `execute`). */
  recordSuccess(): void {
    this.failureTimestamps = [];
    this.consecutiveFailures = 0;
    if (this.state !== 'closed') {
      this.transition('closed', 'success');
    }
    this.lastSuccessAt = this.now();
    this.emit();
  }

  /** Record a failed operation (also called internally by `execute`). */
  recordFailure(error: unknown): void {
    const ts = this.now();
    this.failureTimestamps.push(ts);
    this.lastFailureAt = ts;
    // Drop timestamps outside the sliding window.
    const cutoff = ts - this.failureWindowMs;
    while (this.failureTimestamps.length > 0 && this.failureTimestamps[0] < cutoff) {
      this.failureTimestamps.shift();
    }
    this.consecutiveFailures = this.failureTimestamps.length;

    if (this.state === 'half_open') {
      this.openedAt = ts;
      this.transition('open', `probe failed: ${describe(error)}`);
      this.emit();
      return;
    }

    if (
      this.state === 'closed' &&
      this.consecutiveFailures >= this.failureThreshold
    ) {
      this.openedAt = ts;
      this.transition(
        'open',
        `${this.consecutiveFailures} consecutive failures within ${this.failureWindowMs}ms: ${describe(error)}`,
      );
    }
    this.emit();
  }

  private maybeTransitionToHalfOpen(): void {
    if (this.state !== 'open' || this.openedAt === null) return;
    if (this.now() - this.openedAt >= this.cooldownMs) {
      this.transition('half_open', `cooldown of ${this.cooldownMs}ms elapsed`);
      this.failureTimestamps = [];
      this.consecutiveFailures = 0;
      this.emit();
    }
  }

  private transition(next: CircuitBreakerState, reason: string): void {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    const log = this.logger;
    if (next === 'open') {
      log.warn?.(`[${this.name}] ${prev} → OPEN (${reason})`);
    } else if (next === 'half_open') {
      log.log?.(`[${this.name}] ${prev} → HALF_OPEN (${reason})`);
    } else {
      log.log?.(`[${this.name}] ${prev} → CLOSED (${reason})`);
    }
  }

  private emit(): void {
    if (this.listeners.size === 0) return;
    const snap = this.snapshot();
    for (const listener of this.listeners) {
      try {
        listener(snap);
      } catch {
        // listeners must not break the breaker
      }
    }
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return code ? `${error.name}:${String(code)} (${error.message})` : `${error.name} (${error.message})`;
  }
  return String(error);
}