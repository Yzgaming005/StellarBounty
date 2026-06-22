# StellarBounty — Deploy Guide (SSH Key Method)

## Kenapa SSH?
GitHub fine-grained PAT lo **read-only** — gak bisa push code atau comment via API. Solusi: SSH key.

## Step 1: Add SSH Key ke GitHub

```bash
# 1. Tampilin public key
cat ~/.ssh/github_ed25519.pub
```

Outputnya kira-kira gini:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOnFqr4EvdYppT59t4Sam/jPTeEmoqyyZ5f9QpmoKJo0 racingmamang507@gmail.com
```

**2. Copy itu → paste di:**
https://github.com/settings/keys

Klik **New SSH Key** → title: `hermes-agent` → paste → Add SSH Key ✅

## Step 2: Jalanin Push

```bash
cd ~/projects/bounty/StellarBounty

# Test koneksi SSH
ssh -T git@github.com -i ~/.ssh/github_ed25519 -o StrictHostKeyChecking=accept-new

# Set remote ke SSH
git remote set-url origin git@github.com:Yzgaming005/StellarBounty.git

# Push semua branch
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_ed25519 -o StrictHostKeyChecking=accept-new" \
  git push origin fix/issue-202-circuit-breaker

GIT_SSH_COMMAND="ssh -i ~/.ssh/github_ed25519 -o StrictHostKeyChecking=accept-new" \
  git push origin fix/issue-190-precommit-hooks

GIT_SSH_COMMAND="ssh -i ~/.ssh/github_ed25519 -o StrictHostKeyChecking=accept-new" \
  git push origin fix/issue-168-nonce-ttl-config --force
```

## Step 3: Post-Push Checklist

| Branch | PR | Action |
|--------|----|--------|
| `fix/issue-202-circuit-breaker` | #288 | Udah open — comment teknikal (isi dari `pr288-comment.md`) |
| `fix/issue-190-precommit-hooks` | #287 | Udah open — comment teknikal (isi dari `pr287-comment.md`) |
| `fix/issue-168-nonce-ttl-config` | #257 (closed) | Force push → **reopen via GitHub UI** (buka PR#257 → klik `Reopen`) → comment teknikal (isi dari `pr257-comment.md`) |

## Step 4: Paste Technical Comments

Setelah push, paste isi file ini di comment masing-masing PR:

| File | Paste di PR |
|------|-------------|
| `pr288-comment.md` | #288 |
| `pr287-comment.md` | #287 |
| `pr257-comment.md` | #257 (setelah reopen) |

## File READY untuk di-copy:

### PR#288 comment
```markdown
[isi dari pr288-comment.md]
```

### PR#287 comment
```markdown
[isi dari pr287-comment.md]
```

### PR#257 comment
```markdown
[isi dari pr257-comment.md]
```
