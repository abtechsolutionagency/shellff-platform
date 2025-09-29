variable "create_vpc" {
  description = "Whether to provision a VPC."
  type        = bool
  default     = false
}

variable "cidr_block" {
  description = "Primary CIDR range for the VPC."
  type        = string
  default     = "10.10.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets."
  type        = list(string)
  default     = ["10.10.0.0/24", "10.10.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets."
  type        = list(string)
  default     = ["10.10.10.0/24", "10.10.11.0/24"]
}

variable "availability_zones" {
  description = "AWS availability zones used when subnets are created."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags applied to provisioned resources."
  type        = map(string)
  default     = {}
}
