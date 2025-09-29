# Local Docker Stack

Run docker-compose up -d from the repository root to start:
- Postgres 15 (port 5432)
- Redis 7 (port 6379)
- MinIO (S3 API) with console (ports 9000/9001)
- Prometheus placeholder (9090) for metrics collection

After containers are ready run the database seed script from install/scripts. Services are intentionally lightweight and can be replaced with cloud resources when deploying.
