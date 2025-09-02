# Serverless API on AWS with Terraform and TypeScript

This project demonstrates a production-ready serverless application on AWS using:
- AWS Lambda with TypeScript for type-safe serverless functions
- API Gateway for HTTP API
- AWS Secrets Manager for secure secret management
- CloudWatch for logging and monitoring
- S3 for Lambda deployment packages
- IAM for fine-grained permissions
- Node.js 18.x runtime
- Repository and Service pattern for clean architecture

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform (>= 1.2.0)
3. Node.js 18.x and npm (for local development and building)
4. TypeScript (installed as a dev dependency)

## Project Structure

```
.
├── terraform/                 # Infrastructure as Code (Terraform)
│   ├── main.tf               # Main Terraform configuration
│   ├── variables.tf          # Variable declarations
│   └── outputs.tf            # Output values
│
├── src/                       # Application source code
│   ├── clients/              # AWS service clients and wrappers
│   │   └── secretsManager.ts # Secrets Manager client with caching
│   │
│   ├── handlers/             # Lambda function handlers
│   │   ├── healthCheckHandler.ts
│   │   ├── nameHandler.ts
│   │   └── secretsManagerDemoHandler.ts
│   │
│   ├── models/               # Data models and interfaces
│   │   └── nameModel.ts
│   │
│   ├── services/             # Business logic layer
│   │   ├── healthCheckService.ts
│   │   └── nameService.ts
│   │
│   └── utils/                # Shared utilities
│       ├── errorHandler.ts   # Centralized error handling
│       ├── validation.ts     # Request validation
│       └── numbers.ts        # Number utilities
│
├── package.json              # Node.js dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Repository and Service Pattern

The application follows the Repository and Service pattern for clean separation of concerns:

1. **Handlers** - Handle HTTP requests/responses, input validation, and error handling
2. **Services** - Contain business logic, orchestrate data flow, and apply business rules
3. **Clients** - Interact with external services (AWS services, databases, etc.)
4. **Models** - Define data structures and validation schemas

This separation makes the code more maintainable, testable, and follows the Single Responsibility Principle.

### Example Flow
1. API Gateway receives a request and routes it to the appropriate Lambda handler
2. Handler validates the request and extracts necessary data
3. Handler calls the appropriate service method with the processed data
4. Service contains business logic and coordinates between different clients
5. Clients handle communication with external services (e.g., AWS Secrets Manager)
6. Response flows back through the same chain with proper error handling

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Lambda Function**
   ```bash
   npm run build
   ```

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- Terraform (>= 1.2.0)
- Node.js 18.x and npm
- TypeScript (installed as a dev dependency)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application
```bash
npm run build
```

### 3. Initialize Terraform
```bash
cd terraform
terraform init
```

### 4. Review the Execution Plan
```bash
terraform plan \
  -var="environment=dev" \
  -var="aws_region=us-east-1" \
  -var="demo_secret_name=your-secret-name"
```

### 5. Deploy the Infrastructure
```bash
terraform apply \
  -var="environment=dev" \
  -var="aws_region=us-east-1" \
  -var="demo_secret_name=your-secret-name"
```

This will:
- Package the application code
- Create/update all necessary AWS resources
- Configure API Gateway routes
- Set up IAM roles and permissions
- Configure environment variables

### 6. Test the API
After deployment, you'll receive the API endpoint in the outputs. Test the endpoints:

```bash
# Health check
curl "$(terraform output -raw api_endpoint)/health"

# Name endpoint (POST)
curl -X POST "$(terraform output -raw api_endpoint)/name" \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'

# Secrets Manager Demo (GET)
curl "$(terraform output -raw api_endpoint)/demo"
```

## Environment Variables

The following environment variables are used by the application:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Deployment environment (dev/staging/prod) | - | Yes |
| `AWS_REGION` | AWS region for services | us-east-1 | No |
| `DEMO_SECRET_NAME` | Name of the secret in AWS Secrets Manager | demo-secret | No |

## API Endpoints

### Health Check
- **GET** `/health`
  - Returns service health status and system information
  - Example: `curl "https://your-api.execute-api.region.amazonaws.com/health"`

### Name Service
- **POST** `/name`
  - Accepts a JSON body with a `name` field
  - Returns a greeting message
  - Example:
    ```bash
    curl -X POST "https://your-api.execute-api.region.amazonaws.com/name" \
      -H "Content-Type: application/json" \
      -d '{"name": "John"}'
    ```

### Secrets Manager Demo
- **GET** `/demo`
  - Demonstrates retrieving a secret from AWS Secrets Manager
  - Uses the secret name from `DEMO_SECRET_NAME` environment variable
  - Example: `curl "https://your-api.execute-api.region.amazonaws.com/demo"`

## Clean Up

To destroy all created resources and avoid unnecessary AWS charges:

```bash
cd terraform
terraform destroy \
  -var="environment=dev" \
  -var="aws_region=us-east-1"
```

## Monitoring and Logging

- **CloudWatch Logs**: All Lambda functions and API Gateway requests are logged to CloudWatch
- **Error Handling**: Centralized error handling with appropriate HTTP status codes
- **Structured Logging**: JSON-formatted logs for easier querying and analysis

## Security Considerations

- Least privilege IAM roles are used for all AWS resources
- Secrets are stored in AWS Secrets Manager (not in environment variables or code)
- API Gateway has appropriate CORS and security headers
- All resources are tagged for cost allocation and management

## Features

- **TypeScript Support**: Type-safe Lambda functions with full AWS Lambda type definitions
- **Logging**: Comprehensive CloudWatch logging for both API Gateway and Lambda
- **CORS**: Pre-configured CORS settings for web applications
- **Versioning**: S3 bucket versioning enabled for deployment packages
- **Tagging**: All resources are tagged with environment and project name
- **Modular**: Easy to extend with additional Lambda functions and API routes
- **Development Workflow**: Built-in TypeScript compilation and packaging scripts

## Monitoring

You can monitor your application using AWS CloudWatch:
- Lambda logs: `/aws/lambda/hello-world-<environment>`
- API Gateway logs: `/aws/api-gateway/hello-world-api-<environment>`

## Customization

You can customize the deployment by modifying the variables in `variables.tf` or by passing them during `terraform apply`:

```bash
terraform apply -var="environment=production" -var="aws_region=us-west-2"
```
