# AWS Zero-Budget Deployment Guide & Cost Analysis

This guide provides step-by-step instructions for deploying the **AI Dataset Insight Platform** to Amazon Web Services (AWS) strictly within the **AWS Free Tier** limits ($0.00 / ₹0.00 incurred).

---

## 1. Zero-Budget Cost & Free Tier Breakdown

| AWS Service | Free Tier Allowance | Our Platform Usage | Incurred Cost |
| :--- | :--- | :--- | :--- |
| **AWS Lambda** | 1,000,000 requests/month + 3.2M seconds compute | ~1,000 requests/month | **$0.00 / ₹0** |
| **Amazon S3** | 5 GB Standard Storage + 20,000 GET + 2,000 PUT | < 100 MB datasets | **$0.00 / ₹0** |
| **Amazon DynamoDB** | 25 GB Storage + 25 RCU / 25 WCU (Permanent Free) | < 10 MB metadata & chat | **$0.00 / ₹0** |
| **Amazon Cognito** | 50,000 Monthly Active Users (MAUs) permanent free | 1-5 users | **$0.00 / ₹0** |
| **Amazon API Gateway** | 1,000,000 HTTP API calls/month free (first 12 mos) | ~1,000 calls | **$0.00 / ₹0** |
| **Amazon CloudFront** | 1 TB Data Transfer Out + 10,000,000 HTTP requests | < 500 MB data transfer | **$0.00 / ₹0** |
| **AI LLM / Bedrock** | **NOT USED** | **Deterministic Python Engine** | **$0.00 / ₹0** |

---

## 2. Mandatory Cost-Control Rules

1. **Never create NAT Gateways**: Our Lambda function runs in the standard AWS managed VPC with direct internet access, eliminating any NAT Gateway hourly charges.
2. **Never create RDS or OpenSearch instances**: We use DynamoDB in `PAY_PER_REQUEST` on-demand billing mode, guaranteeing $0 standby charge.
3. **No Amazon Bedrock or Paid Model Endpoints**: All natural language query understanding and statistics calculations execute locally inside AWS Lambda via Pandas and NumPy.
4. **Setup AWS Budget Alert ($1.00 Threshold)**:
   ```bash
   aws budgets create-budget \
       --account-id <YOUR_ACCOUNT_ID> \
       --budget file://infrastructure/budget-alert.json
   ```

---

## 3. Step-by-Step Deployment Instructions

### Prerequisites
- AWS CLI configured (`aws configure`)
- AWS SAM CLI or CloudFormation access
- Node.js 18+ and Python 3.10+

### Step 1: Deploy Backend Stack via AWS SAM / CloudFormation
```bash
# In the project directory:
cd infrastructure

sam build -t cloudformation.yaml
sam deploy --guided \
    --stack-name ai-dataset-insight-dev \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```

During the guided deployment:
- Confirm stack name: `ai-dataset-insight-dev`
- Choose AWS Region: (e.g. `us-east-1` or `ap-south-1`)
- Confirm IAM role creation: `Y`
- Allow SAM CLI to create S3 staging bucket: `Y`

Once complete, note the outputs:
- `ApiEndpoint`: (e.g., `https://xyz123.execute-api.us-east-1.amazonaws.com`)
- `CloudFrontURL`: (e.g., `https://d111111abcdef8.cloudfront.net`)
- `FrontendHostingBucket`: (e.g., `ai-dataset-insight-frontend-123456789-us-east-1`)

---

### Step 2: Build and Deploy Frontend to S3 & CloudFront

1. Configure frontend environment pointing to your deployed API:
```bash
cd ../frontend
# Create .env.production
echo "VITE_API_URL=https://xyz123.execute-api.us-east-1.amazonaws.com" > .env.production
```

2. Build static production assets:
```bash
npm run build
```

3. Sync build artifacts to the S3 bucket:
```bash
aws s3 sync dist/ s3://<FrontendHostingBucket> --delete
```

4. Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
    --distribution-id <DISTRIBUTION_ID> \
    --paths "/*"
```

---

## 4. Switching Between Local Dev and AWS Cloud

The entire application uses the exact same backend interfaces. You can toggle modes anytime via environment variables:

```ini
# For Local Dev (No AWS credentials needed)
STORAGE_MODE=local
DB_MODE=local
AUTH_MODE=local

# For AWS Production Mode
STORAGE_MODE=s3
DB_MODE=dynamodb
AUTH_MODE=cognito
AWS_S3_BUCKET_NAME=ai-dataset-insight-data-xxxx
DYNAMODB_DATASETS_TABLE=ai-dataset-insight-datasets-dev
DYNAMODB_CHATS_TABLE=ai-dataset-insight-chats-dev
COGNITO_USER_POOL_ID=us-east-1_xxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
```

---

## 5. Deletion & Cleanup (Zero Residue)

To delete all AWS cloud resources whenever you are done and guarantee $0 ongoing storage charges:

```bash
# 1. Empty S3 Buckets
aws s3 rm s3://<DatasetStorageBucket> --recursive
aws s3 rm s3://<FrontendHostingBucket> --recursive

# 2. Delete CloudFormation Stack
aws cloudformation delete-stack --stack-name ai-dataset-insight-dev
```

