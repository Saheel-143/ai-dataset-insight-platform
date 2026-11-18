import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileCheck2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const { activeDataset, activeOverview } = useDataset();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!activeDataset || !activeOverview) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Dataset Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Select or upload a dataset to generate publication-grade PDF intelligence reports.
        </p>
      </div>
    );
  }

  const { metadata, columns, numeric_columns, categorical_columns, quality_score } = activeOverview;

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    const downloadUrl = api.getReportDownloadUrl(activeDataset.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Report_${activeDataset.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Executive Report Generator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Produces structured, multi-page PDF documents detailing data quality, parametric distributions, and findings.
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center space-x-2 shrink-0"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{isGenerating ? 'Compiling PDF...' : 'Download PDF Report'}</span>
        </button>
      </div>

      {/* PDF Document Live Preview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Document Header Banner */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              AI Dataset Insight Platform • Confidential Data Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <h3 className="text-2xl font-bold text-white mt-2">
            Data Quality & Parametric Intelligence Audit
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Dataset: <b className="text-slate-200">{metadata.name}</b> ({metadata.filename})
          </p>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Quality Score</p>
            <p className={`text-2xl font-bold mt-1 ${quality_score >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {quality_score} / 100
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Observations</p>
            <p className="text-2xl font-bold text-white mt-1">
              {metadata.row_count.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Missing Values</p>
            <p className={`text-2xl font-bold mt-1 ${metadata.missing_total > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metadata.missing_total.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Duplicate Rows</p>
            <p className={`text-2xl font-bold mt-1 ${metadata.duplicate_rows > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metadata.duplicate_rows.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Section 1: Executive Audit Summary */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>1. Executive Audit Summary</span>
          </h4>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              • The dataset contains <b>{metadata.row_count.toLocaleString()}</b> rows across <b>{metadata.col_count}</b> columns ({numeric_columns.length} numerical, {categorical_columns.length} categorical).
            </p>
            <p>
              • Overall structural integrity achieved a health score of <b>{quality_score}%</b>. {metadata.missing_total === 0 ? 'No missing cells were observed across any feature.' : `${metadata.missing_total} total missing cells require automated imputation.`}
            </p>
            <p>
              • Duplicate analysis verified that <b>{metadata.duplicate_rows}</b> redundant rows exist in the repository.
            </p>
          </div>
        </div>

        {/* Section 2: Key Numerical Variables */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>2. Key Numerical Distributions</span>
          </h4>
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Column</th>
                  <th className="p-3 font-semibold text-right">Mean</th>
                  <th className="p-3 font-semibold text-right">Median</th>
                  <th className="p-3 font-semibold text-right">Min</th>
                  <th className="p-3 font-semibold text-right">Max</th>
                  <th className="p-3 font-semibold text-right">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {columns
                  .filter((c) => c.semantic_type === 'numerical' && c.mean !== null)
                  .slice(0, 6)
                  .map((c) => (
                    <tr key={c.name}>
                      <td className="p-3 font-bold text-slate-200 font-sans">{c.name}</td>
                      <td className="p-3 text-right text-slate-300">{c.mean?.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-300">{c.median?.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-300">{c.min?.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-300">{c.max?.toLocaleString()}</td>
                      <td className="p-3 text-right text-amber-400 font-bold">{c.outliers_count || 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Engine: Python ReportLab 5.1.0 (PDF 1.4 Native Generation)</span>
          <button
            onClick={handleDownloadPDF}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
          >
            <span>Click to download full multi-page PDF</span>
            <Download className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

