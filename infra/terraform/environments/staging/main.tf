locals {
  tags = merge(var.tags, {
    ManagedBy = "Terraform"
  })
}

module "network" {
  source = "../../modules/network"

  create_vpc          = var.create_vpc
  cidr_block          = "10.40.0.0/16"
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones  = var.availability_zones
  tags                = local.tags
}

module "database" {
  source = "../../modules/database"

  create_db               = var.create_database
  subnet_ids              = module.network.private_subnet_ids
  vpc_security_group_ids  = []
  tags                    = local.tags
}

module "cache" {
  source = "../../modules/cache"

  create_cache        = var.create_cache
  subnet_ids          = module.network.private_subnet_ids
  security_group_ids  = []
  tags                = local.tags
}

module "storage" {
  source = "../../modules/storage"

  create_bucket = var.create_storage
  bucket_name   = "shellff-staging-media"
  tags          = local.tags
}

module "observability" {
  source = "../../modules/observability"

  create_observability = var.create_observability
  log_group_names      = ["api", "web", "workers"]
  tags                 = local.tags
}

module "app" {
  source = "../../modules/app"

  create_app         = var.create_app
  subnet_ids         = module.network.private_subnet_ids
  security_group_ids = []
  tags               = local.tags
}
