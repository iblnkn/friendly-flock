'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Station, getCounts, clearHistoricalCache, type Counts } from './dataService';

interface StationContextType {
  stations: Station[];
  addStation: (station: Station) => void;
  removeStation: (stationId: string) => void;
  counts: Counts | null;
  isLoadingCounts: boolean;
  error: string | null;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export function StationProvider({ children }: { children: ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stations from localStorage on mount
  useEffect(() => {
    const savedStations = localStorage.getItem('bird-buddy-stations');
    if (savedStations) {
      try {
        setStations(JSON.parse(savedStations));
      } catch (error) {
        console.error('Error loading stations from localStorage:', error);
      }
    }
  }, []);

  // Save stations to localStorage whenever stations change
  useEffect(() => {
    localStorage.setItem('bird-buddy-stations', JSON.stringify(stations));
  }, [stations]);

  // Load counts when stations change
  useEffect(() => {
    if (stations.length > 0) {
      setIsLoadingCounts(true);
      setError(null);
      
      const stationIds = stations.map(s => s.id);
      getCounts(stationIds)
        .then(setCounts)
        .catch(error => {
          console.error('Error fetching counts:', error);
          setError('Failed to load station statistics');
          setCounts(null);
        })
        .finally(() => {
          setIsLoadingCounts(false);
        });
    } else {
      setCounts(null);
      setIsLoadingCounts(false);
      setError(null);
    }
  }, [stations]);

  const addStation = (station: Station) => {
    setStations(prev => {
      // Check if station already exists
      if (prev.some(s => s.id === station.id)) {
        return prev;
      }
      return [...prev, station];
    });
    // Clear cache when stations change
    clearHistoricalCache();
  };

  const removeStation = (stationId: string) => {
    setStations(prev => prev.filter(s => s.id !== stationId));
    // Clear cache when stations change
    clearHistoricalCache();
  };

  return (
    <StationContext.Provider
      value={{
        stations,
        addStation,
        removeStation,
        counts,
        isLoadingCounts,
        error,
      }}
    >
      {children}
    </StationContext.Provider>
  );
}

export function useStations() {
  const context = useContext(StationContext);
  if (context === undefined) {
    throw new Error('useStations must be used within a StationProvider');
  }
  return context;
}
