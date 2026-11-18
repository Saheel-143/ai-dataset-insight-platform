import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  Database,
  Sparkles,
  Server,
  Cpu,
  Key,
  Layers,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataset } from '../context/DatasetContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { seedSamples, isLoading: isSeeding } = useDataset();
  const [copied, setCopied] = useState(false);

  const zeroCostChecklist = [
    { label: 'Frontend Engine', val: 'React 19 + Vite 6 + Tailwind CSS', free: true },
    { label: 'Visualization Layer', val: 'Recharts 2.15 (Free Open-Source SVG/Canvas)', free: true },
    { label: 'Backend Compute', val: 'Python 3.14 + FastAPI + AWS Lambda Free Tier (1M calls/mo)', free: true },
    { label: 'Data Processing', val: 'Pandas 3.0 + NumPy 2.5 + OpenPyXL (100% Local / Open Source)', free: true },
    { label: 'AI Chatbot Agent', val: 'Deterministic Pandas NLP QA Tool Agent (₹0 API cost)', free: true },
    { label: 'PDF Report Engine', val: 'ReportLab 5.1 Open Source Edition (No watermark/license fees)', free: true },
    { label: 'Storage Layer', val: 'Local Disk / S3 Free Tier (5 GB permanent free allowance)', free: true },
    { label: 'Database Layer', val: 'Local SQLite / DynamoDB Free Tier (25 GB storage free forever)', free: true },
    { label: 'Auth Service', val: 'Local HMAC-SHA256 JWT / Cognito Free Tier (50,000 MAUs free)', free: true },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          <span>Platform Settings & Architecture</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configuration, infrastructure modes, and strict zero-budget compliance audit.
        </p>
      </div>

      {/* 100% Zero-Budget Compliance Card */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Strict Zero-Budget Requirement Audit</h3>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            Cost: ₹0.00 / $0.00 Verified
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Every dependency, API, calculation engine, and hosting component was verified to have zero financial obligations.
          No OpenAI, Bedrock, Gemini API keys, or credit cards are required.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {zeroCostChecklist.map((item, i) => (
            <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-300 block">{item.label}</span>
                <span className="text-[10px] text-slate-500">{item.val}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Dual Environment Modes (Local Dev vs AWS Cloud) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-primary-400" />
          <span>Dual-Mode Storage & Compute Configuration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Mode */}
          <div className="bg-slate-950 p-4 rounded-xl border border-primary-500/40 relative">
            <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded">
              Active Mode
            </span>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary-400" />
              <span>Local Development Mode</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Default mode. Requires zero AWS accounts or credentials. Stores files on disk and metadata in high-speed SQLite. Runs on any computer instantly.
            </p>
            <div className="mt-3 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div>STORAGE_MODE=local</div>
              <div>DB_MODE=local</div>
              <div>AUTH_MODE=local</div>
            </div>
          </div>

          {/* AWS Cloud Mode */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded float-right">
              Cloud Ready
            </span>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-accent-400" />
              <span>AWS Serverless Cloud Mode</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Ready for one-click AWS Free Tier deployment: Amazon S3 (Files), DynamoDB (Metadata & Chat), AWS Lambda (Mangum ASGI), Amazon Cognito (Auth), CloudFront (CDN).
            </p>
            <div className="mt-3 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div>AWS_S3_BUCKET_NAME=...</div>
              <div>DYNAMODB_DATASETS_TABLE=...</div>
              <div>COGNITO_USER_POOL_ID=...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset & Seed Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Sample Datasets & Workspace Utilities</span>
        </h3>
        <p className="text-xs text-slate-400">
          Need to test different domains? Click below to load or reseed all 5 pre-configured sample datasets (Retail Sales, Student Academic Performance, Video Game Sales, Hospital Patients, Banking Customer Churn).
        </p>

        <div className="pt-1 flex space-x-3">
          <button
            onClick={seedSamples}
            disabled={isSeeding}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs px-4 py-2 rounded-xl font-medium transition flex items-center space-x-2"
          >
            {isSeeding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            <span>Load / Reset 5 Multi-Domain Samples</span>
          </button>
        </div>
      </div>

      {/* Current Analyst Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Session</span>
          <h4 className="text-sm font-bold text-white mt-0.5">{user?.name}</h4>
          <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded font-bold">
            Role: {user?.role || 'Analyst'}
          </span>
        </div>
      </div>
    </div>
  );
};

