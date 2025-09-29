variable "create_app" {
  description = "Whether to provision the ECS service."
  type        = bool
  default     = false
}

variable "cluster_name" {
  description = "Name of the ECS cluster."
  type        = string
  default     = "shellff-cluster"
}

variable "service_name" {
  description = "Name of the ECS service."
  type        = string
  default     = "shellff-api"
}

variable "desired_count" {
  description = "Desired number of running tasks."
  type        = number
  default     = 1
}

variable "task_cpu" {
  description = "Task CPU units."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Task memory in MiB."
  type        = number
  default     = 1024
}

variable "container_image" {
  description = "Container image deployed by the service."
  type        = string
  default     = "public.ecr.aws/docker/library/nginx:stable"
}

variable "subnet_ids" {
  description = "Subnets assigned to the service."
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security groups attached to the service."
  type        = list(string)
  default     = []
}

variable "assign_public_ip" {
  description = "Assign public IPs to service tasks."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags applied to provisioned resources."
  type        = map(string)
  default     = {}
}
