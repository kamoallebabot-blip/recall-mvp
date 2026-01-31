import { z } from 'zod';

export const MemorySchema = z.object({
  content: z.string().min(1).max(10000),
  metadata: z.record(z.any()).optional(),
});

export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(100).optional().default(10),
});

export type Memory = {
  id: string;
  agent_id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding: number[];
  created_at: string;
};

export type Agent = {
  id: string;
  api_key: string;
  name?: string;
  created_at: string;
};
