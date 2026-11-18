import React, { useState } from 'react';
import {
  Database,
  Trash2,
  Download,
  FileSpreadsheet,
  Wand2,
  BarChart3,
  Bot,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  Search
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';
import { NavTab } from '../components/Sidebar';

interface MyDatasetsPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const MyDatasetsPage: React.FC<MyDatasetsPageProps> = ({ onNavigate }) => {
  const { datasets, activeDataset, setActiveDataset, deleteDataset, refreshDatasets } = useDataset();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = datasets.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete dataset "${name}"? This action cannot be undone.`)) {
      setDeletingId(id);
      try {
        await deleteDataset(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-400" />
            <span>My Datasets</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your uploaded files, cleaned iterations, and analytical snapshots.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500 w-48 sm:w-64"
            />
          </div>
          <button
            onClick={() => onNavigate('upload')}
            className="bg-primary-600 hover:bg-primary-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Grid of Dataset Cards */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Datasets Found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm ? 'No datasets match your search term.' : 'Upload your first CSV or Excel dataset to begin.'}
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="bg-primary-600 hover:bg-primary-500 text-white text-xs px-4 py-2 rounded-lg font-medium"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ds) => {
            const isActive = activeDataset?.id === ds.id;
            return (
              <div
                key={ds.id}
                className={`bg-slate-900 rounded-xl p-5 border transition flex flex-col justify-between ${
                  isActive
                    ? 'border-primary-500/80 shadow-lg shadow-primary-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm truncate">{ds.name}</h4>
                        {isActive && (
                          <span className="text-[9px] bg-primary-500/20 text-primary-300 font-bold px-1.5 py-0.2 rounded border border-primary-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {ds.filename}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ds.quality_score >= 85
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ds.quality_score}% Quality
                    </span>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                      <p className="text-[10px] text-slate-400">Rows</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">
                        {ds.row_count.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                      <p className="text-[10px] text-slate-400">Columns</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">{ds.col_count}</p>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                      <p className="text-[10px] text-slate-400">Missing</p>
                      <p className={`text-xs font-bold mt-0.5 ${ds.missing_total > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {ds.missing_total}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Format: <b className="uppercase text-slate-400">{ds.file_type}</b></span>
                    <span>Size: {(ds.size_bytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <button
                      onClick={() => {
                        setActiveDataset(ds);
                        onNavigate('analysis');
                      }}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] py-1.5 rounded font-medium flex items-center justify-center space-x-1"
                      title="Analyze"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-primary-400" />
                      <span>Stats</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDataset(ds);
                        onNavigate('cleaning');
                      }}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] py-1.5 rounded font-medium flex items-center justify-center space-x-1"
                      title="Clean"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-accent-400" />
                      <span>Clean</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDataset(ds);
                        onNavigate('visualizations');
                      }}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] py-1.5 rounded font-medium flex items-center justify-center space-x-1"
                      title="Visualize"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Charts</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDataset(ds);
                        onNavigate('chatbot');
                      }}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] py-1.5 rounded font-medium flex items-center justify-center space-x-1"
                      title="Chatbot"
                    >
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chat</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {!isActive ? (
                      <button
                        onClick={() => setActiveDataset(ds)}
                        className="text-xs font-semibold text-primary-400 hover:text-primary-300"
                      >
                        Set as Active
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Currently Active
                      </span>
                    )}

                    <div className="flex items-center space-x-2">
                      <a
                        href={api.getDownloadUrl(ds.storage_key, ds.filename)}
                        download={ds.filename}
                        className="p-1.5 text-slate-400 hover:text-white transition rounded hover:bg-slate-800"
                        title="Download dataset file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(ds.id, ds.name)}
                        disabled={deletingId === ds.id}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded hover:bg-slate-800"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

