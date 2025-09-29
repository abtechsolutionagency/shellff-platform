locals {
  azs = length(var.availability_zones) > 0 ? var.availability_zones : []
}

resource "aws_vpc" "this" {
  count             = var.create_vpc ? 1 : 0
  cidr_block        = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "shellff-core-vpc"
  })
}

resource "aws_subnet" "public" {
  count             = var.create_vpc ? length(var.public_subnet_cidrs) : 0
  vpc_id            = aws_vpc.this[0].id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = length(local.azs) > count.index ? local.azs[count.index] : null
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "shellff-public-${count.index}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  count             = var.create_vpc ? length(var.private_subnet_cidrs) : 0
  vpc_id            = aws_vpc.this[0].id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = length(local.azs) > count.index ? local.azs[count.index] : null

  tags = merge(var.tags, {
    Name = "shellff-private-${count.index}"
    Tier = "private"
  })
}

resource "aws_internet_gateway" "this" {
  count  = var.create_vpc ? 1 : 0
  vpc_id = aws_vpc.this[0].id

  tags = merge(var.tags, {
    Name = "shellff-igw"
  })
}

resource "aws_route_table" "public" {
  count  = var.create_vpc ? 1 : 0
  vpc_id = aws_vpc.this[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this[0].id
  }

  tags = merge(var.tags, {
    Name = "shellff-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = var.create_vpc ? length(aws_subnet.public) : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}
