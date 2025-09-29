terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source              = "../../modules/network"
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnets
  private_subnet_cidrs = var.private_subnets
  tags = var.tags
}

variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "vpc_cidr" {
  type    = string
  default = "10.10.0.0/16"
}

variable "public_subnets" {
  type    = list(string)
  default = ["10.10.1.0/24", "10.10.2.0/24"]
}

variable "private_subnets" {
  type    = list(string)
  default = ["10.10.11.0/24", "10.10.12.0/24"]
}

variable "tags" {
  type    = map(string)
  default = {
    project = "shellff"
    env     = "staging"
  }
}
