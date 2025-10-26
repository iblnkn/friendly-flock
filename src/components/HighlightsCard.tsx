'use client';

import { useState, useEffect } from 'react';
import { WindowCard } from './WindowCard';
import { getTodayDetections, processHighlights, getStationColor, getStationBorderColor, getStationName, type Detection } from '@/lib/dataService';
import { useStations } from '@/lib/StationContext';

export default function HighlightsCard() {
  const { stations } = useStations();
  const [highlights, setHighlights] = useState<(Detection & { highlightType?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHighlights = async (isInitialLoad = false) => {
      if (stations.length === 0) {
        setHighlights([]);
        setError(null);
        return;
      }

      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      try {
        const stationIds = stations.map(s => s.id);
        const todaysDetections = await getTodayDetections(stationIds);
        const processedHighlights = await processHighlights(stationIds, todaysDetections);
        setHighlights(processedHighlights);
      } catch (error) {
        console.error('Error fetching highlights:', error);
        setError('Failed to load highlights');
        setHighlights([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchHighlights(true); // Initial load
    
    // Set up periodic refresh every 60 seconds
    const interval = setInterval(() => fetchHighlights(false), 60000);
    
    return () => clearInterval(interval);
  }, [stations]);

  const getBadgeText = (detection: Detection & { highlightType?: string }) => {
    // Use the highlightType from the processed data if available
    if (detection.highlightType) {
      return detection.highlightType;
    }
    
    // Fallback to confidence-based logic
    if (detection.confidence > 0.9) return 'First-ever';
    if (detection.confidence > 0.8) return 'First-of-season';
    return 'Unusual';
  };

  const getBadgeColor = (highlightType: string) => {
    switch (highlightType) {
      case 'first-ever':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'first-of-season':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rare-sighting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'unusual':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <WindowCard title={`Today's Highlights${isRefreshing ? ' 🔄' : ''}`} retro icon="⭐">
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm font-medium">Loading highlights...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="text-xs">Please try again later</p>
          </div>
        ) : highlights.length > 0 ? (
          highlights.map((highlight) => {
            const stationIndex = stations.findIndex(s => s.id === highlight.station?.id);
            const stationColor = getStationColor(highlight.station?.id || '', stationIndex);
            const stationName = getStationName(highlight.station?.id || '', stations);
            
            return (
              <div key={highlight.id} className={`species-retro ${stationColor} border-l-4 ${getStationBorderColor(highlight.station?.id || '', stationIndex)}`}>
                <div className="thumb bg-gray-100 flex items-center justify-center text-lg">
                  {highlight.species.thumbnailUrl ? (
                    <img 
                      src={highlight.species.thumbnailUrl} 
                      alt={highlight.species.commonName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🐦'
                  )}
                </div>
                <div>
                  <div className="name">{highlight.species.commonName}</div>
                  <div className="meta">
                    <span className="font-medium">{stationName}</span> • {formatTime(highlight.timestamp)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`pill ${getBadgeColor(highlight.highlightType || 'unusual')}`}>
                    {getBadgeText(highlight)}
                  </span>
                  <span className="text-sm font-medium muted">
                    {Math.round(highlight.confidence * 100)}%
                  </span>
                </div>
              </div>
            );
          })
        ) : stations.length === 0 ? (
          <div className="text-center py-12 muted">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium mb-2">No highlights today</p>
            <p className="text-sm">Add stations to see first-ever, first-of-season, and unusual detections</p>
          </div>
        ) : (
          <div className="text-center py-12 muted">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium mb-2">No highlights today</p>
            <p className="text-sm">No notable detections found for your stations</p>
          </div>
        )}
      </div>
    </WindowCard>
  );
}
