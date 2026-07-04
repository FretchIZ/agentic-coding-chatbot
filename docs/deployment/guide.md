# Deployment Guide

## Docker Deployment
```bash
# Build and start all services
./scripts/start.sh production

# Start monitoring stack
./scripts/start.sh monitoring
```

## Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/

# Create secrets
kubectl create secret generic db-credentials \
  --from-literal=url=postgresql://...

kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret

kubectl create secret generic openai-key \
  --from-literal=key=your-openai-api-key
```

## Terraform (AWS)
```bash
cd infrastructure/terraform
terraform init
terraform plan -var="db_password=yourpassword"
terraform apply -var="db_password=yourpassword"
```

## Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| REDIS_URL | Redis connection string | Yes |
| OPENAI_API_KEY | OpenAI API key | Yes |
| ANTHROPIC_API_KEY | Anthropic API key | No |
| JWT_SECRET | JWT signing secret | Yes |
| NODE_ENV | Environment mode | Yes |
| CORS_ORIGIN | Allowed CORS origins | No |