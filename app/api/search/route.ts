import { NextRequest } from 'next/server';
import { verifyApiKey, unauthorized } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { SearchQuerySchema } from '@/lib/types';

export async function POST(req: NextRequest) {
  // Verify API key
  const agent = await verifyApiKey(req);
  if (!agent) {
    return unauthorized();
  }

  try {
    // Parse body
    const body = await req.json();
    const parsed = SearchQuerySchema.safeParse(body);
    
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const queryEmbedding = parsed.data.embedding;

    // Semantic search using pgvector
    const { data, error } = await supabase.rpc('search_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // Lower threshold for broader matches
      match_count: parsed.data.limit,
      target_agent_id: agent.id,
    });

    if (error) {
      console.error('Search error:', error);
      return Response.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      results: data.map((item: any) => ({
        id: item.id,
        content: item.content,
        metadata: item.metadata,
        similarity: item.similarity,
        created_at: item.created_at,
      })),
    });
  } catch (error) {
    console.error('Error searching memories:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
