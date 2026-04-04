terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_security_group" "k8s_sg" {
  name        = "movie-app-k8s-sg"
  description = "Security group for Kubernetes nodes"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "k8s_master" {
  ami             = var.ami_id
  instance_type   = "t2.medium"
  key_name        = var.key_name
  security_groups = [aws_security_group.k8s_sg.name]
  tags = { Name = "movie-app-master", Role = "master" }
}

resource "aws_instance" "k8s_worker" {
  count           = 2
  ami             = var.ami_id
  instance_type   = "t2.micro"
  key_name        = var.key_name
  security_groups = [aws_security_group.k8s_sg.name]
  tags = { Name = "movie-app-worker-${count.index + 1}", Role = "worker" }
}

output "master_ip"  { value = aws_instance.k8s_master.public_ip }
output "worker_ips" { value = aws_instance.k8s_worker[*].public_ip }
