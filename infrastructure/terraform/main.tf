terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.0" }
  }
  backend "s3" {
    bucket = "learning-platform-terraform-state"
    key = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type = string
  default = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type = string
  default = "production"
}

variable "db_password" {
  description = "Database password"
  type = string
  sensitive = true
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "learning-platform-${var.environment}" }
}

resource "aws_subnet" "public" {
  count = 2
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.${count.index}.0/24"
  availability_zone = "${var.aws_region}${count.index == 0 ? 'a' : 'b'}"
  map_public_ip_on_launch = true
  tags = { Name = "learning-platform-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count = 2
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.${count.index + 10}.0/24"
  availability_zone = "${var.aws_region}${count.index == 0 ? 'a' : 'b'}"
  tags = { Name = "learning-platform-private-${count.index}" }
}

resource "aws_db_instance" "postgres" {
  identifier = "learning-platform-${var.environment}"
  engine = "postgres"
  engine_version = "16"
  instance_class = "db.t3.medium"
  allocated_storage = 100
  db_name = "learning_platform"
  username = "app"
  password = var.db_password
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name = aws_db_subnet_group.main.name
  skip_final_snapshot = true
  tags = { Name = "learning-platform-db" }
}

resource "aws_db_subnet_group" "main" {
  name = "learning-platform-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "database" {
  vpc_id = aws_vpc.main.id
  name = "learning-platform-db-${var.environment}"
  ingress {
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id = "learning-platform-${var.environment}"
  engine = "redis"
  node_type = "cache.t3.micro"
  num_cache_nodes = 1
  parameter_group_name = "default.redis7"
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
}

resource "aws_elasticache_subnet_group" "main" {
  name = "learning-platform-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "redis" {
  vpc_id = aws_vpc.main.id
  name = "learning-platform-redis-${var.environment}"
  ingress {
    from_port = 6379
    to_port = 6379
    protocol = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

resource "aws_eks_cluster" "main" {
  name = "learning-platform-${var.environment}"
  role_arn = aws_iam_role.eks.arn
  vpc_config {
    subnet_ids = aws_subnet.public[*].id
  }
}

resource "aws_iam_role" "eks" {
  name = "learning-platform-eks-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

output "database_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}