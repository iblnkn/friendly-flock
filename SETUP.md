# Bird Buddy - Environment Setup Guide

## 🚀 Quick Start

Your Bird Buddy dashboard is ready! Here's how to get it running with real BirdWeather data.

## 📋 Prerequisites

- Node.js 20+ (already configured)
- BirdWeather API access token

## 🔑 Environment Variables

Create a `.env.local` file in your project root:

```bash
# BirdWeather API Configuration
BIRDWEATHER_TOKEN=your_birdweather_api_token_here
NEXT_PUBLIC_BIRDWEATHER_TOKEN=your_birdweather_api_token_here
```

### Getting Your BirdWeather API Token

1. Visit [BirdWeather](https://app.birdweather.com)
2. Sign up for an account
3. Navigate to your account settings
4. Generate an API token
5. Copy the token to your `.env.local` file

## 🏃‍♂️ Running the Dashboard

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev

# Open your browser to http://localhost:3000
```

## 🎯 Features Ready

### ✅ Completed
- **Modern Design System**: Retro-lite, lab-clean aesthetic
- **My Stations Card**: Add/search stations with real API integration
- **Today's Highlights**: First-ever, first-of-season, unusual detections
- **GraphQL Integration**: Full BirdWeather API schema support
- **Responsive Layout**: Works on desktop, tablet, and mobile

### 🚧 In Progress
- **Today's Species**: Species counts and time windows
- **Now Playing**: Live detection ticker via WebSocket
- **Patterns**: Time-of-day activity sparklines

## 🔧 API Integration

The dashboard uses the official BirdWeather GraphQL API:

- **Endpoint**: `https://app.birdweather.com/graphql`
- **WebSocket**: `wss://app.birdweather.com/graphql`
- **Authentication**: Bearer token in Authorization header

### Key Queries Implemented

- `stationInfo` - Get station details
- `searchStations` - Find stations by name/location
- `todayDetections` - Get today's bird detections
- `topSpecies` - Most detected species
- `timeOfDayDetectionCounts` - Hourly activity patterns
- `newDetection` - Live detection subscription

## 🎨 Design System

The dashboard uses a custom "retro-lite, lab-clean" design system:

- **Modern First**: Clean cards, readable typography
- **Nostalgia as Garnish**: Subtle Win95 bevels on special cards
- **Accessible**: AA/AAA contrast compliance
- **Motion Safe**: Respects `prefers-reduced-motion`

### Key Components

- `WindowCard` - Base card component with optional accent
- `species` - Species detection rows
- `badge` - Event badges (First-ever, etc.)
- `sparkline` - Activity pattern charts

## 🐦 Using the Dashboard

1. **Add Stations**: Enter Station IDs or search by name
2. **View Highlights**: See special detections (first-ever, unusual)
3. **Track Species**: Monitor daily species counts
4. **Live Updates**: Watch real-time detections
5. **Analyze Patterns**: View hourly activity trends

## 🔍 Troubleshooting

### Common Issues

**API Token Not Working**
- Verify token is correct in `.env.local`
- Check BirdWeather account status
- Ensure token has proper permissions

**No Data Showing**
- Add stations first in "My Stations" card
- Check network tab for API errors
- Verify station IDs are valid

**Build Errors**
- Ensure Node.js 20+ is installed
- Run `npm install` to update dependencies
- Check TypeScript errors in console

### Getting Help

- Check the browser console for errors
- Verify API token permissions
- Test API endpoints directly in GraphQL playground

## 🚀 Deployment

Ready to deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## 📊 Data Flow

```
BirdWeather API → GraphQL Proxy → urql Client → React Components → UI
```

The dashboard fetches data through a secure server-side proxy to keep API tokens safe.

---

**Happy Bird Watching! 🐦✨**
