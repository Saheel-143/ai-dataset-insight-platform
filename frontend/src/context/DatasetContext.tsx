import React, { createContext, useContext, useState, useEffect } from 'react';
import { DatasetMetadata, DatasetOverview } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface DatasetContextType {
  datasets: DatasetMetadata[];
  activeDataset: DatasetMetadata | null;
  activeOverview: DatasetOverview | null;
  isLoading: boolean;
  isLoadingOverview: boolean;
  setActiveDataset: (ds: DatasetMetadata | null) => void;
  refreshDatasets: () => Promise<void>;
  seedSamples: () => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [activeDataset, setActiveDataset] = useState<DatasetMetadata | null>(null);
  const [activeOverview, setActiveOverview] = useState<DatasetOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(false);

  const fetchDatasets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const list = await api.getDatasets();
      setDatasets(list);

      // Keep active dataset or select first
      if (list.length > 0) {
        if (!activeDataset || !list.some((d) => d.id === activeDataset.id)) {
          setActiveDataset(list[0]);
        } else {
          const updated = list.find((d) => d.id === activeDataset.id);
          if (updated) setActiveDataset(updated);
        }
      } else {
        setActiveDataset(null);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [user]);

  // Whenever active dataset changes, fetch its full overview
  useEffect(() => {
    if (!activeDataset) {
      setActiveOverview(null);
      return;
    }
    const fetchOverview = async () => {
      setIsLoadingOverview(true);
      try {
        const ov = await api.getAnalysis(activeDataset.id);
        setActiveOverview(ov);
      } catch (err) {
        console.error('Failed to load overview:', err);
      } finally {
        setIsLoadingOverview(false);
      }
    };
    fetchOverview();
  }, [activeDataset?.id]);

  const seedSamples = async () => {
    setIsLoading(true);
    try {
      const seeded = await api.seedSamples();
      await fetchDatasets();
      if (seeded && seeded.length > 0) {
        setActiveDataset(seeded[0]);
      }
    } catch (err) {
      console.error('Failed to seed sample datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDataset = async (id: string) => {
    await api.deleteDataset(id);
    await fetchDatasets();
  };

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        activeDataset,
        activeOverview,
        isLoading,
        isLoadingOverview,
        setActiveDataset,
        refreshDatasets: fetchDatasets,
        seedSamples,
        deleteDataset,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = () => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};

