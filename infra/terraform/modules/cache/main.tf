resource "random_password" "auth" {
  count   = var.create_cache && var.auth_token == null ? 1 : 0
  length  = 32
  special = false
}

resource "aws_elasticache_subnet_group" "this" {
  count      = var.create_cache && length(var.subnet_ids) > 0 ? 1 : 0
  name       = "shellff-cache-subnets"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "shellff-cache-subnets"
  })
}

resource "aws_elasticache_replication_group" "this" {
  count = var.create_cache ? 1 : 0

  replication_group_id          = "shellff-core-cache"
  description                   = "Shellff slice 0 cache"
  node_type                     = var.node_type
  engine                        = "redis"
  engine_version                = var.engine_version
  port                          = 6379
  automatic_failover_enabled    = true
  multi_az_enabled              = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  auth_token                    = coalesce(var.auth_token, try(random_password.auth[0].result, null))
  security_group_ids            = var.security_group_ids
  subnet_group_name             = try(aws_elasticache_subnet_group.this[0].name, null)

  tags = merge(var.tags, {
    Name = "shellff-core-cache"
  })
}
