import { NextRequest } from 'next/server';
import { supabase } from './supabase';
import { Agent } from './types';

export async function verifyApiKey(req: NextRequest): Promise<Agent | null> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.slice(7);

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Agent;
}

export function unauthorized() {
  return Response.json(
    { error: 'Unauthorized - Invalid or missing API key' },
    { status: 401 }
  );
}
