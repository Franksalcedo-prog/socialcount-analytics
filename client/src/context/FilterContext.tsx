import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, DateRangePreset } from '../types';

interface FilterContextType {
  platform: Platform;
  setPlatform: (p: Platform) => void;
  preset: DateRangePreset;
  setPreset: (preset: DateRangePreset) => void;
  startDate: string;
  endDate: string;
  setDateRange: (start: string, end: string) => void;
  includeReplies: boolean;
  setIncludeReplies: (inc: boolean) => void;
  selectedAccountId: string | undefined;
  setSelectedAccountId: (id: string | undefined) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platform, setPlatform] = useState<Platform>('ALL');
  const [preset, setPreset] = useState<DateRangePreset>('last30days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [includeReplies, setIncludeReplies] = useState<boolean>(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Recalcular fechas al cambiar preset
  useEffect(() => {
    const now = new Date();
    const end = now.toISOString();

    let start = new Date();
    if (preset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === 'last7days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === 'last30days') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'allTime') {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    setStartDate(start.toISOString());
    setEndDate(end);
  }, [preset]);

  const setDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <FilterContext.Provider
      value={{
        platform,
        setPlatform,
        preset,
        setPreset,
        startDate,
        endDate,
        setDateRange,
        includeReplies,
        setIncludeReplies,
        selectedAccountId,
        setSelectedAccountId,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters debe usarse dentro de FilterProvider');
  }
  return context;
};
