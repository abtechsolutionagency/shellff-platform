output "cluster_id" {
  description = "Identifier of the ECS cluster."
  value       = try(aws_ecs_cluster.this[0].id, null)
}

output "service_name" {
  description = "Name of the ECS service."
  value       = try(aws_ecs_service.this[0].name, null)
}
