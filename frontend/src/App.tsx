import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatasetProvider } from './context/DatasetContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { MyDatasetsPage } from './pages/MyDatasetsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { CleaningPage } from './pages/CleaningPage';
import { VisualizationsPage } from './pages/VisualizationsPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { RefreshCw } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-xs font-mono tracking-wide">Initializing AI Dataset Insight Platform...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <DatasetProvider>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onNavigateUpload={() => setActiveTab('upload')} />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
            {activeTab === 'upload' && <UploadPage onNavigate={setActiveTab} />}
            {activeTab === 'datasets' && <MyDatasetsPage onNavigate={setActiveTab} />}
            {activeTab === 'analysis' && <AnalysisPage />}
            {activeTab === 'cleaning' && <CleaningPage onNavigate={setActiveTab} />}
            {activeTab === 'visualizations' && <VisualizationsPage />}
            {activeTab === 'chatbot' && <ChatbotPage />}
            {activeTab === 'reports' && <ReportsPage />}
            {activeTab === 'settings' && <SettingsPage />}
          </main>
        </div>
      </div>
    </DatasetProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
