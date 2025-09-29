variable "create_bucket" {
  description = "Whether to create the storage bucket."
  type        = bool
  default     = false
}

variable "bucket_name" {
  description = "Name of the S3 bucket used for media ingest."
  type        = string
  default     = "shellff-media"
}

variable "tags" {
  description = "Common tags applied to provisioned resources."
  type        = map(string)
  default     = {}
}
