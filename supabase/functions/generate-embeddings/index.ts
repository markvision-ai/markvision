import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.72.0';

// Initialize OpenAI and Supabase clients
const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY')
});

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// TypeScript interfaces
interface DocumentInput {
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
}

interface EmbeddingRequest {
    agent_id: string;
    documents: DocumentInput[];
}

interface EmbeddingResponse {
    success: boolean;
    count: number;
    embeddings?: number[][];
    error?: string;
}

// Split text into chunks
function splitIntoChunks(text: string, chunkSize: number): string[] {
    if (!text || text.length === 0) return [];

    const chunks: string[] = [];

    // Split by paragraphs first (for better semantics)
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If paragraph itself is too long, split it
        if (paragraph.length > chunkSize) {
            // Save current chunk if it exists
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            // Split long paragraph by sentences
            const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
            let senChunk = '';

            for (const sentence of sentences) {
                if ((senChunk + sentence).length > chunkSize) {
                    if (senChunk) chunks.push(senChunk.trim());
                    senChunk = sentence;
                } else {
                    senChunk += sentence;
                }
            }

            if (senChunk) {
                chunks.push(senChunk.trim());
            }
        } else {
            // Add paragraph to current chunk
            if ((currentChunk + paragraph).length > chunkSize) {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = paragraph;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }
    }

    // Add remaining chunk
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    // Filter out empty chunks
    return chunks.filter(chunk => chunk.length > 0);
}

// Main handler
serve(async (req: Request): Promise<Response> => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const { agent_id, documents }: EmbeddingRequest = await req.json();

        // Validate input
        if (!agent_id || !documents || !Array.isArray(documents)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Missing required fields: agent_id, documents array'
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Process documents: split into chunks and generate embeddings
        const chunks: Array<{
            agent_id: string;
            content: string;
            chunk_index: number;
            embedding: number[];
            metadata: Record<string, unknown>;
        }> = [];

        const embeddingRequestsSet = new Set<string>();

        // First, create all chunks
        for (const doc of documents) {
            if (!doc.content || typeof doc.content !== 'string') {
                console.warn(`Skipping document ${doc.id}: invalid content`);
                continue;
            }

            const docChunks = splitIntoChunks(doc.content, 1000);

            for (let i = 0; i < docChunks.length; i++) {
                chunks.push({
                    agent_id,
                    content: docChunks[i],
                    chunk_index: i,
                    embedding: [], // Placeholder
                    metadata: {
                        ...doc.metadata,
                        source_doc_id: doc.id,
                        source_doc_chunk: i
                    }
                });
                embeddingRequestsSet.add(docChunks[i]);
            }
        }

        if (chunks.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'No valid documents to process'
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Processing ${chunks.length} chunks from ${documents.length} documents`);

        // Generate embeddings using OpenAI API
        // Batch unique contents to avoid duplicate API calls
        const uniqueContents = Array.from(embeddingRequestsSet);
        console.log(`Generating embeddings for ${uniqueContents.length} unique chunks`);

        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: uniqueContents,
            encoding_format: 'float'
        });

        // Map embeddings back to chunks
        const contentToEmbedding = new Map<string, number[]>();
        for (let i = 0; i < embeddingResponse.data.length; i++) {
            contentToEmbedding.set(uniqueContents[i], embeddingResponse.data[i].embedding as number[]);
        }

        // Assign embeddings to chunks
        for (const chunk of chunks) {
            const embedding = contentToEmbedding.get(chunk.content);
            if (embedding) {
                chunk.embedding = embedding;
            }
        }

        console.log(`Generated ${chunks.length} embeddings`);

        // Insert chunks into database
        const { data: insertResult, error: insertError } = await supabase
            .from('agent_knowledge_docs')
            .insert(
                chunks.map(chunk => ({
                    agent_id: chunk.agent_id,
                    content: chunk.content,
                    chunk_index: chunk.chunk_index,
                    embedding: chunk.embedding,
                    metadata: chunk.metadata
                }))
            )
            .select('id');

        if (insertError) {
            console.error('Database insertion error:', insertError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Failed to store embeddings: ${insertError.message}`
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log(`✅ Successfully indexed ${chunks.length} document chunks for agent ${agent_id}`);

        const response: EmbeddingResponse = {
            success: true,
            count: chunks.length,
            embeddings: chunks.map(c => c.embedding)
        };

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Unexpected error in generate-embeddings:', error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
                count: 0
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
});

/* To deploy this function:

1. Ensure OpenAI API key is set in Supabase Edge Functions secrets:
   supabase secrets set OPENAI_API_KEY=sk-xxx

2. Deploy using:
   supabase functions deploy generate-embeddings

3. Test locally:
   supabase functions serve generate-embeddings --env-file .env.local

4. Call from client:
   const { data } = await supabase.functions.invoke('generate-embeddings', {
       body: {
           agent_id: 'agent-uuid',
           documents: [
               { id: 'doc1', content: 'Your text here', metadata: {} }
           ]
       }
   })
*/
