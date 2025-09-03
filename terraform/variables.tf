variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-2"
}

// Used for namespacing resources can be injected the ENVIRONMENT variable in CI/CD pipelines
// This will also create APIGW stages with the same name (can be removed if not needed)
variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

// Essentially the name of the stack being deployed
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "serverless-demo-v7"
}

// TODO This is probably fine for now but might consider this to work for individual lambda functions instead of globally
variable "lambda_memory_size" {
  description = "Memory size for Lambda function in MB"
  type        = number
  default     = 128
}

// TODO This is probably fine for now but might consider this to work for individual lambda functions instead of globally
variable "lambda_timeout" {
  description = "Timeout for Lambda function in seconds"
  type        = number
  default     = 10
}

variable "demo_secret_name" {
  description = "Name of the secret to retrieve from AWS Secrets Manager for the demo"
  type        = string
  default     = "demo-secret"
}

# Tagging variables
// Slalom specific for Innovation labs - can be changed to suit your needs
variable "name" {
  type    = string
  default = "Theo Politis"
}

variable "manager" {
  type    = string
  default = "Andy Challis"
}

variable "market" {
  type    = string
  default = "Build"
}

variable "engagement_office" {
  type    = string
  default = "Melbourne"
}

variable "contact_email" {
  type    = string
  default = "theo.politis@slalom.com"
}

variable "allowed_ip" {
  description = "IP address allowed to access the API Gateway (in CIDR notation, e.g., '203.0.113.0/24' for a single IP use '203.0.113.1/32')"
  type        = string
  default     = "175.37.26.175/32"
}

# Common tags to be assigned to all resources
locals {
  common_tags = {
    Name                = var.name
    Manager             = var.manager
    Market              = var.market
    "Engagement Office" = var.engagement_office
    Email               = var.contact_email
    Environment         = var.environment
    Project             = var.project_name
    ManagedBy           = "Terraform"
  }
}
