import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    // Parse the request to validate it's a proper GraphQL request
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          errors: [{ message: 'Invalid JSON in request body' }] 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate GraphQL request structure
    if (!parsedBody.query) {
      return new Response(
        JSON.stringify({ 
          errors: [{ message: 'Missing GraphQL query' }] 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // BirdWeather API is public - no authentication required

    // Log the request for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending GraphQL request:', parsedBody.query);
      console.log('Variables:', parsedBody.variables);
    }

    const res = await fetch('https://app.birdweather.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      // Disable Next.js cache for live data
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`BirdWeather API error: ${res.status} ${res.statusText}`);
      return new Response(
        JSON.stringify({ 
          errors: [{ message: `BirdWeather API error: ${res.statusText}` }] 
        }),
        { 
          status: res.status, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseBody = await res.text();
    
    // Log response for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('BirdWeather API response:', responseBody);
    }
    
    return new Response(responseBody, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ 
        errors: [{ message: 'Internal server error' }] 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
