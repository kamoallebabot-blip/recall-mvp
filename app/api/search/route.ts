import { NextRequest } from 'next/server';
import { verifyApiKey, unauthorized } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getEmbedding } from '@/lib/openai';
import { SearchQuerySchema } from '@/lib/types';

export async function GET(req: NextRequest) {
  // Verify API key
  const agent = await verifyApiKey(req);
  if (!agent) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate
    const parsed = SearchQuerySchema.safeParse({ query, limit });
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Generate query embedding
    const queryEmbedding = await getEmbedding(parsed.data.query);

    // Semantic search using pgvector
    const { data, error } = await supabase.rpc('search_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
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
