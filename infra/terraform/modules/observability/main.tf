resource "aws_cloudwatch_log_group" "this" {
  count             = var.create_observability ? length(var.log_group_names) : 0
  name              = "/aws/shellff/${var.log_group_names[count.index]}"
  retention_in_days = var.retention_in_days

  tags = merge(var.tags, {
    Name = "shellff-${replace(var.log_group_names[count.index], "/", "-")}-logs"
  })
}
