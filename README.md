# AI Dataset Insight Platform with AI Chatbot

A production-style, cloud-ready web application built for automated dataset exploration, parametric statistical analysis, automated data cleaning with IQR outlier detection, 9 interactive visualization types, executive PDF report generation, and an intelligent **dataset-aware conversational AI chatbot** built with a zero-budget deterministic Python engine.

---

## 1. System Architecture

```
                                  +---------------------------------------+
                                  |     AI Dataset Insight Platform       |
                                  |       React 19 + Vite 6 + Tailwind    |
                                  +-------------------+-------------------+
                                                      |
                                  +-------------------+-------------------+
                                  |       FastAPI / AWS Lambda Handler    |
                                  |      (Mangum ASGI Zero-Cost Proxy)    |
                                  +---------+--------------------+--------+
                                            |                    |
             +------------------------------+                    +------------------------------+
             |                                                                                  |
+------------v------------+                                                        +------------v------------+
|   Data Storage Service  |                                                        |   Metadata & Chat DB    |
| - Local Disk (Dev)      |                                                        | - Local SQLite (Dev)    |
| - Amazon S3 (AWS Prod)  |                                                        | - Amazon DynamoDB (AWS) |
+------------+------------+                                                        +------------+------------+
             |                                                                                  |
             +------------------------------+--------------------+------------------------------+
                                            |                    |
                                  +---------v--------------------v--------+
                                  |    Deterministic Python Analytics     |
                                  |      Engine (Zero Third-Party Cost)   |
                                  |---------------------------------------|
                                  | • Automated Column Semantic Typing    |
                                  | • Parametric Statistical Profiling    |
                                  | • Cleaning Pipeline & IQR Outlier Cap |
                                  | • Dynamic Recharts Data Aggregator    |
                                  | • Natural Language Intent QA Engine   |
                                  | • ReportLab Executive PDF Generator   |
                                  +---------------------------------------+
```

---

## 2. Strict Zero-Budget & Free-Tier Compliance

Developed under strict cost-control rules:
- **Zero Paid AI APIs**: Does **not** require OpenAI, Claude, Gemini API, or Amazon Bedrock.
- **Zero Standby Infrastructure Charges**: No NAT Gateways, no paid RDS instances, no OpenSearch.
- **Dual-Mode Architecture**: Operates 100% locally out-of-the-box with zero AWS credentials.
- **AWS Free Tier Optimization**:
  - AWS Lambda: 1,000,000 requests/month free
  - Amazon S3: 5 GB storage free
  - Amazon DynamoDB: 25 GB storage + 25 RCU/WCU permanent free tier
  - Amazon Cognito: 50,000 Monthly Active Users permanent free tier
  - Amazon API Gateway: 1,000,000 HTTP API calls free

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 (TypeScript)
- **Tooling**: Vite 6
- **Styling**: Tailwind CSS
- **Visualizations**: Recharts 2.15 (9 interactive chart engines)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI + Uvicorn (Mangum adapter for AWS Lambda)
- **Core Processing**: Pandas 3.0, NumPy 2.5, SciPy 1.18, Scikit-learn 1.9, OpenPyXL 3.1
- **Report Generation**: ReportLab 5.1 (Publication-grade multi-page vector PDF generation)
- **Data Stores**: Local SQLite + File Storage (Local mode), Amazon DynamoDB + S3 (AWS mode)
- **Auth**: HMAC-SHA256 salted JWT (Local mode), Amazon Cognito User Pools (AWS mode)

---

## 4. Nine Comprehensive Platform Modules

### 1. Dashboard
- Key performance metrics: Total datasets uploaded, records analyzed, columns analyzed, average quality score.
- Active dataset spotlight card with instant jumps to analysis, cleaning, visualization, or chat.
- Dataset repository table with quality scores and status badges.

### 2. Dataset Upload
- Drag-and-drop file upload with animated states.
- Supports **CSV**, **XLS**, and **XLSX** up to 50 MB.
- Client-side size & extension validation.
- Live file header preview snippet prior to analysis confirmation.
- 1-Click Multi-Domain Sample Dataset loader.

### 3. My Datasets
- Central repository of all uploaded and cleaned datasets.
- Distinguishes **Cleaned Versions** from **Original Datasets** (Originals are strictly immutable).
- Direct CSV/Excel downloads and safe deletion.

### 4. Automatic Dataset Analysis
- **Dataset Overview**: Row count, column count, total missing cells, duplicate rows, memory footprint, dataset size.
- **Column Semantic Profiling**: Automatically categorizes columns into Numerical, Categorical, Datetime, Identifier (ID), or Constant.
- **Parametric Statistics**: Mean, median, mode, minimum, maximum, standard deviation, variance, quartiles (Q1, Q3), and IQR.
- **Paginated Data Table**: Client-side search across all fields, configurable page size (10, 15, 25, 50), and pagination.
- **Correlation Matrix**: Pairwise Pearson correlation heatmap across numerical columns.

### 5. Data Cleaning Module
- Missing value imputation: Mean, Median, Mode, Custom constant, Forward/Backward fill, or Row drop.
- Duplicate removal.
- Column pruning and renaming.
- **IQR Outlier Detection & Treatment**: Identifies points outside $[Q1 - 1.5 \times IQR, Q3 + 1.5 \times IQR]$ with options to cap (Winsorize) or remove.
- Generates a **Before-and-After Quality Audit Report** showing quality score improvements, missing cell reductions, and operation logs.

### 6. Interactive Visualizations
- Automated AI Chart Recommendations based on data types.
- Nine supported chart types:
  1. **Bar Chart** (Single & Multi-Series Grouped)
  2. **Line Chart** (Temporal trends)
  3. **Area Chart** (Cumulative trajectories)
  4. **Pie Chart** (Categorical proportions)
  5. **Donut Chart** (Segment shares)
  6. **Histogram** (Configurable bin density)
  7. **Scatter Plot** (Bivariate numerical relationships)
  8. **Box Plot** (5-point summary range whiskers)
  9. **Correlation Heatmap** (Color-scaled correlation matrix)
- Interactive axis selectors, aggregations (Sum, Avg, Count, Min, Max), and custom data filters.
- Export chart data as JSON.

### 7. Intelligent AI Dataset Chatbot
- Deterministic Natural Language QA Engine using Pandas and NumPy.
- **Dynamic Column Resolution**: Maps natural language queries to actual columns (handling synonyms, typos, and abbreviations).
- Executes real Pandas mathematical operations—never invents numerical answers.
- **Inline Interactive Recharts**: When questions request charts (e.g. *"Plot a bar chart of top 5 categories by revenue"*), renders interactive vector charts directly inside chat bubbles!
- Inline tabular data preview for ranking queries.
- Contextual session memory for natural follow-ups (*"Show the top 5"*, *"Now calculate its average"*).

### 8. Executive Reports
- Generates publication-grade multi-page PDF documents via ReportLab.
- Includes cover banner, executive KPIs, automated audit findings, column metadata tables, and parametric statistical tables.

### 9. Platform Settings
- Strict Zero-Budget compliance checklist ($0.00 / ₹0.00 verified).
- Architecture mode switcher (Local vs AWS Cloud).
- Sample dataset management.

---

## 5. Five Pre-Packaged Sample Datasets Included

| Dataset | Format | Dimensions | Domain & Target Use Case |
| :--- | :--- | :--- | :--- |
| **sales_data.csv** | CSV | 502 rows × 14 cols | Retail Sales, Revenue, Profit Margins, Customer Ratings |
| **student_performance.xlsx** | Excel | 351 rows × 12 cols | Academic Grades (Math, Reading, Science), Study Hours, GPA |
| **video_game_sales.csv** | CSV | 450 rows × 13 cols | Global Gaming Sales by Platform, Genre, Critic & User Scores |
| **healthcare_patients.csv** | CSV | 400 rows × 13 cols | Clinical Vitals (BP, Cholesterol, Glucose, BMI), Costs |
| **customer_churn.csv** | CSV | 480 rows × 12 cols | Banking Customer Churn, Credit Scores, Balances, Salaries |

---

## 6. Local Quickstart (Zero-Setup)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Install Dependencies
```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Generate Sample Datasets
```bash
py backend/sample_data/generate_samples.py
```

### 4. Run Application
**Option A: One-Click Script (Windows)**
```powershell
.\start-local.ps1
```

**Option B: One-Click Script (Linux / Mac)**
```bash
chmod +x start-local.sh
./start-local.sh
```

**Option C: Manual Start**
- **Terminal 1 (Backend)**:
  ```bash
  uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Terminal 2 (Frontend)**:
  ```bash
  cd frontend
  npm run dev
  ```

Open [http://localhost:5173](http://localhost:5173) in your browser.
Click **"Instant Demo Sign In (1-Click)"** to access the dashboard immediately.

---

## 7. AWS Cloud Deployment

Deploy the serverless stack to your AWS account within free tier limits:

```powershell
cd infrastructure
.\deploy-aws.ps1 -StackName ai-dataset-insight-dev -Region us-east-1
```
Or with Bash:
```bash
cd infrastructure
./deploy-aws.sh ai-dataset-insight-dev us-east-1
```

See [infrastructure/aws-zero-budget-guide.md](infrastructure/aws-zero-budget-guide.md) for full CloudFormation configuration and cost-prevention controls.

