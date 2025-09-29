# Shellff Installation Toolkit

Slice 0 requires reproducible onboarding for every contributor. The install/ directory centralises environment configuration, bootstrap scripts, and operational checklists.

## Contents
- .env.example – canonical environment variables for local development.
- scripts/bootstrap.ps1 / scripts/bootstrap.sh – guided setup for Windows and Unix shells.
- scripts/seed.ps1 – helper to run Prisma migrations and seed data via pnpm.
- docker/README.md – runtime notes for the local Docker stack.

## Usage
1. Copy .env.example to .env in the repository root or package specific files as needed.
2. Run the appropriate bootstrap script to verify tooling versions and prepare the workspace.
3. Start Docker services with docker-compose up -d from the repository root.
4. Execute pnpm run db:migrate (see scripts) after dependencies are installed.

All scripts are idempotent and safe to run multiple times. Update this toolkit each slice when new services or secrets are introduced.
