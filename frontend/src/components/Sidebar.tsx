import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Database,
  FileSpreadsheet,
  Wand2,
  BarChart3,
  Bot,
  FileText,
  Settings,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export type NavTab =
  | 'dashboard'
  | 'upload'
  | 'datasets'
  | 'analysis'
  | 'cleaning'
  | 'visualizations'
  | 'chatbot'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { activeDataset } = useDataset();

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'upload', label: 'Upload Dataset', icon: <UploadCloud className="w-5 h-5" /> },
    { id: 'datasets', label: 'My Datasets', icon: <Database className="w-5 h-5" /> },
    { id: 'analysis', label: 'Data Analysis', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'cleaning', label: 'Data Cleaning', icon: <Wand2 className="w-5 h-5" />, badge: 'Auto' },
    { id: 'visualizations', label: 'Visualizations', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'chatbot', label: 'AI Chatbot', icon: <Bot className="w-5 h-5" />, badge: 'Agent' },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Logo & Name */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 text-white font-bold">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
            Dataset Insight
            <span className="text-[10px] bg-primary-500/20 text-primary-300 font-semibold px-1.5 py-0.5 rounded border border-primary-500/30">
              AI
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">Zero-Budget Intelligence</p>
        </div>
      </div>

      {/* Active Dataset Context Card in Sidebar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-1 flex items-center justify-between">
          <span>Active Dataset</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        {activeDataset ? (
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-slate-200 truncate">{activeDataset.name}</p>
              <p className="text-[10px] text-slate-400">
                {activeDataset.row_count.toLocaleString()} rows • {activeDataset.col_count} cols
              </p>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                activeDataset.quality_score >= 85
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {activeDataset.quality_score}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic p-2 bg-slate-800/30 rounded border border-dashed border-slate-800 text-center">
            No dataset selected
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-600/20 text-white border border-primary-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <span className={isActive ? 'text-primary-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-300 border border-accent-500/30">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-primary-400" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Zero-Budget Guarantee Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
        <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>100% Free / ₹0 Cost</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Deterministic local agent with zero paid API or token costs.
        </p>
      </div>
    </aside>
  );
};

