output "primary_endpoint" {
  description = "Primary Redis endpoint."
  value       = try(aws_elasticache_replication_group.this[0].primary_endpoint_address, null)
}

output "auth_token" {
  description = "Generated Redis auth token when one is not provided."
  value       = try(random_password.auth[0].result, null)
  sensitive   = true
}
