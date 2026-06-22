#!/bin/bash
# Push all uncommitted StellarBounty improvements
# Usage: bash push-all.sh
# First: add SSH key to GitHub → https://github.com/settings/keys
# Key to add: ~/.ssh/github_ed25519.pub

set -e
cd "$(dirname "$0")"

echo "=== PR#288 CircuitBreaker ==="
git push origin fix/issue-202-circuit-breaker

echo "=== PR#287 Husky hooks (need rebase check) ==="
git push origin fix/issue-190-precommit-hooks

echo "=== PR#257 Nonce TTL (reopened) ==="
git push origin fix/issue-168-nonce-ttl-config

echo ""
echo "=== DONE ==="
echo "After push, post technical comments on each PR"
