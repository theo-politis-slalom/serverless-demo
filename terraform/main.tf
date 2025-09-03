terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region  = var.aws_region
  profile = "slalom"
  default_tags {
    tags = local.common_tags
  }
}

data "aws_caller_identity" "current" {}

# Common IAM policies for Lambda functions

# CloudWatch Logs policy
resource "aws_iam_policy" "lambda_logging" {
  name        = "${var.project_name}-lambda-logging-${var.environment}"
  description = "IAM policy for Lambda function logging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.project_name}-*:log-stream:*",
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.project_name}-*"
        ]
      }
    ]
  })
}

## Removed unused S3 bucket and S3 access policy (no longer needed since Lambda code is uploaded directly)

# Generate a random password for the demo secret
resource "random_password" "demo_secret" {
  length           = 32
  special          = true
  override_special = "!@#$%^&*()_+-=[]{}|'"
  min_lower        = 5
  min_upper        = 5
  min_numeric      = 5
  min_special      = 5
}

# Create the secret in AWS Secrets Manager
resource "aws_secretsmanager_secret" "demo_secret" {
  # Use a unique, environment-scoped name to avoid collisions with secrets
  # that may be scheduled for deletion (which blocks re-creation of the same name).
  name        = "${var.project_name}-${var.environment}-demo-secret"
  description = "Demo secret for ${var.project_name} application"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-demo-secret"
    }
  )
}

# Set the secret value
resource "aws_secretsmanager_secret_version" "demo_secret_value" {
  secret_id = aws_secretsmanager_secret.demo_secret.id
  secret_string = jsonencode({
    api_key     = "demo-api-key-${random_password.demo_secret.result}"
    db_password = random_password.demo_secret.result
    created_by  = "terraform"
    created_at  = timestamp()
  })

  lifecycle {
    ignore_changes = [
      secret_string
    ]
  }
}

# IAM policy for Secrets Manager access
resource "aws_iam_policy" "secrets_manager_access" {
  name        = "${var.project_name}-secrets-manager-${var.environment}"
  description = "Policy for accessing Secrets Manager from Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.demo_secret.arn,
          "${aws_secretsmanager_secret.demo_secret.arn}*" # For versioned secrets
        ]
      }
    ]
  })
}

# IAM role for name processing Lambda
resource "aws_iam_role" "name_lambda_exec" {
  name = "${var.project_name}-name-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM role for health check Lambda
resource "aws_iam_role" "health_lambda_exec" {
  name = "${var.project_name}-health-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM role for secrets manager demo Lambda
resource "aws_iam_role" "secrets_demo_lambda_exec" {
  name = "${var.project_name}-secrets-demo-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Attach policies to name Lambda role
resource "aws_iam_role_policy_attachment" "name_lambda_logs" {
  role       = aws_iam_role.name_lambda_exec.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

## Removed unused S3 access attachment for name Lambda

# Attach policies to health check Lambda role
resource "aws_iam_role_policy_attachment" "health_lambda_logs" {
  role       = aws_iam_role.health_lambda_exec.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

## Removed unused S3 access attachment for health Lambda

# Attach policies to secrets demo Lambda role
resource "aws_iam_role_policy_attachment" "secrets_demo_lambda_logs" {
  role       = aws_iam_role.secrets_demo_lambda_exec.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

## Removed unused S3 access attachment for secrets demo Lambda

resource "aws_iam_role_policy_attachment" "secrets_demo_lambda_secrets" {
  role       = aws_iam_role.secrets_demo_lambda_exec.name
  policy_arn = aws_iam_policy.secrets_manager_access.arn
}

# Name processing Lambda function
resource "aws_lambda_function" "name" {
  function_name = "${var.project_name}-name-${var.environment}"

  tags = local.common_tags

  filename         = local.lambda_zip_file
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  handler = "dist/handlers/nameHandler.handler"
  runtime = "nodejs18.x"

  role = aws_iam_role.name_lambda_exec.arn

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.name_lambda_logs,
    aws_cloudwatch_log_group.lambda_logs,
    null_resource.build_lambda,
  ]
}

# Health check Lambda function
resource "aws_lambda_function" "health_check" {
  function_name = "${var.project_name}-health-${var.environment}"

  tags = local.common_tags

  filename         = local.lambda_zip_file
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  handler = "dist/handlers/healthCheckHandler.handler"
  runtime = "nodejs18.x"

  role = aws_iam_role.health_lambda_exec.arn

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.health_lambda_logs,
    aws_cloudwatch_log_group.lambda_logs,
    null_resource.build_lambda,
  ]
}

# API Gateway
resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    max_age       = 300
  }

  # Resource policy is now managed separately for API Gateway v2
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.api_gateway.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}

# API Gateway integration for name Lambda
resource "aws_apigatewayv2_integration" "name_integration" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  integration_type   = "AWS_PROXY"
  connection_type    = "INTERNET"
  description        = "Name processing Lambda integration"
  integration_uri    = aws_lambda_function.name.invoke_arn
  integration_method = "POST"
}

# API Gateway integration for health check Lambda
resource "aws_apigatewayv2_integration" "health_integration" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  integration_type   = "AWS_PROXY"
  connection_type    = "INTERNET"
  description        = "Health check Lambda integration"
  integration_uri    = aws_lambda_function.health_check.invoke_arn
  integration_method = "POST"
}

# API Gateway integration for secrets demo Lambda
resource "aws_apigatewayv2_integration" "secrets_demo_integration" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  integration_type   = "AWS_PROXY"
  connection_type    = "INTERNET"
  description        = "Secrets Manager demo Lambda integration"
  integration_uri    = aws_lambda_function.secrets_manager_demo.invoke_arn
  integration_method = "POST"
}

# API routes
resource "aws_apigatewayv2_route" "health_check_route" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /health"
  target             = "integrations/${aws_apigatewayv2_integration.health_integration.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key_auth.id
}

resource "aws_apigatewayv2_route" "name_route" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "POST /name"
  target             = "integrations/${aws_apigatewayv2_integration.name_integration.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key_auth.id
}

# Secrets demo route
resource "aws_apigatewayv2_route" "secrets_demo_route" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /secrets-demo"
  target             = "integrations/${aws_apigatewayv2_integration.secrets_demo_integration.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key_auth.id
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/api-gateway/${var.project_name}-api-${var.environment}"
  retention_in_days = 14
}

# Path for Lambda deployment package (output by archive_file)
locals {
  lambda_zip_file = "${path.module}/../function.zip"
}

# Build the project (compile TS and prune dev deps) deterministically; do not create the ZIP here.
resource "null_resource" "build_lambda" {
  provisioner "local-exec" {
    command = <<EOT
      cd ${path.module}/.. && \
      (npm ci || npm install) && \
      npm run build && \
      npm prune --production
    EOT
  }

  triggers = {
    package_lock_hash = filesha256("${path.module}/../package-lock.json")
    package_json_hash = filesha256("${path.module}/../package.json")
    # Hash contents of all files in src so any edit triggers a rebuild
    src_contents_hash = sha1(join("", [for f in fileset("${path.module}/../src", "**") : filesha256("${path.module}/../src/${f}")]))
    tsconfig_hash     = filesha256("${path.module}/../tsconfig.json")
  }
}

# Create the Lambda ZIP deterministically from the built output and runtime deps
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/.."
  output_path = local.lambda_zip_file

  excludes = [
    ".git/**",
    "terraform/**",
    "src/**",
    "**/*.ts",
    "**/*.map",
    "**/test/**",
    "node_modules/.bin/**"
  ]

  depends_on = [null_resource.build_lambda]
}
# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_name" {
  statement_id  = "AllowExecutionFromAPIGatewayName"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.name.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*/name"
}

resource "aws_lambda_permission" "api_gateway_health" {
  statement_id  = "AllowExecutionFromAPIGatewayHealth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_check.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*/health"
}

# Lambda permission for secrets demo
resource "aws_lambda_permission" "api_gateway_secrets_demo" {
  statement_id  = "AllowExecutionFromAPIGatewaySecretsDemo"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_manager_demo.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*/secrets-demo"
}
# Randomly generated API key for authorizer
resource "random_password" "api_key" {
  length  = 32
  special = false
}

# ---------------------------------------------
# Lambda Authorizer for HTTP API (checks x-api-key)
# ---------------------------------------------
resource "aws_iam_role" "authorizer_lambda_exec" {
  name = "${var.project_name}-authorizer-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "authorizer_lambda_logs" {
  role       = aws_iam_role.authorizer_lambda_exec.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_lambda_function" "api_authorizer" {
  function_name = "${var.project_name}-api-authorizer-${var.environment}"

  tags = local.common_tags

  filename         = local.lambda_zip_file
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  handler = "dist/handlers/authorizerHandler.authorizer"
  runtime = "nodejs18.x"

  # source_code_hash omitted to avoid plan-time file reads

  role = aws_iam_role.authorizer_lambda_exec.arn

  environment {
    variables = {
      API_KEY = random_password.api_key.result
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.authorizer_lambda_logs,
    null_resource.build_lambda,
  ]
}

resource "aws_lambda_permission" "api_gateway_authorizer_invoke" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/authorizers/*"
}

resource "aws_apigatewayv2_authorizer" "api_key_auth" {
  api_id                            = aws_apigatewayv2_api.api_gateway.id
  authorizer_type                   = "REQUEST"
  name                              = "api-key-authorizer"
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  identity_sources                  = ["$request.header.x-api-key"]

  authorizer_uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${aws_lambda_function.api_authorizer.arn}/invocations"
}

# Secrets Manager Demo Lambda function
resource "aws_lambda_function" "secrets_manager_demo" {
  function_name = "${var.project_name}-secrets-demo-${var.environment}"

  tags = local.common_tags

  filename         = local.lambda_zip_file
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  handler = "dist/handlers/secretsManagerDemoHandler.handler"
  runtime = "nodejs18.x"

  # source_code_hash omitted to avoid plan-time file reads

  role = aws_iam_role.secrets_demo_lambda_exec.arn

  environment {
    variables = {
      ENVIRONMENT = var.environment
      SECRET_NAME = aws_secretsmanager_secret.demo_secret.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.secrets_demo_lambda_logs,
    aws_iam_role_policy_attachment.secrets_demo_lambda_secrets,
    aws_cloudwatch_log_group.lambda_logs,
    null_resource.build_lambda,
  ]
}
