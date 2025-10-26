'use client';
import { Provider, createClient, subscriptionExchange, fetchExchange, cacheExchange } from 'urql';
import { createClient as createWsClient } from 'graphql-ws';
import { StationProvider } from '@/lib/StationContext';

const wsClient = typeof window !== 'undefined'
  ? createWsClient({ 
      url: 'wss://app.birdweather.com/graphql',
      // BirdWeather WebSocket is public - no authentication required
    })
  : null;

const client = createClient({
  url: '/api/birdweather', // our proxy for queries/mutations
  exchanges: [
    cacheExchange,
    fetchExchange,
    ...(wsClient ? [subscriptionExchange({
      forwardSubscription(request) {
        return {
          subscribe: sink => ({
            unsubscribe: wsClient.subscribe({
              query: request.query || '',
              variables: request.variables,
              operationName: request.operationName,
            }, sink),
          }),
        };
      },
    })] : []),
  ],
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider value={client}>
      <StationProvider>
        {children}
      </StationProvider>
    </Provider>
  );
}
