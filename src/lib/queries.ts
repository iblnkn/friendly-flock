// GraphQL queries for BirdWeather API
// https://app.birdweather.com/graphql

// Get detections for a specific station
export const STATION_DETECTIONS = `
  query stationDetections($stationId: ID!, $period: InputDuration) {
    station(id: $stationId) {
      id
      name
      location
      country
      state
      coords {
        lat
        lon
      }
      type
      latestDetectionAt
      earliestDetectionAt
      detections(period: $period, first: 50) {
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
        }
        totalCount
        speciesCount
      }
      counts(period: $period) {
        detections
        species
      }
    }
  }
`;

// Get today's detections for multiple stations
export const TODAY_DETECTIONS = `
  query todayDetections($stationIds: [ID!], $period: InputDuration) {
    detections(
      stationIds: $stationIds
      period: $period
      first: 500
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
      totalCount
      speciesCount
    }
  }
`;

// Get top species for a time period
export const TOP_SPECIES = `
  query topSpecies($stationIds: [ID!], $period: InputDuration, $limit: Int) {
    topSpecies(
      stationIds: $stationIds
      period: $period
      limit: $limit
    ) {
      count
      averageProbability
      species {
        id
        commonName
        scientificName
        thumbnailUrl
        color
      }
      speciesId
    }
  }
`;

// Get time-of-day detection counts for patterns
export const TIME_OF_DAY_COUNTS = `
  query timeOfDayDetectionCounts($stationIds: [ID!], $period: InputDuration) {
    timeOfDayDetectionCounts(
      stationIds: $stationIds
      period: $period
    ) {
      species {
        id
        commonName
        scientificName
        thumbnailUrl
        color
      }
      speciesId
      count
      bins {
        count
        key
      }
    }
  }
`;

// Get station information
export const STATION_INFO = `
  query stationInfo($id: ID!) {
    station(id: $id) {
      id
      name
      location
      country
      state
      coords {
        lat
        lon
      }
      type
      latestDetectionAt
      earliestDetectionAt
      timezone
      weather {
        temp
        description
        humidity
        windSpeed
        pressure
        visibility
        cloudiness
        feelsLike
        windDir
        windGust
        rain1h
        rain3h
        snow1h
        snow3h
        sunrise
        sunset
        tempMax
        tempMin
        timestamp
        coords {
          lat
          lon
        }
        groundLevel
        seaLevel
      }
      counts {
        detections
        species
      }
    }
  }
`;

// Search for stations
export const SEARCH_STATIONS = `
  query searchStations($query: String, $first: Int) {
    stations(query: $query, first: $first) {
      nodes {
        id
        name
        location
        country
        state
        coords {
          lat
          lon
        }
        type
        latestDetectionAt
        counts {
          detections
          species
        }
      }
      totalCount
    }
  }
`;

// Live detection subscription
export const NEW_DETECTION_SUBSCRIPTION = `
  subscription newDetection($stationIds: [ID!]) {
    newDetection(stationIds: $stationIds) {
      detection {
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
    }
  }
`;

// Get counts for overview
export const COUNTS = `
  query counts($stationIds: [ID!], $period: InputDuration) {
    counts(stationIds: $stationIds, period: $period) {
      detections
      species
      stations
      birdnet
    }
  }
`;

// Get daily detection counts for weekly patterns
export const DAILY_DETECTION_COUNTS = `
  query dailyDetectionCounts($stationIds: [ID!], $period: InputDuration) {
    dailyDetectionCounts(stationIds: $stationIds, period: $period) {
      date
      total
      counts {
        count
        species {
          id
          commonName
          scientificName
          thumbnailUrl
          color
        }
        speciesId
      }
    }
  }
`;