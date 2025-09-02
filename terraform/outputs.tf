output "api_base_url" {
  description = "API Gateway base invoke URL"
  value       = aws_apigatewayv2_stage.api_stage.invoke_url
}

output "health_endpoint" {
  description = "Health check endpoint"
  value       = "${aws_apigatewayv2_stage.api_stage.invoke_url}/health"
}

output "name_endpoint" {
  description = "Name processing endpoint"
  value       = "${aws_apigatewayv2_stage.api_stage.invoke_url}/name"
}

output "secrets_demo_endpoint" {
  description = "Secrets Manager demo endpoint"
  value       = "${aws_apigatewayv2_stage.api_stage.invoke_url}/secrets-demo"
}

output "api_key" {
  description = "Randomly generated API key to be supplied in the x-api-key header"
  value       = random_password.api_key.result
  sensitive   = true
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group for Lambda function"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "api_gateway_log_group" {
  description = "CloudWatch Log Group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.name
}
