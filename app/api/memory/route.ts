import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { verifyApiKey, unauthorized } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { MemorySchema } from '@/lib/types';

export async function POST(req: NextRequest) {
  // Verify API key
  const agent = await verifyApiKey(req);
  if (!agent) {
    return unauthorized();
  }

  try {
    // Parse and validate body
    const body = await req.json();
    const parsed = MemorySchema.safeParse(body);
    
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { content, embedding, metadata } = parsed.data;

    // Store memory
    const { data, error } = await supabase
      .from('memories')
      .insert({
        id: nanoid(),
        agent_id: agent.id,
        content,
        metadata: metadata || {},
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to store memory' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      memory: {
        id: data.id,
        content: data.content,
        metadata: data.metadata,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error('Error storing memory:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
