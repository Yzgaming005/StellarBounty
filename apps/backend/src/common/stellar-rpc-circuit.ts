import { Logger } from '@nestjs/common';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  type CircuitBreakerSnapshot,
} from './circuit-breaker';

/**
 * Convenience: run an RPC operation through the {@link withStellarRpcRetry}
 * helper, gated by the supplied circuit breaker. When the breaker is OPEN the
 * call is rejected immediately with {@link CircuitBreakerOpenError} and the
 * underlying RPC is never invoked.
 */
export async function withStellarRpcCircuit<T>(
  breaker: CircuitBreaker,
  operation: string,
  fn: () => Promise<T>,
  runner: (op: string, inner: () => Promise<T>) => Promise<T>,
): Promise<T> {
  try {
    return await breaker.execute(() => runner(operation, fn));
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      Logger.warn(
        `[${breaker.name}] fast-failed "${operation}" — circuit is OPEN`,
        'StellarRpcCircuit',
      );
    }
    throw error;
  }
}

/**
 * Encode a {@link CircuitBreakerSnapshot.state} as a numeric value for use as
 * a Prometheus gauge label or value (0=closed, 1=half_open, 2=open).
 */
export function circuitStateToNumber(state: CircuitBreakerSnapshot['state']): 0 | 1 | 2 {
  switch (state) {
    case 'closed':
      return 0;
    case 'half_open':
      return 1;
    case 'open':
      return 2;
  }
}