# PowerShell AWS Free-Tier Deployment Script for AI Dataset Insight Platform
param (
    [string]$StackName = "ai-dataset-insight-dev",
    [string]$Region = "us-east-1"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " AI Dataset Insight Platform - AWS Free-Tier Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is required to deploy. Please install and configure AWS CLI."
    exit 1
}

# 2. Deploy CloudFormation Stack
Write-Host "[1/4] Deploying Serverless CloudFormation Stack..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file ./cloudformation.yaml `
    --stack-name $StackName `
    --region $Region `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

if ($LASTEXITCODE -ne 0) {
    Write-Error "CloudFormation deployment failed."
    exit 1
}

# 3. Retrieve Outputs
Write-Host "[2/4] Retrieving CloudFormation Stack Outputs..." -ForegroundColor Yellow
$outputs = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs" | ConvertFrom-Json

$apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiEndpoint" }).OutputValue
$s3Frontend = ($outputs | Where-Object { $_.OutputKey -eq "FrontendHostingBucket" }).OutputValue
$cdnUrl = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontURL" }).OutputValue

Write-Host "API Gateway URL: $apiUrl" -ForegroundColor Green
Write-Host "CloudFront URL:  $cdnUrl" -ForegroundColor Green

# 4. Build Frontend
Write-Host "[3/4] Building Frontend against deployed API Gateway..." -ForegroundColor Yellow
Push-Location ../frontend
"VITE_API_URL=$apiUrl" | Out-File -Encoding utf8 .env.production
npm run build

# 5. Sync to S3
if ($s3Frontend) {
    Write-Host "[4/4] Uploading Static Assets to S3..." -ForegroundColor Yellow
    aws s3 sync dist/ "s3://$s3Frontend" --delete
}
Pop-Location

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host " Access your platform live at: $cdnUrl" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

