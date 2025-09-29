output "bucket_id" {
  description = "Identifier of the media bucket."
  value       = try(aws_s3_bucket.this[0].id, null)
}
