// Data service for BirdWeather API
import { gql } from './gql';
import {
  TODAY_DETECTIONS,
  TOP_SPECIES,
  TIME_OF_DAY_COUNTS,
  STATION_INFO,
  SEARCH_STATIONS,
  COUNTS,
  DAILY_DETECTION_COUNTS,
} from './queries';

export interface Station {
  id: string;
  name: string;
  location?: string;
  country?: string;
  state?: string;
  coords?: {
    lat: number;
    lon: number;
  };
  type?: string;
  latestDetectionAt?: string;
  earliestDetectionAt?: string;
  counts?: {
    detections: number;
    species: number;
  };
  weather?: {
    temp: number;
    description: string;
    humidity: number;
    windSpeed: number;
    pressure: number;
    visibility: number;
    cloudiness: number;
    feelsLike: number;
    windDir: number;
    windGust?: number;
    rain1h?: number;
    rain3h?: number;
    snow1h?: number;
    snow3h?: number;
    sunrise: string;
    sunset: string;
    tempMax: number;
    tempMin: number;
    timestamp?: string;
    coords?: {
      lat: number;
      lon: number;
    };
    groundLevel?: number;
    seaLevel?: number;
  };
  timezone?: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName?: string;
  thumbnailUrl?: string;
  color?: string;
}

export interface Detection {
  id: string;
  timestamp: string;
  confidence: number;
  probability?: number;
  score: number;
  species: Species;
  station?: {
    id: string;
    name: string;
    location?: string;
  };
}

export interface SpeciesCount {
  count: number;
  averageProbability?: number;
  species: Species;
  speciesId: string;
}

export interface TimeOfDayBin {
  count: number;
  key: number; // hour of day (0-23)
}

export interface TimeOfDayCount {
  species: Species;
  speciesId: string;
  count: number;
  bins: TimeOfDayBin[];
}

export interface DailyCount {
  date: string;
  total: number;
  counts: {
    count: number;
    species: Species;
    speciesId: string;
  }[];
}

export interface Counts {
  detections: number;
  species: number;
  stations: number;
  birdnet?: number;
}

// Helper function to create time period for "last 24 hours" (rolling window)
function getTodayPeriod() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Use date range that includes the entire 24-hour window
  // The API may interpret dates as start-of-day, so we use:
  // from: date 24 hours ago (may include partial day)
  // to: today's date + 1 (to ensure we get today's data up to now)
  // This ensures we capture all detections from the last 24 hours
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    from: twentyFourHoursAgo.toISOString().split('T')[0],
    to: tomorrow.toISOString().split('T')[0], // Inclusive up to end of today
  };
}

// Helper function to create time period for "last 7 days"
function getLastWeekPeriod() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return {
    from: weekAgo.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  };
}

// Search for stations
export async function searchStations(query: string): Promise<Station[]> {
  // Validate and sanitize input
  const sanitizedQuery = query.trim().slice(0, 200); // Limit length
  if (!sanitizedQuery) {
    return [];
  }
  
  try {
    const result = await gql<{ stations: { nodes: Station[] } }>(
      SEARCH_STATIONS,
      { query: sanitizedQuery, first: 20 }
    );
    return result.stations.nodes;
  } catch (error) {
    console.error('Error searching stations:', error);
    return [];
  }
}

// Get station information
export async function getStationInfo(stationId: string): Promise<Station | null> {
  // Validate input: alphanumeric and reasonable length
  const sanitizedId = stationId.trim().slice(0, 50);
  if (!sanitizedId || !/^[a-zA-Z0-9_-]+$/.test(sanitizedId)) {
    return null;
  }
  
  try {
    const result = await gql<{ station: Station }>(STATION_INFO, { id: sanitizedId });
    return result.station;
  } catch (error) {
    console.error('Error fetching station info:', error);
    return null;
  }
}

// Get detections from last 24 hours for stations (with caching to reduce API calls)
export async function getTodayDetections(stationIds: string[]): Promise<Detection[]> {
  const cacheKey = `today_${stationIds.sort().join('_')}`;
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  
  // Check cache first
  const cached = todayDetectionsCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    // Filter cached data to ensure it's within last 24 hours
    // But recalculate 24h ago since time has passed
    const filtered = cached.data.filter(d => {
      const detectionTime = new Date(d.timestamp).getTime();
      return detectionTime >= twentyFourHoursAgo;
    });
    return filtered;
  }
  
  // Clear expired cache
  if (cached && cached.expiresAt <= now) {
    todayDetectionsCache.delete(cacheKey);
  }
  
  if (!checkRateLimit()) {
    // Return stale cache if available to avoid blocking
    if (cached) {
      const filtered = cached.data.filter(d => {
        const detectionTime = new Date(d.timestamp).getTime();
        return detectionTime >= twentyFourHoursAgo;
      });
      return filtered;
    }
    return [];
  }
  
  try {
    recordApiCall();
    const period = getTodayPeriod();
    const result = await gql<{ detections: { nodes: Detection[] } }>(
      TODAY_DETECTIONS,
      { stationIds, period }
    );
    
    // Filter to only include detections from the actual last 24 hours
    // This ensures we get precise 24-hour window even if API date filtering is imprecise
    const filteredDetections = result.detections.nodes.filter(d => {
      const detectionTime = new Date(d.timestamp).getTime();
      return detectionTime >= twentyFourHoursAgo;
    });
    
    // Cache the filtered results
    todayDetectionsCache.set(cacheKey, {
      data: filteredDetections,
      timestamp: now,
      expiresAt: now + TODAY_CACHE_DURATION
    });
    
    return filteredDetections;
  } catch (error) {
    console.error('Error fetching last 24 hours detections:', error);
    // Return stale cache if available, but still filter to last 24 hours
    if (cached) {
      const filtered = cached.data.filter(d => {
        const detectionTime = new Date(d.timestamp).getTime();
        return detectionTime >= twentyFourHoursAgo;
      });
      return filtered;
    }
    return [];
  }
}

// Get top species for last 24 hours
export async function getTopSpecies(stationIds: string[], limit: number = 10): Promise<SpeciesCount[]> {
  try {
    const result = await gql<{ topSpecies: SpeciesCount[] }>(
      TOP_SPECIES,
      { stationIds, period: getTodayPeriod(), limit }
    );
    return result.topSpecies;
  } catch (error) {
    console.error('Error fetching top species:', error);
    return [];
  }
}

// Get time-of-day detection counts for patterns
export async function getTimeOfDayCounts(stationIds: string[]): Promise<TimeOfDayCount[]> {
  try {
    const result = await gql<{ timeOfDayDetectionCounts: TimeOfDayCount[] }>(
      TIME_OF_DAY_COUNTS,
      { stationIds, period: getTodayPeriod() }
    );
    return result.timeOfDayDetectionCounts;
  } catch (error) {
    console.error('Error fetching time-of-day counts:', error);
    return [];
  }
}

// Get daily detection counts for weekly patterns
export async function getDailyDetectionCounts(stationIds: string[]): Promise<DailyCount[]> {
  try {
    const result = await gql<{ dailyDetectionCounts: DailyCount[] }>(
      DAILY_DETECTION_COUNTS,
      { stationIds, period: getLastWeekPeriod() }
    );
    return result.dailyDetectionCounts;
  } catch (error) {
    console.error('Error fetching daily detection counts:', error);
    return [];
  }
}

// Get counts overview
export async function getCounts(stationIds: string[]): Promise<Counts | null> {
  try {
    const result = await gql<{ counts: Counts }>(COUNTS, { stationIds, period: getTodayPeriod() });
    return result.counts;
  } catch (error) {
    console.error('Error fetching counts:', error);
    return null;
  }
}

// Cache for last 24 hours detections to reduce API calls
const todayDetectionsCache = new Map<string, {
  data: Detection[];
  timestamp: number;
  expiresAt: number;
}>();

// Cache duration: 5 minutes for last 24 hours detections
const TODAY_CACHE_DURATION = 5 * 60 * 1000;

// Rate limiting: track API calls per minute with sliding window
const apiCallTracker = new Map<string, number[]>();
const MAX_CALLS_PER_MINUTE = 10; // Very conservative limit to avoid blocking
const MIN_CALL_INTERVAL = 1000; // Minimum 1 second between calls
let lastApiCallTime = 0;

// Rate limiting helper - prevents API overload
function checkRateLimit(): boolean {
  const now = Date.now();
  const minuteAgo = now - 60000;
  
  // Enforce minimum interval between calls
  if (now - lastApiCallTime < MIN_CALL_INTERVAL) {
    return false;
  }
  
  // Clean old entries
  apiCallTracker.forEach((calls, key) => {
    const recentCalls = calls.filter(timestamp => timestamp > minuteAgo);
    if (recentCalls.length === 0) {
      apiCallTracker.delete(key);
    } else {
      apiCallTracker.set(key, recentCalls);
    }
  });
  
  // Check if we're under the limit
  const totalRecentCalls = Array.from(apiCallTracker.values())
    .flat()
    .filter(timestamp => timestamp > minuteAgo).length;
  
  return totalRecentCalls < MAX_CALLS_PER_MINUTE;
}

function recordApiCall(): void {
  const now = Date.now();
  lastApiCallTime = now;
  const key = 'global';
  const calls = apiCallTracker.get(key) || [];
  calls.push(now);
  apiCallTracker.set(key, calls);
}

// Generate consistent station colors for visual identification
export function getStationColor(stationId: string, stationIndex: number): string {
  // Create subtle background colors that work with the retro aesthetic
  // Using !important to override the CSS background
  const baseColors = [
    '!bg-blue-50',        // Very light blue
    '!bg-green-50',       // Very light green
    '!bg-yellow-50',     // Very light yellow
    '!bg-purple-50',     // Very light purple
    '!bg-pink-50',       // Very light pink
    '!bg-indigo-50',     // Very light indigo
    '!bg-orange-50',     // Very light orange
    '!bg-teal-50',       // Very light teal
  ];
  
  // Use station index to cycle through colors, with fallback to hash-based selection
  if (stationIndex < baseColors.length) {
    return baseColors[stationIndex];
  }
  
  // For more than 8 stations, use a hash-based approach
  let hash = 0;
  for (let i = 0; i < stationId.length; i++) {
    hash = ((hash << 5) - hash + stationId.charCodeAt(i)) & 0xffffffff;
  }
  return baseColors[Math.abs(hash) % baseColors.length];
}

// Get just the border color for station indicators
export function getStationBorderColor(stationId: string, stationIndex: number): string {
  const borderColors = [
    'border-blue-400', 'border-green-400', 'border-yellow-400', 'border-purple-400',
    'border-pink-400', 'border-indigo-400', 'border-orange-400', 'border-teal-400'
  ];
  
  if (stationIndex < borderColors.length) {
    return borderColors[stationIndex];
  }
  
  // Hash-based fallback
  let hash = 0;
  for (let i = 0; i < stationId.length; i++) {
    hash = ((hash << 5) - hash + stationId.charCodeAt(i)) & 0xffffffff;
  }
  return borderColors[Math.abs(hash) % borderColors.length];
}

// Get station name by ID for display
export function getStationName(stationId: string, stations: Station[]): string {
  const station = stations.find(s => s.id === stationId);
  return station ? station.name : `Station ${stationId}`;
}

// Clear cache function for when stations are added/removed
export function clearTodayCache() {
  todayDetectionsCache.clear();
}

// Get cache status for monitoring (useful for diagnostics)
export function getCacheStatus() {
  const now = Date.now();
  const status: Array<{ key: string; expiresIn: number; dataCount: number }> = [];
  
  todayDetectionsCache.forEach((value, key) => {
    status.push({
      key,
      expiresIn: value.expiresAt - now,
      dataCount: value.data.length
    });
  });
  
  return status;
}

// Helper functions removed - simplified highlights no longer need historical analysis

// Process detections to find highlights (simplified - no historical data fetching)
// This version uses only last 24 hours data to avoid overwhelming the API
export async function processHighlights(stationIds: string[], todaysDetections: Detection[]): Promise<Array<Detection & { highlightType: string }>> {
  if (todaysDetections.length === 0) return [];

  // Group last 24 hours detections by species
  const speciesGroups = new Map<string, Detection[]>();
  todaysDetections.forEach(detection => {
    const speciesId = detection.species.id;
    if (!speciesGroups.has(speciesId)) {
      speciesGroups.set(speciesId, []);
    }
    speciesGroups.get(speciesId)!.push(detection);
  });

  const highlights: Array<Detection & { highlightType: string }> = [];

  // Process each species detected in last 24 hours
  // Use only last 24 hours data - highlight based on confidence and frequency within the period
  speciesGroups.forEach((speciesDetections) => {
    // Sort by timestamp to get first detection
    const sortedDetections = speciesDetections.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const firstDetectionInPeriod = sortedDetections[0];
    const detectionCount = speciesDetections.length;
    const avgConfidence = speciesDetections.reduce((sum, d) => sum + d.confidence, 0) / detectionCount;
    
    // Skip very low confidence detections (likely misidentifications)
    if (avgConfidence < 0.4) {
      return;
    }
    
    // Determine highlight type based on last 24 hours patterns only
    let highlightType = 'notable';
    
    // High confidence + first time seen in period = notable
    if (detectionCount === 1 && avgConfidence > 0.85) {
      highlightType = 'notable';
    }
    // Rare detection (very high confidence, single detection)
    else if (detectionCount === 1 && avgConfidence > 0.95) {
      highlightType = 'rare-sighting';
    }
    // Multiple detections but still high confidence = common in period
    else if (detectionCount > 5) {
      // Skip - too common in last 24 hours
      return;
    }
    
    highlights.push({
      ...firstDetectionInPeriod,
      highlightType
    });
  });

  // Sort by confidence and return top highlights (limit to 5)
  return highlights
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

// Historical data fetching removed to prevent API overload
// Highlights now use only last 24 hours data - no fallback needed

// Process detections to get unique species with counts and time windows
export function processSpeciesSummary(detections: Detection[]): Array<{
  species: Species;
  count: number;
  timeWindow: string;
  station: string;
  stationId: string;
  confidence: number;
}> {
  const speciesMap = new Map<string, {
    species: Species;
    detections: Detection[];
    stations: Set<string>;
    stationIds: Set<string>;
  }>();

  detections.forEach(detection => {
    const speciesId = detection.species.id;
    if (!speciesMap.has(speciesId)) {
      speciesMap.set(speciesId, {
        species: detection.species,
        detections: [],
        stations: new Set(),
        stationIds: new Set(),
      });
    }
    
    const entry = speciesMap.get(speciesId)!;
    entry.detections.push(detection);
    if (detection.station) {
      entry.stations.add(detection.station.name);
      entry.stationIds.add(detection.station.id);
    }
  });

  return Array.from(speciesMap.values()).map(({ species, detections, stations, stationIds }) => {
    const sortedDetections = detections.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const firstDetection = sortedDetections[0];
    const lastDetection = sortedDetections[sortedDetections.length - 1];
    
    const firstTime = new Date(firstDetection.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const lastTime = new Date(lastDetection.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
    
    // Use the first station ID for color coding (most detections will be from one station)
    const primaryStationId = Array.from(stationIds)[0] || '';
    
    return {
      species,
      count: detections.length,
      timeWindow: `${firstTime}–${lastTime}`,
      station: Array.from(stations).join(', '),
      stationId: primaryStationId,
      confidence: avgConfidence,
    };
  }).sort((a, b) => b.count - a.count);
}
