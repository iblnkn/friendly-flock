// Data service for BirdWeather API
import { gql } from './gql';
import {
  STATION_DETECTIONS,
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

// Helper function to create time period for "today"
function getTodayPeriod() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    from: startOfDay.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
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
  try {
    const result = await gql<{ stations: { nodes: Station[] } }>(
      SEARCH_STATIONS,
      { query, first: 20 }
    );
    return result.stations.nodes;
  } catch (error) {
    console.error('Error searching stations:', error);
    return [];
  }
}

// Get station information
export async function getStationInfo(stationId: string): Promise<Station | null> {
  try {
    const result = await gql<{ station: Station }>(STATION_INFO, { id: stationId });
    return result.station;
  } catch (error) {
    console.error('Error fetching station info:', error);
    return null;
  }
}

// Get today's detections for stations
export async function getTodayDetections(stationIds: string[]): Promise<Detection[]> {
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded, skipping API call');
    return [];
  }
  
  try {
    recordApiCall();
    const result = await gql<{ detections: { nodes: Detection[] } }>(
      TODAY_DETECTIONS,
      { stationIds, period: getTodayPeriod() }
    );
    return result.detections.nodes;
  } catch (error) {
    console.error('Error fetching today\'s detections:', error);
    return [];
  }
}

// Get top species for a time period
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

// Cache for historical data to avoid repeated API calls
const historicalDataCache = new Map<string, {
  data: Detection[];
  timestamp: number;
  expiresAt: number;
}>();

// Cache duration: 6 hours for historical data (since it's expensive to fetch)
const CACHE_DURATION = 6 * 60 * 60 * 1000;

// Rate limiting: track API calls per minute
const apiCallTracker = new Map<string, number[]>();
const MAX_CALLS_PER_MINUTE = 30; // Conservative limit

// Rate limiting helper
function checkRateLimit(): boolean {
  const now = Date.now();
  const minuteAgo = now - 60000;
  
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
export function clearHistoricalCache() {
  historicalDataCache.clear();
}

// Get cache status for debugging
export function getCacheStatus() {
  const now = Date.now();
  const status: Array<{ key: string; expiresIn: number; dataCount: number }> = [];
  
  historicalDataCache.forEach((value, key) => {
    status.push({
      key,
      expiresIn: value.expiresAt - now,
      dataCount: value.data.length
    });
  });
  
  return status;
}

// Helper function to determine if a species is commonly detected
function isCommonSpecies(speciesId: string, detectionCount: number, avgConfidence: number): boolean {
  // A species is considered "common" if it has been detected frequently
  return detectionCount > 20;
}

// Helper function to determine if a detection is truly unusual based on rarity and patterns
function isUnusualDetection(detection: Detection, history: {
  detectionCount: number;
  avgConfidence: number;
  recentDetections: Detection[];
  firstDetection: Date;
  lastDetection: Date;
}): boolean {
  const detectionCount = history.detectionCount;
  const speciesName = detection.species.commonName.toLowerCase();
  
  // List of known common birds that should never be marked as unusual
  const commonBirds = [
    'house sparrow', 'eurasian collared-dove', 'house finch', 'american goldfinch',
    'chickadee', 'cardinal', 'blue jay', 'robin', 'crow', 'raven', 'pigeon',
    'starling', 'mockingbird', 'wren', 'sparrow', 'finch', 'dove', 'pigeon',
    'canada goose', 'mallard', 'woodpecker', 'nuthatch', 'titmouse'
  ];
  
  // Check if this is a known common bird
  const isCommonBird = commonBirds.some(commonBird => 
    speciesName.includes(commonBird) || commonBird.includes(speciesName)
  );
  
  if (isCommonBird) {
    console.log(`Skipping unusual check for common bird: ${detection.species.commonName}`);
    return false;
  }
  
  // Only mark as unusual if it's genuinely rare (detected < 3 times total in 2 years)
  if (detectionCount < 3) {
    return true;
  }
  
  // Check for seasonal rarity - if this species hasn't been seen in the last 120 days
  // This is more conservative than 60 days to avoid marking common birds as unusual
  const oneHundredTwentyDaysAgo = new Date();
  oneHundredTwentyDaysAgo.setDate(oneHundredTwentyDaysAgo.getDate() - 120);
  
  if (history.lastDetection < oneHundredTwentyDaysAgo) {
    return true; // Haven't seen this species in over 4 months
  }
  
  // Additional check: if it's a very common bird (detected > 50 times), 
  // it should never be marked as unusual regardless of recent absence
  if (detectionCount > 50) {
    return false;
  }
  
  return false;
}

// Process detections to find highlights (first-ever, first-of-season, unusual)
export async function processHighlights(stationIds: string[], todaysDetections: Detection[]): Promise<Detection[]> {
  if (todaysDetections.length === 0) return [];

  try {
    const cacheKey = `historical_${stationIds.sort().join('_')}`;
    const now = Date.now();
    
    // Check cache first
    let historicalDetections: Detection[] = [];
    const cached = historicalDataCache.get(cacheKey);
    
    if (cached && cached.expiresAt > now) {
      historicalDetections = cached.data;
    } else {
      // Fetch historical data with pagination
      historicalDetections = await fetchHistoricalDetectionsWithPagination(stationIds);
      
      // Cache the results
      historicalDataCache.set(cacheKey, {
        data: historicalDetections,
        timestamp: now,
        expiresAt: now + CACHE_DURATION
      });
    }
    
    // Create a map of species detection history
    const speciesHistory = new Map<string, {
      firstDetection: Date;
      lastDetection: Date;
      detectionCount: number;
      avgConfidence: number;
      recentDetections: Detection[];
    }>();
    
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Process historical detections
    historicalDetections.forEach(detection => {
      const detectionDate = detection.timestamp.split('T')[0];
      if (detectionDate === today) return; // Skip today's detections
      
      const speciesId = detection.species.id;
      const detectionTime = new Date(detection.timestamp);
      
      if (!speciesHistory.has(speciesId)) {
        speciesHistory.set(speciesId, {
          firstDetection: detectionTime,
          lastDetection: detectionTime,
          detectionCount: 0,
          avgConfidence: 0,
          recentDetections: []
        });
      }
      
      const history = speciesHistory.get(speciesId)!;
      history.detectionCount++;
      history.avgConfidence = (history.avgConfidence * (history.detectionCount - 1) + detection.confidence) / history.detectionCount;
      
      if (detectionTime < history.firstDetection) {
        history.firstDetection = detectionTime;
      }
      if (detectionTime > history.lastDetection) {
        history.lastDetection = detectionTime;
      }
      
      // Track recent detections (last 90 days)
      if (detectionTime >= ninetyDaysAgo) {
        history.recentDetections.push(detection);
      }
    });

    console.log(`Processed historical data for ${speciesHistory.size} species`);
    console.log('Species with historical data:', Array.from(speciesHistory.keys()).map(id => {
      const h = speciesHistory.get(id)!;
      return `${id}: ${h.detectionCount} detections, last seen ${Math.floor((Date.now() - h.lastDetection.getTime()) / (1000 * 60 * 60 * 24))} days ago`;
    }));

    // Group today's detections by species
    const speciesGroups = new Map<string, Detection[]>();
    todaysDetections.forEach(detection => {
      const speciesId = detection.species.id;
      if (!speciesGroups.has(speciesId)) {
        speciesGroups.set(speciesId, []);
      }
      speciesGroups.get(speciesId)!.push(detection);
    });

    const highlights: Array<Detection & { highlightType: string }> = [];

    // Process each species detected today
    speciesGroups.forEach((speciesDetections, speciesId) => {
      const sortedDetections = speciesDetections.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const firstDetectionToday = sortedDetections[0];
      const history = speciesHistory.get(speciesId);
      
      // Determine highlight type
      let highlightType = 'unusual';
      
      if (!history) {
        // Only mark as first-ever if we have historical data but this species isn't in it
        if (historicalDetections.length > 0) {
          highlightType = 'first-ever';
          console.log(`First-ever detection: ${firstDetectionToday.species.commonName} (not found in ${historicalDetections.length} historical detections)`);
        } else {
          // No historical data available, skip this detection
          console.log(`Skipping ${firstDetectionToday.species.commonName} - no historical data available`);
          return;
        }
      } else {
        // Check if this is the first detection of the season
        const daysSinceLastDetection = Math.floor(
          (new Date().getTime() - history.lastDetection.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        console.log(`${firstDetectionToday.species.commonName}: ${history.detectionCount} historical detections, last seen ${daysSinceLastDetection} days ago, confidence: ${firstDetectionToday.confidence}`);
        
        if (daysSinceLastDetection >= 90) {
          // No detections in the last 90 days - could be first-of-season
          highlightType = 'first-of-season';
          console.log(`First-of-season detection: ${firstDetectionToday.species.commonName}`);
        } else if (firstDetectionToday.confidence < 0.4) {
          // Very low confidence - might be a misidentification, skip it
          console.log(`Skipping ${firstDetectionToday.species.commonName} - very low confidence (${firstDetectionToday.confidence}), might be misidentification`);
          return;
        } else if (isUnusualDetection(firstDetectionToday, history)) {
          // Truly unusual detection based on rarity and patterns
          highlightType = 'unusual';
          console.log(`Unusual detection: ${firstDetectionToday.species.commonName} (detected ${history.detectionCount} times total, last seen ${daysSinceLastDetection} days ago)`);
        } else if (firstDetectionToday.confidence > 0.9 && history.detectionCount < 10) {
          // High confidence detection of a moderately rare species
          highlightType = 'rare-sighting';
          console.log(`Rare sighting: ${firstDetectionToday.species.commonName} (high confidence: ${firstDetectionToday.confidence}, detected ${history.detectionCount} times total)`);
        } else {
          // Skip this detection as it's not particularly notable (seen within last 90 days)
          console.log(`Skipping ${firstDetectionToday.species.commonName} - normal detection (${history.detectionCount} historical detections, last seen ${daysSinceLastDetection} days ago)`);
          return;
        }
      }

      highlights.push({
        ...firstDetectionToday,
        highlightType
      });
    });

    // Sort by confidence and return top highlights
    return highlights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
      
  } catch (error) {
    console.error('Error processing highlights:', error);
    // Fallback to simple processing if historical data fails
    return processHighlightsSimple(todaysDetections);
  }
}

// Fetch historical detections with proper pagination
async function fetchHistoricalDetectionsWithPagination(stationIds: string[]): Promise<Detection[]> {
  const allDetections: Detection[] = [];
  let hasNextPage = true;
  let after: string | undefined;
  
  // Get historical data for the last 2 years (for better seasonal detection)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  const historicalPeriod = {
    from: twoYearsAgo.toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  };

  let pageCount = 0;
  const maxPages = 50; // Safety limit to prevent infinite loops
  
  while (hasNextPage && allDetections.length < 5000 && pageCount < maxPages) {
    try {
      pageCount++;
      
      const result = await gql<{ 
        detections: { 
          nodes: Detection[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string;
          };
        } 
      }>(
        `
          query historicalDetections($stationIds: [ID!], $period: InputDuration, $after: String) {
            detections(
              stationIds: $stationIds
              period: $period
              first: 100
              after: $after
              sortBy: "timestamp"
            ) {
              nodes {
                id
                timestamp
                confidence
                probability
                score
                species {
                  id
                  commonName
                  scientificName
                  thumbnailUrl
                  color
                }
                station {
                  id
                  name
                  location
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `,
        { stationIds, period: historicalPeriod, after }
      );
      
      allDetections.push(...result.detections.nodes);
      hasNextPage = result.detections.pageInfo.hasNextPage;
      after = result.detections.pageInfo.endCursor;
      
      // Add a small delay to be respectful to the API
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 150)); // Slightly longer delay for 2-year fetch
      }
    } catch (error) {
      console.error('Error fetching historical detections:', error);
      break;
    }
  }
  
  console.log(`Fetched ${allDetections.length} historical detections across ${pageCount} pages`);
  
  return allDetections;
}

// Simple fallback highlight processing
function processHighlightsSimple(detections: Detection[]): Detection[] {
  const speciesGroups = new Map<string, Detection[]>();
  detections.forEach(detection => {
    const speciesId = detection.species.id;
    if (!speciesGroups.has(speciesId)) {
      speciesGroups.set(speciesId, []);
    }
    speciesGroups.get(speciesId)!.push(detection);
  });

  const highlights: Detection[] = [];
  speciesGroups.forEach((speciesDetections) => {
    const sortedDetections = speciesDetections.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    highlights.push(sortedDetections[0]);
  });

  return highlights
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

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
