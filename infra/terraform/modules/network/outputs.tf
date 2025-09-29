output "vpc_id" {
  description = "Identifier of the created VPC."
  value       = try(aws_vpc.this[0].id, null)
}

output "public_subnet_ids" {
  description = "Identifiers for public subnets."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Identifiers for private subnets."
  value       = aws_subnet.private[*].id
}
