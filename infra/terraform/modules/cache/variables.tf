variable "create_cache" {
  description = "Whether to create the Redis replication group."
  type        = bool
  default     = false
}

variable "engine_version" {
  description = "Redis engine version."
  type        = string
  default     = "7.1"
}

variable "node_type" {
  description = "Instance size for cache nodes."
  type        = string
  default     = "cache.t4g.small"
}

variable "subnet_ids" {
  description = "Subnet identifiers used for the cache subnet group."
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security groups assigned to the cache."
  type        = list(string)
  default     = []
}

variable "auth_token" {
  description = "Optional Redis AUTH token. When omitted one is generated."
  type        = string
  default     = null
  sensitive   = true
}

variable "tags" {
  description = "Common tags applied to provisioned resources."
  type        = map(string)
  default     = {}
}
