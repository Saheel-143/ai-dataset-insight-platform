import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Hash,
  Type,
  Calendar,
  Key,
  Flame,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';
import { DataPreviewResponse } from '../types';
import { DynamicChart } from '../charts/DynamicChart';

export const AnalysisPage: React.FC = () => {
  const { activeDataset, activeOverview, isLoadingOverview } = useDataset();

  const [activeTab, setActiveTab] = useState<'columns' | 'statistics' | 'preview' | 'correlation'>('columns');
  const [previewData, setPreviewData] = useState<DataPreviewResponse | null>(null);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Fetch paginated preview when active dataset, page, or search changes
  useEffect(() => {
    if (!activeDataset) return;
    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const resp = await api.getPreview(activeDataset.id, previewPage, pageSize, searchQuery);
        setPreviewData(resp);
      } catch (err) {
        console.error('Failed to load preview:', err);
      } finally {
        setIsLoadingPreview(false);
      }
    };
    fetchPreview();
  }, [activeDataset?.id, previewPage, pageSize, searchQuery]);

  if (!activeDataset) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Dataset Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Please select or upload a dataset to view automated statistical analysis.
        </p>
      </div>
    );
  }

  if (isLoadingOverview || !activeOverview) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-400" />
        <p className="text-xs">Computing comprehensive dataset metrics using Pandas...</p>
      </div>
    );
  }

  const { metadata, columns, numeric_columns, categorical_columns, datetime_columns, id_columns, constant_columns, quality_score } = activeOverview;

  return (
    <div className="space-y-6">
      {/* Header & Overview KPIs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary-400" />
              <span>Automatic Dataset Analysis</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive structural, parametric, and quality evaluation of <b className="text-slate-200">{metadata.name}</b>.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              quality_score >= 85
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              Data Quality: {quality_score}%
            </span>
          </div>
        </div>

        {/* Overview Metric Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-medium">Total Rows</p>
            <p className="text-base font-bold text-white mt-1">{metadata.row_count.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-medium">Total Columns</p>
            <p className="text-base font-bold text-white mt-1">{metadata.col_count}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-medium">Missing Values</p>
            <p className={`text-base font-bold mt-1 ${metadata.missing_total > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metadata.missing_total.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-medium">Duplicate Rows</p>
            <p className={`text-base font-bold mt-1 ${metadata.duplicate_rows > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metadata.duplicate_rows.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-medium">Memory Footprint</p>
            <p className="text-base font-bold text-white mt-1">{(activeOverview.memory_usage_bytes / 1024).toFixed(1)} KB</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-medium">Dataset Size</p>
            <p className="text-base font-bold text-white mt-1">{(metadata.size_bytes / 1024).toFixed(1)} KB</p>
          </div>
        </div>

        {/* Identified Column Categorization Badges */}
        <div className="flex flex-wrap gap-2 mt-3 items-center text-xs">
          <span className="text-slate-500 font-medium mr-1">Detected Types:</span>
          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
            <Hash className="w-3 h-3" /> {numeric_columns.length} Numerical
          </span>
          <span className="bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
            <Type className="w-3 h-3" /> {categorical_columns.length} Categorical
          </span>
          {datetime_columns.length > 0 && (
            <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {datetime_columns.length} Date/Time
            </span>
          )}
          {id_columns.length > 0 && (
            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              <Key className="w-3 h-3" /> {id_columns.length} Identifiers
            </span>
          )}
          {constant_columns.length > 0 && (
            <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              Constant: {constant_columns.length}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex space-x-6">
        <button
          onClick={() => setActiveTab('columns')}
          className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition ${
            activeTab === 'columns'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Column Schema ({columns.length})
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition ${
            activeTab === 'statistics'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Statistical Analysis ({numeric_columns.length} Metrics)
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition ${
            activeTab === 'preview'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Data Preview & Pagination
        </button>
        {activeOverview.correlation_matrix && (
          <button
            onClick={() => setActiveTab('correlation')}
            className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition ${
              activeTab === 'correlation'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Correlation Heatmap
          </button>
        )}
      </div>

      {/* TAB 1: COLUMN SCHEMA */}
      {activeTab === 'columns' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Column Name</th>
                  <th className="py-3 px-4 font-semibold">Semantic Classification</th>
                  <th className="py-3 px-4 font-semibold">Data Type</th>
                  <th className="py-3 px-4 font-semibold">Unique Values</th>
                  <th className="py-3 px-4 font-semibold">Missing (Count / %)</th>
                  <th className="py-3 px-4 font-semibold">Sample Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {columns.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4 font-bold text-slate-200 font-sans">{c.name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        c.semantic_type === 'numerical'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : c.semantic_type === 'categorical'
                          ? 'bg-purple-500/20 text-purple-300'
                          : c.semantic_type === 'datetime'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : c.semantic_type === 'id'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.semantic_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{c.dtype}</td>
                    <td className="py-3 px-4 text-slate-200">{c.unique_count.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={c.missing_count > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {c.missing_count} ({c.missing_pct}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs font-sans text-[11px]">
                      {c.sample_values.slice(0, 4).join(', ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PARAMETRIC STATISTICAL ANALYSIS */}
      {activeTab === 'statistics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Numerical Feature</th>
                  <th className="py-3 px-4 font-semibold text-right">Mean</th>
                  <th className="py-3 px-4 font-semibold text-right">Median</th>
                  <th className="py-3 px-4 font-semibold text-right">Mode</th>
                  <th className="py-3 px-4 font-semibold text-right">Min</th>
                  <th className="py-3 px-4 font-semibold text-right">Max</th>
                  <th className="py-3 px-4 font-semibold text-right">Std Dev</th>
                  <th className="py-3 px-4 font-semibold text-right">IQR (Q1 - Q3)</th>
                  <th className="py-3 px-4 font-semibold text-right">Outliers (IQR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {columns
                  .filter((c) => c.semantic_type === 'numerical' && c.mean !== null && c.mean !== undefined)
                  .map((c) => (
                    <tr key={c.name} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-200 font-sans">{c.name}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{c.mean?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{c.median?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-400">{c.mode ?? '-'}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{c.min?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{c.max?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-400">{c.std?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        [{c.q25} - {c.q75}]
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          (c.outliers_count || 0) > 0
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'text-emerald-400'
                        }`}>
                          {c.outliers_count || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA PREVIEW & PAGINATION */}
      {activeTab === 'preview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search values in dataset..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPreviewPage(1);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500 w-64"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPreviewPage(1);
                }}
                className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {isLoadingPreview ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-primary-400" />
              Loading records...
            </div>
          ) : previewData ? (
            <div>
              <div className="overflow-x-auto border border-slate-850 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold text-slate-500 w-12 text-center">#</th>
                      {previewData.columns.map((col) => (
                        <th key={col} className="py-2.5 px-3 font-semibold text-slate-300 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {previewData.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50 transition">
                        <td className="py-2 px-3 text-slate-600 text-center select-none">
                          {(previewPage - 1) * pageSize + idx + 1}
                        </td>
                        {previewData.columns.map((col) => (
                          <td key={col} className="py-2 px-3 text-slate-300 whitespace-nowrap">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                              <span className="text-amber-500/70 italic">null</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
                <span>
                  Showing {Math.min((previewPage - 1) * pageSize + 1, previewData.total_rows)} -{' '}
                  {Math.min(previewPage * pageSize, previewData.total_rows)} of {previewData.total_rows.toLocaleString()} records
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-300 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-white px-2">
                    {previewPage} / {Math.ceil(previewData.total_rows / pageSize) || 1}
                  </span>
                  <button
                    disabled={previewPage >= Math.ceil(previewData.total_rows / pageSize)}
                    onClick={() => setPreviewPage((p) => p + 1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-300 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 4: CORRELATION HEATMAP */}
      {activeTab === 'correlation' && activeOverview.correlation_matrix && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary-400" />
              <span>Pearson Correlation Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Coefficients between -1.0 (strong negative) and +1.0 (strong positive).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Convert dictionary to row items */}
            {(() => {
              const matrix = activeOverview.correlation_matrix;
              const rows = Object.keys(matrix).map((k) => ({
                variable: k,
                ...matrix[k],
              }));
              return (
                <DynamicChart
                  chartType="heatmap"
                  data={rows}
                  meta={{ columns: Object.keys(matrix) }}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

