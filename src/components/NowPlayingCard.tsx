'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from 'urql';
import { WindowCard } from './WindowCard';
import { NEW_DETECTION_SUBSCRIPTION } from '@/lib/queries';
import { useStations } from '@/lib/StationContext';
import { type Detection, getStationColor, getStationBorderColor } from '@/lib/dataService';

interface LiveDetection {
  id: string;
  species: {
    id: string;
    commonName: string;
    scientificName?: string;
    thumbnailUrl?: string;
    color?: string;
  };
  station: {
    id: string;
    name: string;
    location?: string;
  };
  time: string;
  confidence: number;
  timestamp: string;
}

export default function NowPlayingCard() {
  const { stations } = useStations();
  const [detections, setDetections] = useState<LiveDetection[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Set up GraphQL subscription for live detections
  const stationIds = stations.map(s => s.id);
  const [result] = useSubscription({
    query: NEW_DETECTION_SUBSCRIPTION,
    variables: { stationIds },
    pause: stationIds.length === 0, // Pause subscription if no stations
  });

  // Handle subscription updates
  useEffect(() => {
    if (result.data?.newDetection?.detection) {
      const detection = result.data.newDetection.detection as Detection;
      
      const liveDetection: LiveDetection = {
        id: detection.id,
        species: detection.species,
        station: detection.station || { id: 'unknown', name: 'Unknown Station' },
        time: new Date(detection.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        }),
        confidence: detection.confidence,
        timestamp: detection.timestamp,
      };

      setDetections(prev => [liveDetection, ...prev.slice(0, 4)]); // Keep last 5 detections
    }
  }, [result.data]);

  // Update connection status
  useEffect(() => {
    if (stationIds.length === 0) {
      setIsConnected(false);
      return;
    }

    if (result.fetching) {
      setIsConnected(true);
    } else if (result.error) {
      console.error('Subscription error:', result.error);
      setIsConnected(false);
    } else {
      setIsConnected(true);
    }
  }, [result.fetching, result.error, stationIds.length]);

  // Show mock data when no stations are configured
  useEffect(() => {
    if (stations.length === 0) {
      const mockDetections: LiveDetection[] = [
        {
          id: '1',
          species: {
            id: '1',
            commonName: 'House Finch',
            scientificName: 'Haemorhous mexicanus',
            thumbnailUrl: undefined,
            color: '#FF6B6B'
          },
          station: {
            id: '123',
            name: 'Station-123',
            location: 'Sample Location'
          },
          time: '14:32',
          confidence: 0.89,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          species: {
            id: '2',
            commonName: 'American Goldfinch',
            scientificName: 'Spinus tristis',
            thumbnailUrl: undefined,
            color: '#4ECDC4'
          },
          station: {
            id: '456',
            name: 'Station-456',
            location: 'Sample Location'
          },
          time: '14:28',
          confidence: 0.92,
          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          species: {
            id: '3',
            commonName: 'Chickadee',
            scientificName: 'Poecile atricapillus',
            thumbnailUrl: undefined,
            color: '#45B7D1'
          },
          station: {
            id: '789',
            name: 'Station-789',
            location: 'Sample Location'
          },
          time: '14:25',
          confidence: 0.87,
          timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString()
        }
      ];

      setDetections(mockDetections);
      setIsConnected(false);
    }
  }, [stations.length]);

  return (
    <WindowCard title="Now Playing" retro icon="🎵">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} style={{ borderRadius: 'var(--radius-0)' }}></div>
            <span className="text-sm muted font-medium">
              {isConnected ? 'Live' : stations.length === 0 ? 'Demo Mode' : 'Disconnected'}
            </span>
          </div>
          <span className="text-xs muted">
            Last 5 detections
          </span>
        </div>

        {detections.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {detections.map((detection) => {
              const stationIndex = stations.findIndex(s => s.id === detection.station.id);
              const stationColor = getStationColor(detection.station.id, stationIndex);
              
              return (
                <div key={detection.id} className={`species-retro ${stationColor} border-l-4 ${getStationBorderColor(detection.station.id, stationIndex)}`}>
                  <div className="thumb bg-gray-100 flex items-center justify-center text-sm border-2 border-black">
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
                      <span className="font-medium">{detection.station.name}</span> • {detection.time}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium muted">
                      {Math.round(detection.confidence * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-sm font-medium">No live detections</p>
            <p className="text-xs">Waiting for new bird detections...</p>
          </div>
        )}
      </div>
    </WindowCard>
  );
}
