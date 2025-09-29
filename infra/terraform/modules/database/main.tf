resource "random_password" "master" {
  count   = var.create_db && var.master_password == null ? 1 : 0
  length  = 20
  special = true
}

resource "aws_db_subnet_group" "this" {
  count      = var.create_db && length(var.subnet_ids) > 0 ? 1 : 0
  name       = "shellff-db-subnets"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "shellff-db-subnets"
  })
}

resource "aws_db_instance" "this" {
  count                     = var.create_db ? 1 : 0
  identifier                = "shellff-core-db"
  engine                    = "postgres"
  engine_version            = var.engine_version
  instance_class            = var.instance_class
  allocated_storage         = var.allocated_storage
  db_name                   = var.db_name
  username                  = var.master_username
  password                  = coalesce(var.master_password, try(random_password.master[0].result, null))
  apply_immediately         = true
  skip_final_snapshot       = true
  publicly_accessible       = false
  storage_encrypted         = true
  backup_retention_period   = 7
  vpc_security_group_ids    = var.vpc_security_group_ids
  db_subnet_group_name      = try(aws_db_subnet_group.this[0].name, null)
  auto_minor_version_upgrade = true

  tags = merge(var.tags, {
    Name = "shellff-core-db"
  })
}
