import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Generate API key
    const apiKey = `recall_${nanoid(32)}`;

    // Create agent
    const { data, error } = await supabase
      .from('agents')
      .insert({
        id: nanoid(),
        api_key: apiKey,
        name: parsed.data.name,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return Response.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      agent: {
        id: data.id,
        name: data.name,
        api_key: apiKey,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error('Error registering agent:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
