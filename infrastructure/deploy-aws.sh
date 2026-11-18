#!/usr/bin/env bash
# Bash AWS Free-Tier Deployment Script for AI Dataset Insight Platform
set -e

STACK_NAME=${1:-"ai-dataset-insight-dev"}
REGION=${2:-"us-east-1"}

echo "=========================================================="
echo " AI Dataset Insight Platform - AWS Free-Tier Deployment"
echo "=========================================================="

# Check AWS CLI
command -v aws >/dev/null 2>&1 || { echo >&2 "AWS CLI is required. Aborting."; exit 1; }

echo "[1/4] Deploying Serverless CloudFormation Stack..."
aws cloudformation deploy \
    --template-file ./cloudformation.yaml \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

echo "[2/4] Retrieving CloudFormation Stack Outputs..."
API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='FrontendHostingBucket'].OutputValue" --output text)
CDN_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)

echo "API Gateway URL: $API_URL"
echo "CloudFront URL:  $CDN_URL"

echo "[3/4] Building Frontend..."
cd ../frontend
echo "VITE_API_URL=$API_URL" > .env.production
npm run build

echo "[4/4] Syncing to S3 Hosting Bucket..."
if [ -n "$S3_BUCKET" ]; then
    aws s3 sync dist/ "s3://$S3_BUCKET" --delete
fi

echo "=========================================================="
echo " Deployment Complete!"
echo " Access your platform live at: $CDN_URL"
echo "=========================================================="

