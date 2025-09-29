variable "vpc_cidr" {
  description = "CIDR block for the Shellff VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet CIDRs"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "Private subnet CIDRs"
}

variable "tags" {
  type    = map(string)
  default = {}
}

# Placeholder resources – implement when infra slice progresses
# resource "aws_vpc" "this" { ... }

output "vpc_id" {
  description = "ID of the created VPC"
  value       = null
}
