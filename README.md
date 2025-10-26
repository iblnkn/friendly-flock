# 🐦 Bird Buddy - BirdWeather Dashboard

A modern, responsive BirdWeather dashboard with nostalgic Win95 vibes. Built with Next.js, Tailwind CSS, and GraphQL.

## Features

- **My Stations**: Add and manage your BirdWeather station IDs
- **Today's Highlights**: First-ever, first-of-season, and unusual detections
- **Today's Species**: Unique species list with counts and time windows
- **Now Playing**: Live ticker showing recent detections
- **Patterns**: Activity sparklines and top species for the week

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

2. **Set up environment variables**:
   Create `.env.local` in the root directory:
   ```env
   BIRDWEATHER_ENDPOINT=https://app.birdweather.com/graphql
   BIRDWEATHER_TOKEN=YOUR_SECRET_TOKEN
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

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

### Environment Variables for Production

Add these in your Vercel project settings:
- `BIRDWEATHER_ENDPOINT`: `https://app.birdweather.com/graphql`
- `BIRDWEATHER_TOKEN`: Your BirdWeather API token

## API Integration

The app uses a secure GraphQL proxy at `/api/birdweather` that:
- Keeps your API token server-side
- Handles CORS issues
- Provides rate limiting
- Supports both queries and subscriptions

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