terraform {
  backend "s3" {
    bucket = "aztec-terraform"
    key    = "setup/setup-mpc-server"
    region = "eu-west-2"
  }
}

data "terraform_remote_state" "setup_iac" {
  backend = "s3"
  config = {
    bucket = "aztec-terraform"
    key    = "setup/setup-iac"
    region = "eu-west-2"
  }
}

provider "aws" {
  profile = "default"
  region  = "eu-west-2"
}

resource "aws_service_discovery_service" "setup_mpc_server" {
  name = "setup-mpc-server"

  health_check_custom_config {
    failure_threshold = 1
  }

  dns_config {
    namespace_id = data.terraform_remote_state.setup_iac.outputs.local_service_discovery_id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }
}

# Create EC2 instances in each AZ.
# resource "aws_instance" "container_instance_az1" {
#   ami                    = "ami-08ebd554ebc53fa9f"
#   instance_type          = "m5.large"
#   subnet_id              = data.terraform_remote_state.setup_iac.outputs.subnet_az1_private_id
#   vpc_security_group_ids = [data.terraform_remote_state.setup_iac.outputs.security_group_private_id]
#   iam_instance_profile   = data.terraform_remote_state.setup_iac.outputs.ecs_instance_profile_name
#   key_name               = data.terraform_remote_state.setup_iac.outputs.ecs_instance_key_pair_name
#   availability_zone      = "eu-west-2a"

#   user_data = <<USER_DATA
# #!/bin/bash
# echo ECS_CLUSTER=${data.terraform_remote_state.setup_iac.outputs.ecs_cluster_name} >> /etc/ecs/ecs.config
# echo 'ECS_INSTANCE_ATTRIBUTES={"group": "setup-mpc-server"}' >> /etc/ecs/ecs.config
# USER_DATA

#   tags = {
#     Name = "setup-container-instance-az1"
#   }
# }

# resource "aws_instance" "container_instance_az2" {
#   ami                    = "ami-08ebd554ebc53fa9f"
#   instance_type          = "m5.2xlarge"
#   subnet_id              = data.terraform_remote_state.setup_iac.outputs.subnet_az2_private_id
#   vpc_security_group_ids = [data.terraform_remote_state.setup_iac.outputs.security_group_private_id]
#   iam_instance_profile   = data.terraform_remote_state.setup_iac.outputs.ecs_instance_profile_name
#   key_name               = data.terraform_remote_state.setup_iac.outputs.ecs_instance_key_pair_name
#   availability_zone      = "eu-west-2b"

#   user_data = <<USER_DATA
# #!/bin/bash
# echo ECS_CLUSTER=${data.terraform_remote_state.setup_iac.outputs.ecs_cluster_name} >> /etc/ecs/ecs.config
# echo 'ECS_INSTANCE_ATTRIBUTES={"group": "setup-mpc-server"}' >> /etc/ecs/ecs.config
# USER_DATA

#   tags = {
#     Name = "setup-container-instance-az2"
#   }
# }

# Configure an EFS filesystem for holding transcripts and state data, mountable in each AZ.
resource "aws_efs_file_system" "setup_data_store" {
  creation_token = "setup-data-store"

  tags = {
    Name = "setup-data-store"
  }

  lifecycle_policy {
    transition_to_ia = "AFTER_14_DAYS"
  }
}

resource "aws_efs_mount_target" "private_az1" {
  file_system_id  = aws_efs_file_system.setup_data_store.id
  subnet_id       = data.terraform_remote_state.setup_iac.outputs.subnet_az1_private_id
  security_groups = [data.terraform_remote_state.setup_iac.outputs.security_group_private_id]
}

resource "aws_efs_mount_target" "private_az2" {
  file_system_id  = aws_efs_file_system.setup_data_store.id
  subnet_id       = data.terraform_remote_state.setup_iac.outputs.subnet_az2_private_id
  security_groups = [data.terraform_remote_state.setup_iac.outputs.security_group_private_id]
}

# Define task definition and service.
resource "aws_ecs_task_definition" "setup_mpc_server" {
  family                   = "setup-mpc-server"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = data.terraform_remote_state.setup_iac.outputs.ecs_task_execution_role_arn
  task_role_arn            = aws_iam_role.setup_mpc_server_task_role.arn

  volume {
    name = "efs-data-store"
    efs_volume_configuration {
      file_system_id = aws_efs_file_system.setup_data_store.id
      root_directory = "/"
      # scope         = "shared"
      # autoprovision = true
      # driver        = "local"
      # driver_opts = {
      #   type   = "nfs"
      #   device = "${aws_efs_file_system.setup_data_store.dns_name}:/"
      #   o      = "addr=${aws_efs_file_system.setup_data_store.dns_name},nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2"
      # }
    }
  }

  container_definitions = <<DEFINITIONS
[
  {
    "name": "setup-mpc-server",
    "image": "278380418400.dkr.ecr.eu-west-2.amazonaws.com/setup-mpc-server:latest",
    "essential": true,
    "memoryReservation": 256,
    "portMappings": [
      {
        "containerPort": 80
      }
    ],
    "environment": [
      {
        "name": "NODE_ENV",
        "value": "production"
      },
      {
        "name": "JOB_SERVER_HOST",
        "value": "job-server.local"
      },
      {
        "name": "INFURA_API_KEY",
        "value": "${var.INFURA_API_KEY}"
      }
    ],
    "mountPoints": [
      {
        "containerPath": "/usr/src/setup-mpc-server/store",
        "sourceVolume": "efs-data-store"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/fargate/service/setup-mpc-server",
        "awslogs-region": "eu-west-2",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }
]
DEFINITIONS
}

data "aws_ecs_task_definition" "setup_mpc_server" {
  task_definition = aws_ecs_task_definition.setup_mpc_server.family
}

resource "aws_ecs_service" "setup_mpc_server" {
  name                               = "setup-mpc-server"
  cluster                            = data.terraform_remote_state.setup_iac.outputs.ecs_cluster_id
  launch_type                        = "FARGATE"
  desired_count                      = "1"
  deployment_maximum_percent         = 100
  deployment_minimum_healthy_percent = 0
  platform_version                   = "1.4.0"

  network_configuration {
    subnets = [
      data.terraform_remote_state.setup_iac.outputs.subnet_az1_private_id,
      data.terraform_remote_state.setup_iac.outputs.subnet_az2_private_id
    ]
    security_groups = [data.terraform_remote_state.setup_iac.outputs.security_group_private_id]
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.setup_mpc_server.arn
    container_name   = "setup-mpc-server"
    container_port   = 80
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.setup_mpc_server_internal.arn
    container_name   = "setup-mpc-server"
    container_port   = 80
  }

  service_registries {
    registry_arn = aws_service_discovery_service.setup_mpc_server.arn
  }

  # placement_constraints {
  #   type       = "memberOf"
  #   expression = "attribute:group == setup-mpc-server"
  # }

  task_definition = "${aws_ecs_task_definition.setup_mpc_server.family}:${max(aws_ecs_task_definition.setup_mpc_server.revision, data.aws_ecs_task_definition.setup_mpc_server.revision)}"
}

# Logs
resource "aws_cloudwatch_log_group" "setup_mpc_server_logs" {
  name              = "/fargate/service/setup-mpc-server"
  retention_in_days = "14"
}

# Configure ALB to route /api to server.
resource "aws_alb_target_group" "setup_mpc_server" {
  name                 = "setup-mpc-server"
  port                 = "80"
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = data.terraform_remote_state.setup_iac.outputs.vpc_id
  deregistration_delay = 5

  health_check {
    path              = "/api"
    matcher           = "200"
    interval          = 5
    healthy_threshold = 2
    timeout           = 3
  }

  tags = {
    name = "setup-mpc-server"
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = data.terraform_remote_state.setup_iac.outputs.alb_listener_arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.setup_mpc_server.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# Create S3 bucket for publishing transcripts, and IAM role with write access to bucket.
data "aws_iam_policy_document" "ecs_task" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "setup_mpc_server_task_role" {
  name               = "setup-mpc-server-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task.json
}

data "aws_iam_policy_document" "aztec_ignition_bucket_write" {
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.aztec_ignition.arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:*"]
    resources = ["${aws_s3_bucket.aztec_ignition.arn}/*"]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.aztec_post_process.arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:*"]
    resources = ["${aws_s3_bucket.aztec_post_process.arn}/*"]
  }
}

resource "aws_iam_role_policy" "setup_mpc_server_task_policy" {
  policy = data.aws_iam_policy_document.aztec_ignition_bucket_write.json
  role   = aws_iam_role.setup_mpc_server_task_role.id
}

resource "aws_s3_bucket" "aztec_ignition" {
  bucket = "aztec-ignition"
  acl    = "public-read"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# Create post processing bucket in us-east-2.
provider "aws" {
  alias  = "us-east-2"
  region = "us-east-2"
}

resource "aws_s3_bucket" "aztec_post_process" {
  provider = aws.us-east-2
  bucket   = "aztec-post-process"
}

# WAF rules for DDOS protection.
resource "aws_wafregional_ipset" "ipset" {
  name = "setup-ipset"
}

resource "aws_wafregional_rate_based_rule" "wafrule" {
  depends_on  = [aws_wafregional_ipset.ipset]
  name        = "rate-limit"
  metric_name = "rateLimit"

  rate_key   = "IP"
  rate_limit = 3000

  predicate {
    data_id = aws_wafregional_ipset.ipset.id
    negated = false
    type    = "IPMatch"
  }
}

resource "aws_wafregional_web_acl" "acl" {
  name        = "setup-acl"
  metric_name = "setupAcl"
  default_action {
    type = "ALLOW"
  }
  rule {
    type = "RATE_BASED"
    action {
      type = "BLOCK"
    }
    priority = 1
    rule_id  = aws_wafregional_rate_based_rule.wafrule.id
  }
}

resource "aws_wafregional_web_acl_association" "acl_association" {
  resource_arn = data.terraform_remote_state.setup_iac.outputs.alb_arn
  web_acl_id   = aws_wafregional_web_acl.acl.id
}

# Need an internal load balancer for our service endpoint for access via VPC peering.
resource "aws_lb" "internal" {
  name               = "setup-mpc-server"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [data.terraform_remote_state.setup_iac.outputs.security_group_private_id]
  subnets = [
    data.terraform_remote_state.setup_iac.outputs.subnet_az1_private_id,
    data.terraform_remote_state.setup_iac.outputs.subnet_az2_private_id
  ]

  tags = {
    name = "setup-job-server"
  }
}

resource "aws_alb_target_group" "setup_mpc_server_internal" {
  name                 = "setup-mpc-server-internal"
  port                 = "80"
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = data.terraform_remote_state.setup_iac.outputs.vpc_id
  deregistration_delay = 5

  health_check {
    path              = "/api"
    matcher           = "200"
    interval          = 5
    healthy_threshold = 2
    timeout           = 3
  }

  tags = {
    name = "setup-mpc-server"
  }
}

resource "aws_lb_listener" "listener" {
  load_balancer_arn = aws_lb.internal.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.setup_mpc_server_internal.arn
  }
}
