import React, { useState } from 'react';
import {
  Database,
  Cloud,
  ChevronDown,
  RefreshCw,
  LogOut,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataset } from '../context/DatasetContext';

interface TopbarProps {
  onNavigateUpload: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onNavigateUpload }) => {
  const { user, logout } = useAuth();
  const { datasets, activeDataset, setActiveDataset, seedSamples, isLoading } = useDataset();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Left: Active Dataset Selector Dropdown */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 px-3.5 py-1.5 rounded-lg text-sm transition font-medium shadow-sm"
          >
            <Database className="w-4 h-4 text-primary-400" />
            <span className="max-w-[200px] truncate">
              {activeDataset ? activeDataset.name : 'Select Dataset...'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Available Datasets ({datasets.length})
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {datasets.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">
                    No datasets uploaded yet.
                  </div>
                ) : (
                  datasets.map((ds) => (
                    <button
                      key={ds.id}
                      onClick={() => {
                        setActiveDataset(ds);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${activeDataset?.id === ds.id ? 'bg-primary-500/10 text-primary-300 font-semibold' : 'text-slate-300'
                        }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate">{ds.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {ds.row_count.toLocaleString()} rows • {ds.file_type.toUpperCase()}
                        </p>
                      </div>
                      {ds.is_cleaned && (
                        <span className="text-[9px] bg-accent-500/20 text-accent-300 px-1.5 py-0.5 rounded font-bold">
                          Cleaned
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-slate-800 p-2 flex space-x-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigateUpload();
                  }}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white text-xs py-1.5 rounded-lg font-medium text-center transition"
                >
                  Upload New
                </button>
                <button
                  onClick={async () => {
                    await seedSamples();
                    setDropdownOpen(false);
                  }}
                  disabled={isLoading}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                  title="Load 5 pre-configured sample datasets"
                >
                  Load 5 Samples
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Sample Dataset Loader */}
        <button
          onClick={seedSamples}
          disabled={isLoading}
          className="hidden md:flex items-center space-x-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700/60 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Load 5 Samples</span>
          {isLoading && <RefreshCw className="w-3 h-3 animate-spin ml-1 text-slate-400" />}
        </button>
      </div>

      {/* Right: Architecture Badge & User Profile */}
      <div className="flex items-center space-x-4">
        {/* Environment Status Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-[11px] text-slate-300">
          <Cloud className="w-3.5 h-3.5 text-primary-400" />
          <span>Zero-Cost Mode</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.name || 'Analyst'}</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-xs font-bold text-white shadow">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

