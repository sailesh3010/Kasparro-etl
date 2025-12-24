// src/schemas/record.ts
import { z } from "zod";

export const RecordSchema = z.object({
  source: z.string(),
  source_id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  published_at: z.string().optional(), // ISO 8601 string
  metadata: z.record(z.any()).optional(),
});

export type RecordInput = z.infer<typeof RecordSchema>;

export function normalize(input: any): RecordInput {
  // Normalize heterogeneous inputs into a canonical, DB-safe shape
  const out = {
    source: input.source,
    source_id: String(
      input.source_id ?? input.id ?? input.guid ?? input.link ?? "unknown"
    ),
    title: input.title ?? input.headline ?? input.name ?? null,
    description: input.description ?? input.summary ?? input.content ?? null,

    // ✅ FIX: always convert Date → ISO string
    published_at:
      input.published_at instanceof Date
        ? input.published_at.toISOString()
        : input.published_at ?? input.pubDate ?? input.date ?? null,

    metadata: input.metadata ?? {},
  };

  return RecordSchema.parse(out);
}
