'use client';

import { useState } from 'react';
import { WindowCard } from './WindowCard';
import { searchStations, getStationInfo, getStationColor, getStationBorderColor, type Station } from '@/lib/dataService';
import { useStations } from '@/lib/StationContext';

export default function MyStationsCard() {
  const { stations, addStation, removeStation, counts, isLoadingCounts, error } = useStations();
  const [newStationId, setNewStationId] = useState('');
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleAddStation = async () => {
    const trimmedId = newStationId.trim();
    if (!trimmedId || trimmedId.length > 50) {
      alert('Please enter a valid Station ID (max 50 characters)');
      return;
    }
    
    setIsSearching(true);
    try {
      // First try to get station info directly by ID
      const stationInfo = await getStationInfo(trimmedId);
      if (stationInfo) {
        addStation(stationInfo);
        setNewStationId('');
        setSearchResults([]);
        return;
      }
      
      // If direct lookup fails, try searching
      const results = await searchStations(newStationId.trim());
      if (results.length > 0) {
        setSearchResults(results);
      } else {
        alert('Station not found. Please check the Station ID or try a different search term.');
      }
    } catch (error) {
      console.error('Error adding station:', error);
      alert('Error adding station. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (station: Station) => {
    addStation(station);
    setSearchResults([]);
    setNewStationId('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddStation();
    }
  };

  return (
    <WindowCard title="My Stations" retro icon="📡">
      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newStationId}
            onChange={(e) => setNewStationId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter Station ID or search..."
            className="flex-1 px-3 py-2 border-2 border-black rounded-none"
            style={{
              background: 'var(--panel)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-0)'
            }}
            disabled={isSearching}
          />
          <button
            onClick={handleAddStation}
            className="btn-retro"
            data-variant="primary"
            disabled={isSearching}
          >
            {isSearching ? '...' : 'Add Station'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium muted">Search Results:</div>
            {searchResults.map((station) => (
              <div
                key={station.id}
                className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-100"
                style={{ borderRadius: 'var(--radius-0)' }}
                onClick={() => selectSearchResult(station)}
              >
                <div>
                  <div className="font-medium">{station.name}</div>
                  <div className="text-sm muted">{station.location || 'Unknown location'}</div>
                  {station.counts && (
                    <div className="text-xs muted">
                      {station.counts.detections} detections, {station.counts.species} species
                    </div>
                  )}
                </div>
                <button className="btn-retro text-xs" data-variant="ghost">
                  Add
                </button>
              </div>
            ))}
            <button
              onClick={() => setSearchResults([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-200 rounded-md">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Station Stats */}
        {counts && (
          <div className="grid grid-cols-3 gap-4 p-4 rounded-md" style={{ background: 'var(--surface-alt)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{counts.detections}</div>
              <div className="text-sm muted">Detections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{counts.species}</div>
              <div className="text-sm muted">Species</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{counts.stations}</div>
              <div className="text-sm muted">Stations</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingCounts && (
          <div className="text-center py-4 muted">
            <div className="text-sm">Loading station statistics...</div>
          </div>
        )}

        {/* Station List */}
        {stations.length > 0 ? (
          <div className="space-y-2">
            {stations.map((station, index) => {
              const stationColor = getStationColor(station.id, index);
              const borderColor = getStationBorderColor(station.id, index);
              
              
              return (
                <div
                  key={station.id}
                  className={`species-retro ${stationColor} border-l-4 ${borderColor}`}
                >
                  <div className="thumb bg-gray-100 flex items-center justify-center text-sm">
                    📡
                  </div>
                  <div>
                    <div className="name">{station.name}</div>
                    <div className="meta">
                      {station.location || `${station.state || ''}${station.state && station.country ? ', ' : ''}${station.country || ''}` || 'Location unknown'}
                    </div>
                    {station.coords && (
                      <div className="text-xs muted">
                        📍 {station.coords.lat.toFixed(2)}, {station.coords.lon.toFixed(2)}
                      </div>
                    )}
                    {station.weather ? (
                      <div className="text-xs muted">
                        🌤️ {Math.round(station.weather.temp - 273.15)}°C • {station.weather.description} • {station.weather.humidity}% humidity • {station.weather.windSpeed}m/s wind
                      </div>
                    ) : (
                      <div className="text-xs muted">
                        🌤️ Weather data not available
                      </div>
                    )}
                    {station.counts && (
                      <div className="text-xs muted">
                        {station.counts.detections} detections, {station.counts.species} species
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeStation(station.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-bold"
                      aria-label={`Remove station ${station.name}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 muted">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-sm font-medium">No stations added yet</p>
            <p className="text-xs">Add a Station ID to start tracking bird detections</p>
          </div>
        )}
      </div>
    </WindowCard>
  );
}
