output "log_group_names" {
  description = "Names of the provisioned log groups."
  value       = aws_cloudwatch_log_group.this[*].name
}
