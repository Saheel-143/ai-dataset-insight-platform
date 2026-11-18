import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useDataset } from '../context/DatasetContext';
import { NavTab } from '../components/Sidebar';

interface UploadPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const { refreshDatasets, setActiveDataset, seedSamples, isLoading: isSeeding } = useDataset();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [previewSnippet, setPreviewSnippet] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const validateAndSelectFile = (file: File) => {
    setErrorMsg('');
    setSuccessMsg('');
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.csv', '.xls', '.xlsx'].includes(ext)) {
      setErrorMsg('Invalid file extension. Please upload a CSV (.csv) or Excel (.xls, .xlsx) file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 50 MB limit. Please select a smaller dataset.');
      return;
    }

    setSelectedFile(file);
    setDatasetName(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));

    // If CSV, read a text preview snippet
    if (ext === '.csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const lines = text.split('\n').filter((l) => l.trim().length > 0).slice(0, 5);
          setPreviewSnippet(lines);
        }
      };
      reader.readAsText(file.slice(0, 4096));
    } else {
      setPreviewSnippet([`Binary Excel file (${(file.size / 1024).toFixed(1)} KB). Full preview will be available after parsing.`]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(20);
    setErrorMsg('');

    try {
      setUploadProgress(50);
      const newDataset = await api.uploadDataset(selectedFile, datasetName);
      setUploadProgress(100);
      setSuccessMsg(`Dataset "${newDataset.name}" parsed and registered successfully!`);
      await refreshDatasets();
      setActiveDataset(newDataset);

      // Auto redirect to Analysis after short success pause
      setTimeout(() => {
        onNavigate('analysis');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-primary-400" />
          <span>Upload New Dataset</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Supports CSV and Excel (.xls, .xlsx) files up to 50 MB. Datasets are securely stored and automatically parsed into memory.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-primary-500 bg-primary-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndSelectFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600/30 to-accent-600/20 border border-primary-500/30 text-primary-400 flex items-center justify-center mx-auto mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-semibold text-white">
          {selectedFile ? selectedFile.name : 'Drag and drop your dataset here, or browse'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Compatible formats: CSV, XLS, XLSX. Secure client-side validation and presigned upload architecture.
        </p>

        <div className="mt-4 flex items-center justify-center space-x-4 text-[11px] text-slate-500 font-mono">
          <span>Max: 50 MB</span>
          <span>•</span>
          <span>CSV / Excel</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Zero Key Exposure
          </span>
        </div>
      </div>

      {/* Error / Success Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg} Redirecting to analysis...</span>
        </div>
      )}

      {/* File Configuration & Preview */}
      {selectedFile && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-6 h-6 text-primary-400" />
              <div>
                <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-400">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB • Type: {selectedFile.type || 'text/csv'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewSnippet([]);
              }}
              className="text-xs text-slate-400 hover:text-rose-400 transition"
            >
              Remove
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dataset Display Name
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g. Q4 Sales Report"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Snippet preview */}
          {previewSnippet.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-primary-400" />
                <span>File Header Preview</span>
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                {previewSnippet.map((line, idx) => (
                  <div key={idx} className="whitespace-pre truncate text-slate-400">
                    <span className="text-slate-600 select-none mr-2">{idx + 1}</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Parsing and analyzing dataset...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-primary-600/30 flex items-center space-x-2"
            >
              <span>{isUploading ? 'Analyzing...' : 'Confirm and Analyze'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Pre-packaged Multi-Domain Datasets (Instant 1-Click Load) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Don't have a dataset ready? Load Sample Datasets</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly test the platform across 5 diverse industry domains with real data:
            </p>
          </div>
          <button
            onClick={seedSamples}
            disabled={isSeeding}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5"
          >
            {isSeeding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Load All 5 Samples</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-200">Retail Sales & Profitability</p>
            <p className="text-[11px] text-slate-400 mt-0.5">502 rows • Revenue, Profit, Margin, Channel</p>
            <span className="inline-block mt-2 font-mono text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">CSV</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-200">Student Academic Performance</p>
            <p className="text-[11px] text-slate-400 mt-0.5">351 rows • Math, Reading, Study Hours, GPA</p>
            <span className="inline-block mt-2 font-mono text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">XLSX</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-200">Global Video Game Sales</p>
            <p className="text-[11px] text-slate-400 mt-0.5">450 rows • Platform, Critic Score, NA/EU/JP Sales</p>
            <span className="inline-block mt-2 font-mono text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">CSV</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-200">Hospital Patient Healthcare</p>
            <p className="text-[11px] text-slate-400 mt-0.5">400 rows • BP, Cholesterol, BMI, Treatment Cost</p>
            <span className="inline-block mt-2 font-mono text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">CSV</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 sm:col-span-2 lg:col-span-2">
            <p className="text-xs font-semibold text-slate-200">Banking Customer Churn</p>
            <p className="text-[11px] text-slate-400 mt-0.5">480 rows • Balance, Tenure, Credit Score, Salary, Churn Status</p>
            <span className="inline-block mt-2 font-mono text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">CSV</span>
          </div>
        </div>
      </div>
    </div>
  );
};

