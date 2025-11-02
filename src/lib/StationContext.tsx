'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Station, getCounts, clearTodayCache, type Counts } from './dataService';

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
        const parsed = JSON.parse(savedStations);
        setTimeout(() => setStations(parsed), 0);
      } catch (error) {
        console.error('Error loading stations from localStorage:', error);
      }
    }
  }, []);

  // Save stations to localStorage whenever stations change
  useEffect(() => {
    setTimeout(() => {
      localStorage.setItem('bird-buddy-stations', JSON.stringify(stations));
    }, 0);
  }, [stations]);

  // Load counts when stations change
  useEffect(() => {
    if (stations.length > 0) {
      setTimeout(() => {
        setIsLoadingCounts(true);
        setError(null);
      }, 0);
      
      const stationIds = stations.map(s => s.id);
      getCounts(stationIds)
        .then(counts => {
          setTimeout(() => setCounts(counts), 0);
        })
        .catch(error => {
          console.error('Error fetching counts:', error);
          setTimeout(() => {
            setError('Failed to load station statistics');
            setCounts(null);
            setIsLoadingCounts(false);
          }, 0);
        })
        .finally(() => {
          setTimeout(() => setIsLoadingCounts(false), 0);
        });
    } else {
      setTimeout(() => {
        setCounts(null);
        setIsLoadingCounts(false);
        setError(null);
      }, 0);
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
    clearTodayCache();
  };

  const removeStation = (stationId: string) => {
    setStations(prev => prev.filter(s => s.id !== stationId));
    // Clear cache when stations change
    clearTodayCache();
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
