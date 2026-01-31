import { NextRequest } from 'next/server';
import { verifyApiKey, unauthorized } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // Verify API key
  const agent = await verifyApiKey(req);
  if (!agent) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const { data, error } = await supabase
      .from('memories')
      .select('id, content, metadata, created_at')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching memories:', error);
      return Response.json(
        { error: 'Failed to fetch memories' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      memories: data,
    });
  } catch (error) {
    console.error('Error listing memories:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
