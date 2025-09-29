variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

# Placeholder RDS instance definition – to be implemented in later slices

output "db_endpoint" {
  value = null
}
