## Summary

Improves the CircuitBreaker PR (#288) with value beyond the base requirement.

## Changes
- **+4 edge-case tests** (was 8 → now 12): `failureThreshold=0` opens immediately, `cooldownMs=0` instant recovery, unsubscribed listener isolation, subscriber crash resilience
- **JSDoc on `CircuitBreakerManager`**: comprehensive usage example with fallback pattern
- **README Architecture section**: documents circuit breaker states (closed → open → half_open) and config options (`failureThreshold`, `failureWindowMs`, `cooldownMs`, `CIRCUIT_BREAKER_DISABLED`)

## Why this approach
- Uses `ConfigService.get()` with fallback chain (legacy `AUTH_NONCE_TTL_MS` → new `NONCE_TTL_MS`)
- Sliding window for failure counting prevents transient blips from opening the circuit
- Lazy half-open transition (only on next `execute()` call) avoids unnecessary timers

## Testing
```bash
npx jest apps/backend/src/common/circuit-breaker.spec.ts --verbose
```
Expected: 12 passed, 0 failed.

## Manual verification
```bash
# When deployed — health endpoint
curl http://localhost:4000/health

# Circuit breaker logs when RPC fails
# Look for "[circuit-name] CLOSED → OPEN (5 consecutive failures...)"
# Look for "[circuit-name] OPEN → HALF_OPEN (cooldown of 30000ms elapsed)"
```

## Trade-offs
- Constructor injection of `ConfigService` means tests need to mock `get()` calls
- Sliding window array grows with each failure within the window — acceptable for <100 failures/min
