'use client';

import { useState, useEffect } from 'react';
import { WindowCard } from './WindowCard';
import { getTodayDetections, processSpeciesSummary, getStationColor, getStationBorderColor } from '@/lib/dataService';
import { useStations } from '@/lib/StationContext';

interface SpeciesDetection {
  species: {
    id: string;
    commonName: string;
    scientificName?: string;
    thumbnailUrl?: string;
    color?: string;
  };
  count: number;
  timeWindow: string;
  station: string;
  stationId: string;
  confidence: number;
}

export default function TodaysSpeciesCard() {
  const { stations } = useStations();
  const [species, setSpecies] = useState<SpeciesDetection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpeciesData = async () => {
      if (stations.length === 0) {
        setSpecies([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const stationIds = stations.map(s => s.id);
        const detections = await getTodayDetections(stationIds);
        const processedSpecies = processSpeciesSummary(detections);
        setSpecies(processedSpecies);
      } catch (error) {
        console.error('Error fetching species data:', error);
        setError('Failed to load species data');
        setSpecies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpeciesData();
    
    // Set up periodic refresh every 60 seconds
    const interval = setInterval(fetchSpeciesData, 60000);
    
    return () => clearInterval(interval);
  }, [stations]);

  return (
    <WindowCard title="Last 24 Hours Species" retro icon="📋">
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm font-medium">Loading species...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="text-xs">Please try again later</p>
          </div>
        ) : species.length > 0 ? (
          species.map((detection, index) => {
            const stationIndex = stations.findIndex(s => s.id === detection.stationId);
            const stationColor = getStationColor(detection.stationId, stationIndex);
            
            return (
              <div key={detection.species.id || index} className={`species-retro ${stationColor} border-l-4 ${getStationBorderColor(detection.stationId, stationIndex)}`}>
                <div className="thumb bg-gray-100 flex items-center justify-center text-sm">
                  {detection.species.thumbnailUrl ? (
                    <img 
                      src={detection.species.thumbnailUrl} 
                      alt={detection.species.commonName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🐦'
                  )}
                </div>
                <div>
                  <div className="name">{detection.species.commonName}</div>
                  <div className="meta">
                    <span className="font-medium">{detection.station}</span> • {detection.timeWindow}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill">{detection.count}</span>
                  <span className="text-sm muted">
                    {Math.round(detection.confidence * 100)}%
                  </span>
                </div>
              </div>
            );
          })
        ) : stations.length === 0 ? (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm font-medium">No species detected in the last 24 hours</p>
            <p className="text-xs">Add stations to see species counts and time windows</p>
          </div>
        ) : (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm font-medium">No species detected in the last 24 hours</p>
            <p className="text-xs">No detections found for your stations</p>
          </div>
        )}
      </div>
    </WindowCard>
  );
}
