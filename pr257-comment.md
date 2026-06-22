## Summary

Reopening PR#257 with a rebased, conflict-free version of `fix/issue-168-nonce-ttl-config`.

## Changes (rebased on latest `main`)
- **`.env.example`**: documents both `AUTH_NONCE_TTL_MS` (legacy) and `NONCE_TTL_MS` (new alias)
- **`app.module.ts`**: validates both env vars with Joi (backward compatible)
- **`auth.service.ts`**: caches `nonceTtlMs` at constructor time with priority: `AUTH_NONCE_TTL_MS` > `NONCE_TTL_MS` > 300000 default
- **`auth.service.spec.ts`**: updated constructor call

## Why this approach
- `AUTH_NONCE_TTL_MS` kept as fallback for existing deployments — zero breaking change
- Cached at construction time vs per-request `ConfigService.get()` — minor perf improvement
- Joi validation ensures env value is positive integer

## Testing
```bash
npx jest apps/backend/src/auth/auth.service.spec.ts --verbose
```

## Manual verification
```bash
# With AUTH_NONCE_TTL_MS=60000 — challenge nonce expires in 1 minute
# With NONCE_TTL_MS=120000 — challenge nonce expires in 2 minutes
# With neither — defaults to 5 minutes
```
