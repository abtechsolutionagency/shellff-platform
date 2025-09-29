variable "create_db" {
  description = "Whether to create the Postgres instance."
  type        = bool
  default     = false
}

variable "db_name" {
  description = "Database name used during initial provisioning."
  type        = string
  default     = "shellff"
}

variable "master_username" {
  description = "Admin username for the database."
  type        = string
  default     = "shellff_admin"
}

variable "master_password" {
  description = "Optional admin password. When omitted a random password is generated."
  type        = string
  default     = null
  sensitive   = true
}

variable "allocated_storage" {
  description = "Allocated storage for the database in GB."
  type        = number
  default     = 20
}

variable "engine_version" {
  description = "Postgres engine version."
  type        = string
  default     = "15.7"
}

variable "instance_class" {
  description = "Instance class for RDS."
  type        = string
  default     = "db.t4g.micro"
}

variable "subnet_ids" {
  description = "Private subnet identifiers used for the DB subnet group."
  type        = list(string)
  default     = []
}

variable "vpc_security_group_ids" {
  description = "Security groups associated with the database instance."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags applied to provisioned resources."
  type        = map(string)
  default     = {}
}
