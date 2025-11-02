# 🐦 Friendly Flock - BirdWeather Dashboard

A modern, responsive BirdWeather dashboard with nostalgic Win95 vibes. Built with Next.js, Tailwind CSS, and GraphQL.

## Features

- **My Stations**: Add and manage your BirdWeather station IDs
- **Today's Highlights**: Notable detections based on confidence and rarity
- **Today's Species**: Unique species list with counts and time windows
- **Now Playing**: Live ticker showing recent detections via WebSocket
- **Patterns**: Activity sparklines and weekly detection patterns

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **98.css** for Win95 window styling
- **urql** for GraphQL client
- **graphql-ws** for WebSocket subscriptions
- **Vercel** for deployment

## Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd bird-buddy
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

> **Note**: The BirdWeather API is public and requires no authentication or API tokens. The dashboard works out of the box!

## Usage

1. **Add Stations**: Enter BirdWeather station IDs in the "My Stations" card
2. **View Data**: The dashboard will automatically fetch and display:
   - Today's bird detections
   - Highlighted special detections
   - Live detection feed
   - Activity patterns

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Project Settings
   - Deploy!

## API Integration

The app uses a GraphQL proxy at `/api/birdweather` that:
- Handles CORS issues
- Provides rate limiting (10 calls/minute with caching)
- Supports both queries and subscriptions
- Uses caching to minimize API calls (5-minute cache for today's data)

> **Rate Limiting**: The app implements conservative rate limiting to prevent API overload. Today's detections are cached for 5 minutes, and highlights refresh every 5 minutes.

## GraphQL Queries

The app includes pre-built queries for:
- `TODAY_DETECTIONS`: Get today's detections for a station
- `EVER`: Check if a species has ever been detected
- `STATION_PROBS`: Get station probability data
- `TIME_OF_DAY`: Get hourly detection patterns
- `LIVE`: Subscribe to new detections
- `WEEKLY_TOP_SPECIES`: Get top species for the week

## Styling

The app uses a combination of:
- **Tailwind CSS** for responsive layout and utilities
- **98.css** for authentic Win95 window styling
- **Custom CSS** for Win95-specific overrides

## Development

- **Build**: `npm run build`
- **Start**: `npm start`
- **Lint**: `npm run lint`
- **Dev**: `npm run dev`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own BirdWeather dashboard!

---

Built with ❤️ for bird enthusiasts everywhere.