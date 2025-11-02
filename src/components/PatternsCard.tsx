'use client';

import { useState, useEffect } from 'react';
import { WindowCard } from './WindowCard';
import { getTimeOfDayCounts, getDailyDetectionCounts, type TimeOfDayCount } from '@/lib/dataService';
import { useStations } from '@/lib/StationContext';

interface PatternData {
  species: {
    id: string;
    commonName: string;
    scientificName?: string;
    thumbnailUrl?: string;
    color?: string;
  };
  count: number;
  sparkline: number[];
}

export default function PatternsCard() {
  const { stations } = useStations();
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatterns = async () => {
      if (stations.length === 0) {
        setTimeout(() => {
          setPatterns([]);
          setError(null);
        }, 0);
        return;
      }

      setTimeout(() => {
        setIsLoading(true);
        setError(null);
      }, 0);
      
      try {
        const stationIds = stations.map(s => s.id);
        const [timeOfDayData] = await Promise.all([
          getTimeOfDayCounts(stationIds),
          getDailyDetectionCounts(stationIds) // Keep for future use
        ]);

        // Process the data to create patterns
        const processedPatterns: PatternData[] = timeOfDayData
          .slice(0, 3) // Top 3 species
          .map((item: TimeOfDayCount) => {
            // Create sparkline data from time-of-day bins
            const sparkline = Array.from({ length: 24 }, (_, hour) => {
              const bin = item.bins.find(b => b.key === hour);
              return bin ? bin.count : 0;
            });

            return {
              species: item.species,
              count: item.count,
              sparkline,
            };
          });

        setTimeout(() => {
          setPatterns(processedPatterns);
        }, 0);
      } catch (error) {
        console.error('Error fetching patterns:', error);
        setTimeout(() => {
          setError('Failed to load pattern data');
          setPatterns([]);
        }, 0);
      } finally {
        setTimeout(() => setIsLoading(false), 0);
      }
    };

    fetchPatterns();
    
    // Set up periodic refresh every 60 seconds
    const interval = setInterval(fetchPatterns, 60000);
    
    return () => clearInterval(interval);
  }, [stations]);

  const Sparkline = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height="40" viewBox="0 0 100 100" className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={points}
          fill="url(#gradient)"
          stroke="none"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <WindowCard title="Patterns" retro icon="📈">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-sm font-semibold muted mb-3">Top 3 This Week</h3>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm font-medium">Loading patterns...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="text-xs">Please try again later</p>
          </div>
        ) : patterns.length > 0 ? (
          patterns.map((pattern, index) => (
            <div key={pattern.species.id || index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 border-2 border-black flex items-center justify-center text-sm font-bold" style={{ borderRadius: 'var(--radius-0)' }}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{pattern.species.commonName}</div>
                    <div className="text-sm muted">{pattern.count} detections</div>
                  </div>
                </div>
              </div>
              
              <div className="sparkline-container">
                <div className="text-xs muted mb-2">Peak activity (last 24 hours) vs typical</div>
                <Sparkline data={pattern.sparkline} />
                <div className="flex justify-between text-xs muted mt-2">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </div>
          ))
        ) : stations.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-3">📈</div>
            <p className="text-sm font-medium">No pattern data</p>
            <p className="text-xs">Add stations to see activity patterns</p>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-3">📈</div>
            <p className="text-sm font-medium">No pattern data</p>
            <p className="text-xs">No activity patterns found for your stations</p>
          </div>
        )}
        
        <div className="text-xs text-slate-500 text-center pt-3 border-t border-slate-200">
          Sparklines show hourly detection patterns
        </div>
      </div>
    </WindowCard>
  );
}
