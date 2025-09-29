# Shellff Terraform Skeleton

This baseline enables infrastructure work to evolve slice by slice without blocking development. It defines placeholders for VPC, RDS, Redis, S3-compatible storage, and ECS services.

## Structure
- modules/ – shared modules for network, database, cache, storage, and observability.
- environments/staging – example environment wiring the modules together.

All resources are disabled by default (no providers configured). Fill in variables and remote backends per environment before applying. Run 	erraform init inside each environment and commit only .tf sources—never .tfstate files.
