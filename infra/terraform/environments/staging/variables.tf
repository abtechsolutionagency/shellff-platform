variable "aws_region" {
  description = "AWS region for the staging environment."
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    Project = "Shellff"
    Env     = "staging"
  }
}

variable "create_vpc" {
  description = "Enable VPC provisioning."
  type        = bool
  default     = false
}

variable "create_database" {
  description = "Enable Postgres provisioning."
  type        = bool
  default     = false
}

variable "create_cache" {
  description = "Enable Redis provisioning."
  type        = bool
  default     = false
}

variable "create_storage" {
  description = "Enable S3 bucket provisioning."
  type        = bool
  default     = false
}

variable "create_observability" {
  description = "Enable observability resources."
  type        = bool
  default     = false
}

variable "create_app" {
  description = "Enable ECS service provisioning."
  type        = bool
  default     = false
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks."
  type        = list(string)
  default     = []
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks."
  type        = list(string)
  default     = []
}

variable "availability_zones" {
  description = "Availability zones used across modules."
  type        = list(string)
  default     = []
}
