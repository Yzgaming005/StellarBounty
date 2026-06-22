## Summary

Adds pre-commit + pre-push hooks using husky + lint-staged to automate code quality gates (#190).

## Changes
- **`.husky/pre-commit`**: runs `lint-staged` on staged files (prettier → eslint for TS/JS, prettier for JSON/MD/YAML, `cargo fmt --check` for Rust)
- **`.husky/pre-push`**: smart workspace test runner — only runs tests for workspaces with changed files (detects via `git diff` against the remote tip). Supports `HUSKY_PRE_PUSH_FORCE=1` and `HUSKY_PRE_PUSH_SKIP=1` env vars.
- **`CONTRIBUTING.md`**: documents the hook flow

## Verification
```bash
# After npm install (triggers husky prepare):
ls -la .husky/pre-commit .husky/pre-push

# Test commit:
git add some-file.ts
git commit -m "test"  # should run lint-staged

# Test push:
git push  # should run workspace tests for changed dirs

# Skip hook for emergency:
git push --no-verify
# or: HUSKY_PRE_PUSH_SKIP=1 git push
```

## Trade-offs
- First `git push` is slower (installs `lint-staged` + runs tests) but subsequent pushes are fast (only changed workspace)
- `lint-staged` config in `package.json` uses `--max-warnings=0` on eslint — any warning blocks commit. Strict but catches issues early.
