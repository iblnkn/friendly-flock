// Simple GraphQL client wrapper for server-side and client-side usage

export async function gql<T>(query: string, variables?: Record<string, any>) {
  const res = await fetch('/api/birdweather', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  
  if (!res.ok) {
    throw new Error(`GraphQL error: ${res.statusText}`);
  }
  
  const json = await res.json();
  
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? 'GraphQL error');
  }
  
  return json.data as T;
}

// Helper to get today's date range
export function getTodayRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

// Helper to format time
export function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Helper to get time window
export function getTimeWindow(timestamps: string[]) {
  if (timestamps.length === 0) return '';
  if (timestamps.length === 1) return formatTime(timestamps[0]);
  
  const times = timestamps.map(t => new Date(t).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return `${formatTime(new Date(min).toISOString())}–${formatTime(new Date(max).toISOString())}`;
}
