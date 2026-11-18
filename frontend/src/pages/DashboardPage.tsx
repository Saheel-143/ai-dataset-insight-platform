import React from 'react';
import {
  Database,
  Layers,
  FileCheck2,
  Sparkles,
  Bot,
  BarChart3,
  Wand2,
  FileSpreadsheet,
  ArrowUpRight,
  UploadCloud,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { NavTab } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { datasets, activeDataset, setActiveDataset, seedSamples, isLoading } = useDataset();

  const totalDatasets = datasets.length;
  const totalRecords = datasets.reduce((acc, d) => acc + d.row_count, 0);
  const totalColumns = datasets.reduce((acc, d) => acc + d.col_count, 0);
  const avgQuality = totalDatasets > 0
    ? Math.round(datasets.reduce((acc, d) => acc + d.quality_score, 0) / totalDatasets)
    : 100;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950/40 to-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-primary-500/20 text-primary-300 text-xs px-3 py-1 rounded-full font-semibold border border-primary-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic Natural Language Dataset Intelligence</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome to AI Dataset Insight Platform
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Upload raw CSV or Excel datasets to automatically analyze data distributions, run cleaning pipelines, generate 9 types of interactive charts, and query your data with a dataset-aware AI chatbot.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => onNavigate('upload')}
              className="bg-primary-600 hover:bg-primary-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-primary-600/30 flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Dataset</span>
            </button>
            <button
              onClick={() => onNavigate('chatbot')}
              className="bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center space-x-2"
            >
              <Bot className="w-4 h-4 text-accent-400" />
              <span>Ask AI Chatbot</span>
            </button>
            <button
              onClick={seedSamples}
              disabled={isLoading}
              className="bg-slate-800/80 hover:bg-slate-800 text-amber-300 font-medium text-xs px-4 py-2.5 rounded-xl border border-amber-500/30 transition flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load 5 Multi-Domain Samples</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-750 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Datasets</span>
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalDatasets}</div>
          <p className="text-[11px] text-slate-500 mt-1">Uploaded & cleaned repositories</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-750 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Records Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalRecords.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-1">Processed across all files</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-750 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Features / Columns</span>
            <div className="w-8 h-8 rounded-lg bg-accent-500/10 text-accent-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalColumns}</div>
          <p className="text-[11px] text-slate-500 mt-1">Numerical & categorical variables</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-750 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Quality Score</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              avgQuality >= 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{avgQuality} / 100</div>
          <p className="text-[11px] text-slate-500 mt-1">Overall data health score</p>
        </div>
      </div>

      {/* Active Dataset Spotlight Card */}
      {activeDataset ? (
        <div className="bg-slate-900 border border-primary-500/30 rounded-2xl p-6 shadow-xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">
                  Current Selected Dataset
                </span>
                {activeDataset.is_cleaned && (
                  <span className="text-[10px] bg-accent-500/20 text-accent-300 font-bold px-2 py-0.5 rounded border border-accent-500/30">
                    Cleaned Version
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{activeDataset.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                File: <span className="font-mono text-slate-300">{activeDataset.filename}</span> • Size: {(activeDataset.size_bytes / 1024).toFixed(1)} KB
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-xs text-slate-400">Data Quality</span>
                <p className={`text-xl font-bold ${activeDataset.quality_score >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {activeDataset.quality_score}%
                </p>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Dimensions</span>
                <p className="text-sm font-bold text-slate-200">
                  {activeDataset.row_count.toLocaleString()} × {activeDataset.col_count}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <button
              onClick={() => onNavigate('analysis')}
              className="bg-slate-850 hover:bg-slate-800 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition text-left group"
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-2">Data Analysis</p>
              <p className="text-[11px] text-slate-400">Column stats & preview</p>
            </button>

            <button
              onClick={() => onNavigate('cleaning')}
              className="bg-slate-850 hover:bg-slate-800 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition text-left group"
            >
              <div className="flex items-center justify-between">
                <Wand2 className="w-5 h-5 text-accent-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-2">Data Cleaning</p>
              <p className="text-[11px] text-slate-400">Impute nulls & dedupe</p>
            </button>

            <button
              onClick={() => onNavigate('visualizations')}
              className="bg-slate-850 hover:bg-slate-800 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition text-left group"
            >
              <div className="flex items-center justify-between">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-2">Visualizations</p>
              <p className="text-[11px] text-slate-400">9 dynamic chart types</p>
            </button>

            <button
              onClick={() => onNavigate('chatbot')}
              className="bg-slate-850 hover:bg-slate-800 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition text-left group"
            >
              <div className="flex items-center justify-between">
                <Bot className="w-5 h-5 text-emerald-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-2">AI Chatbot</p>
              <p className="text-[11px] text-slate-400">Query in plain English</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Datasets In Workspace</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Upload your CSV or Excel dataset, or load our 5 curated sample datasets to start exploring immediately.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="bg-primary-600 hover:bg-primary-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium"
            >
              Upload Dataset
            </button>
            <button
              onClick={seedSamples}
              disabled={isLoading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-xl font-medium"
            >
              Load Sample Datasets
            </button>
          </div>
        </div>
      )}

      {/* Recent Datasets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Dataset Repository</h3>
            <p className="text-xs text-slate-400">All registered datasets and cleaning histories</p>
          </div>
          <button
            onClick={() => onNavigate('datasets')}
            className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Dataset Name</th>
                <th className="py-3 px-4 font-semibold">Format</th>
                <th className="py-3 px-4 font-semibold">Records</th>
                <th className="py-3 px-4 font-semibold">Columns</th>
                <th className="py-3 px-4 font-semibold">Quality</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {datasets.slice(0, 5).map((ds) => {
                const isCurrent = activeDataset?.id === ds.id;
                return (
                  <tr
                    key={ds.id}
                    className={`hover:bg-slate-800/40 transition ${isCurrent ? 'bg-primary-500/5' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>{ds.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-primary-500/20 text-primary-300 px-1.5 py-0.2 rounded font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{ds.filename}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                        {ds.file_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{ds.row_count.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{ds.col_count}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        {ds.quality_score >= 85 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="font-bold text-slate-200">{ds.quality_score}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {ds.is_cleaned ? (
                        <span className="bg-accent-500/20 text-accent-300 text-[10px] px-2 py-0.5 rounded font-semibold border border-accent-500/30">
                          Cleaned
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded">
                          Original
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveDataset(ds);
                          onNavigate('analysis');
                        }}
                        className="text-primary-400 hover:text-primary-300 font-semibold text-xs hover:underline mr-3"
                      >
                        Analyze
                      </button>
                      <button
                        onClick={() => {
                          setActiveDataset(ds);
                          onNavigate('chatbot');
                        }}
                        className="text-accent-400 hover:text-accent-300 font-semibold text-xs hover:underline"
                      >
                        Chat
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

