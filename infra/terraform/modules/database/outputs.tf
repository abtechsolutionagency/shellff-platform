output "endpoint" {
  description = "Database endpoint hostname."
  value       = try(aws_db_instance.this[0].address, null)
}

output "port" {
  description = "Database port."
  value       = try(aws_db_instance.this[0].port, null)
}

output "generated_password" {
  description = "Randomly generated master password when none is supplied."
  value       = try(random_password.master[0].result, null)
  sensitive   = true
}
