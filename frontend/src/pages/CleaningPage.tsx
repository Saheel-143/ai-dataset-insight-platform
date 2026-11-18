import React, { useState } from 'react';
import {
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Download,
  Sparkles,
  ArrowRight,
  Layers,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';
import { CleaningOperation, CleanResponse } from '../types';
import { NavTab } from '../components/Sidebar';

interface CleaningPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const CleaningPage: React.FC<CleaningPageProps> = ({ onNavigate }) => {
  const { activeDataset, activeOverview, refreshDatasets, setActiveDataset } = useDataset();

  // Cleaning options state
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [imputeNumerical, setImputeNumerical] = useState<string>('mean');
  const [numericalCustomVal, setNumericalCustomVal] = useState<number>(0);
  const [imputeCategorical, setImputeCategorical] = useState<string>('mode');
  const [categoricalCustomVal, setCategoricalCustomVal] = useState<string>('Unknown');
  const [columnsToDrop, setColumnsToDrop] = useState<string[]>([]);
  const [renamePairs, setRenamePairs] = useState<{ original: string; newName: string }[]>([]);
  const [typeConversions, setTypeConversions] = useState<{ col: string; target: string }[]>([]);
  const [handleOutliers, setHandleOutliers] = useState<string>('cap');
  const [outlierColumns, setOutlierColumns] = useState<string[]>([]);

  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleaningResult, setCleaningResult] = useState<CleanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!activeDataset || !activeOverview) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <Wand2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Dataset Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Select or upload a dataset to run the automated cleaning pipeline.
        </p>
      </div>
    );
  }

  const { metadata, columns, numeric_columns } = activeOverview;

  const toggleColumnDrop = (colName: string) => {
    if (columnsToDrop.includes(colName)) {
      setColumnsToDrop(columnsToDrop.filter((c) => c !== colName));
    } else {
      setColumnsToDrop([...columnsToDrop, colName]);
    }
  };

  const toggleOutlierCol = (colName: string) => {
    if (outlierColumns.includes(colName)) {
      setOutlierColumns(outlierColumns.filter((c) => c !== colName));
    } else {
      setOutlierColumns([...outlierColumns, colName]);
    }
  };

  const handleExecuteCleaning = async () => {
    setIsCleaning(true);
    setErrorMsg('');
    setCleaningResult(null);

    const renamesDict: Record<string, string> = {};
    renamePairs.forEach((p) => {
      if (p.original && p.newName.trim()) {
        renamesDict[p.original] = p.newName.trim();
      }
    });

    const typesDict: Record<string, string> = {};
    typeConversions.forEach((t) => {
      if (t.col && t.target) {
        typesDict[t.col] = t.target;
      }
    });

    const ops: CleaningOperation = {
      remove_duplicates: removeDuplicates,
      impute_numerical: imputeNumerical,
      numerical_custom_val: imputeNumerical === 'constant' ? numericalCustomVal : null,
      impute_categorical: imputeCategorical,
      categorical_custom_val: imputeCategorical === 'constant' ? categoricalCustomVal : null,
      columns_to_drop: columnsToDrop,
      rename_columns: renamesDict,
      type_conversions: typesDict,
      handle_outliers: handleOutliers !== 'none' ? handleOutliers : null,
      outlier_columns: outlierColumns.length > 0 ? outlierColumns : numeric_columns.slice(0, 3),
    };

    try {
      const res = await api.cleanDataset(activeDataset.id, ops);
      setCleaningResult(res);
      await refreshDatasets();
    } catch (err: any) {
      setErrorMsg(err.message || 'Cleaning failed.');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-accent-400" />
              <span>Data Cleaning Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Impute missing values, remove duplicates, cap outliers, and create an optimized dataset version.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Original Dataset Strictly Preserved</span>
          </div>
        </div>

        {/* Current Hygiene Health Alert */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Missing Values Found</p>
              <p className={`text-base font-bold mt-0.5 ${metadata.missing_total > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {metadata.missing_total.toLocaleString()} cells
              </p>
            </div>
            {metadata.missing_total > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Duplicate Rows Found</p>
              <p className={`text-base font-bold mt-0.5 ${metadata.duplicate_rows > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {metadata.duplicate_rows.toLocaleString()} rows
              </p>
            </div>
            {metadata.duplicate_rows > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Baseline Quality Score</p>
              <p className={`text-base font-bold mt-0.5 ${metadata.quality_score >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metadata.quality_score} / 100
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-primary-400" />
          </div>
        </div>
      </div>

      {/* Cleaning Config Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section 1: Missing & Duplicate Handling */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>1. Missing & Duplicate Strategies</span>
          </h3>

          {/* Remove Duplicates Toggle */}
          <label className="flex items-center space-x-3 cursor-pointer bg-slate-950 p-3 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={(e) => setRemoveDuplicates(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded bg-slate-900 border-slate-700"
            />
            <div>
              <span className="text-xs font-semibold text-slate-200">Remove Duplicate Rows</span>
              <p className="text-[11px] text-slate-400">
                Automatically detects and strips fully identical rows ({metadata.duplicate_rows} found).
              </p>
            </div>
          </label>

          {/* Numerical Missing Imputation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Numerical Imputation Strategy
            </label>
            <select
              value={imputeNumerical}
              onChange={(e) => setImputeNumerical(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
            >
              <option value="mean">Fill with Column Mean (Average)</option>
              <option value="median">Fill with Column Median (Outlier Robust)</option>
              <option value="mode">Fill with Column Mode (Most Frequent)</option>
              <option value="constant">Fill with Custom Constant Value</option>
              <option value="ffill">Forward / Backward Fill</option>
              <option value="drop">Drop Rows with Missing Numerical Values</option>
            </select>
            {imputeNumerical === 'constant' && (
              <input
                type="number"
                placeholder="Enter custom number..."
                value={numericalCustomVal}
                onChange={(e) => setNumericalCustomVal(Number(e.target.value))}
                className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            )}
          </div>

          {/* Categorical Missing Imputation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Categorical Imputation Strategy
            </label>
            <select
              value={imputeCategorical}
              onChange={(e) => setImputeCategorical(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
            >
              <option value="mode">Fill with Mode (Most Frequent Category)</option>
              <option value="unknown">Fill with 'Unknown' Label</option>
              <option value="constant">Fill with Custom Label</option>
              <option value="drop">Drop Rows with Missing Categorical Values</option>
            </select>
            {imputeCategorical === 'constant' && (
              <input
                type="text"
                placeholder="Enter custom label..."
                value={categoricalCustomVal}
                onChange={(e) => setCategoricalCustomVal(e.target.value)}
                className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            )}
          </div>
        </div>

        {/* Section 2: Outliers & Column Pruning */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>2. Outliers (IQR Method) & Column Pruning</span>
          </h3>

          {/* Outlier Strategy */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              IQR Outlier Action ($Q1 - 1.5 \times IQR$ to $Q3 + 1.5 \times IQR$)
            </label>
            <select
              value={handleOutliers}
              onChange={(e) => setHandleOutliers(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
            >
              <option value="cap">Cap Outliers to IQR Boundaries (Winsorizing)</option>
              <option value="remove">Remove Rows Containing Outliers</option>
              <option value="none">Keep Outliers Untouched</option>
            </select>
          </div>

          {/* Select columns for outlier inspection */}
          {handleOutliers !== 'none' && numeric_columns.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">
                Apply Outlier Treatment on Columns:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                {numeric_columns.map((col) => {
                  const isSelected = outlierColumns.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() => toggleOutlierCol(col)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
                        isSelected
                          ? 'bg-primary-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Columns to Drop */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Remove Unnecessary Columns ({columnsToDrop.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-950 rounded-lg border border-slate-800">
              {columns.map((c) => {
                const isDropped = columnsToDrop.includes(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => toggleColumnDrop(c.name)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1 ${
                      isDropped
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 line-through'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{c.name}</span>
                    {isDropped && <Trash2 className="w-3 h-3 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleExecuteCleaning}
          disabled={isCleaning}
          className="bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white font-medium text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-accent-600/30 flex items-center space-x-2"
        >
          {isCleaning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          <span>{isCleaning ? 'Executing Pipeline...' : 'Run Automated Cleaning Pipeline'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Before-and-After Data Quality Report Card */}
      {cleaningResult && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cleaning Completed Successfully</span>
              </div>
              <h3 className="text-lg font-bold text-white">Before & After Data Quality Audit</h3>
              <p className="text-xs text-slate-400">
                New cleaned dataset saved as: <b className="text-slate-200 font-mono">{cleaningResult.cleaned_dataset.filename}</b>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href={api.getDownloadUrl(cleaningResult.cleaned_dataset.storage_key, cleaningResult.cleaned_dataset.filename)}
                download={cleaningResult.cleaned_dataset.filename}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Cleaned Dataset</span>
              </a>
              <button
                onClick={() => {
                  setActiveDataset(cleaningResult.cleaned_dataset);
                  onNavigate('analysis');
                }}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition"
              >
                Inspect New Version
              </button>
            </div>
          </div>

          {/* Metrics Diff Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">Quality Score</p>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <span className="text-xs line-through text-slate-500">
                  {cleaningResult.quality_comparison.before_quality_score}%
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {cleaningResult.quality_comparison.after_quality_score}%
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">Missing Values</p>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <span className="text-xs line-through text-slate-500">
                  {cleaningResult.quality_comparison.before_missing}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-base font-bold text-emerald-400">
                  {cleaningResult.quality_comparison.after_missing}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">Duplicate Rows</p>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <span className="text-xs line-through text-slate-500">
                  {cleaningResult.quality_comparison.before_duplicates}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-base font-bold text-emerald-400">
                  {cleaningResult.quality_comparison.after_duplicates}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">Rows × Columns</p>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <span className="text-xs line-through text-slate-500">
                  {cleaningResult.quality_comparison.before_rows} × {cleaningResult.quality_comparison.before_cols}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-base font-bold text-slate-200">
                  {cleaningResult.quality_comparison.after_rows} × {cleaningResult.quality_comparison.after_cols}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Log of Actions */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300">Cleaning Actions Log:</h4>
            <ul className="space-y-1 text-xs text-slate-400">
              {cleaningResult.quality_comparison.actions_taken.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

