variable "create_observability" {
  description = "Whether to create observability scaffolding."
  type        = bool
  default     = false
}

variable "log_group_names" {
  description = "CloudWatch log groups to create."
  type        = list(string)
  default     = ["shellff/api", "shellff/web"]
}

variable "retention_in_days" {
  description = "Retention policy for log groups."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags applied to provisioned resources."
  type        = map(string)
  default     = {}
}
