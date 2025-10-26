# Friendly Flock - Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# BirdWeather API Token (required)
BIRDWEATHER_TOKEN=your_birdweather_api_token_here

# Optional: Public token for WebSocket subscriptions (if different from server token)
NEXT_PUBLIC_BIRDWEATHER_TOKEN=your_public_token_here
```

## Getting Your BirdWeather API Token

1. Visit [BirdWeather](https://app.birdweather.com/)
2. Sign up or log in to your account
3. Go to your account settings or API section
4. Generate an API token
5. Copy the token and add it to your `.env.local` file

## Testing the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser (usually `http://localhost:3000`)

3. Add a station by:
   - Entering a Station ID directly (if you know one)
   - Searching for stations by name or location
   - The app will show mock data until you add real stations

## Features Now Working

✅ **My Stations Card**: Add/remove stations, search functionality, station statistics
✅ **Highlights Card**: Shows first-ever, first-of-season, and unusual detections
✅ **Today's Species Card**: Displays species detected today with counts and time windows
✅ **Patterns Card**: Shows hourly activity patterns with sparkline charts
✅ **Now Playing Card**: Real-time detection subscription (when stations are added)

## Troubleshooting

- **API Errors**: Check that your `BIRDWEATHER_TOKEN` is valid and has proper permissions
- **No Data**: Make sure you've added stations that have recent detection data
- **WebSocket Issues**: Verify your `NEXT_PUBLIC_BIRDWEATHER_TOKEN` if using subscriptions
- **Station Not Found**: Try searching by location or partial station names

## Mock Data

When no stations are configured, the app shows mock data to demonstrate the interface. Once you add real stations, all components will switch to live data from the BirdWeather API.
