# Contributing to StellarBounty

Welcome, and thank you for your interest in contributing to StellarBounty!

## Review Assignment Process

We use a `.github/CODEOWNERS` file to automatically assign pull requests to the appropriate domain experts based on the files modified:

- **Contracts** (`apps/contracts/`): assigned to Soroban/Rust reviewers (`@bounty-team/contracts-reviewers`)
- **Backend** (`apps/backend/`): assigned to NestJS/TypeScript reviewers (`@bounty-team/backend-reviewers`)
- **Frontend** (`apps/frontend/`): assigned to Next.js/React reviewers (`@bounty-team/frontend-reviewers`)
- **CI/Infrastructure** (`.github/`): assigned to DevOps reviewers (`@bounty-team/devops-reviewers`)
- **Root config files** (`docker-compose.yml`, `.env.example`): assigned to all reviewers (`@bounty-team/maintainers`)

When you create a Pull Request, the appropriate reviewers will be automatically requested. Please address their feedback to get your PR merged.
