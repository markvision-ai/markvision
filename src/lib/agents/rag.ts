import { supabase } from '@/integrations/supabase/client';

/**
 * Represents a document retrieved from the knowledge base
 */
export interface RAGDocument {
    id: string;
    content: string;
    similarity: number;
    metadata?: Record<string, any>;
}

/**
 * Configuration for RAG search behavior
 */
export interface RAGSearchOptions {
    threshold?: number;  // Similarity threshold (0.0 - 1.0)
    limit?: number;      // Maximum number of results
}

/**
 * Default RAG settings for agent knowledge base
 */
export const DEFAULT_RAG_SETTINGS = {
    similarity_threshold: 0.7,
    max_results: 5,
    chunk_size: 1000
} as const;

/**
 * Generate embeddings for documents using Supabase Edge Function
 *
 * @param agentId - ID of the agent to index documents for
 * @param documents - Array of documents with id, content, and optional metadata
 * @returns Response data from embedding function
 */
export async function indexAgentDocuments(
    agentId: string,
    documents: Array<{
        id: string;
        content: string;
        metadata?: Record<string, any>;
    }>
) {
    try {
        const { data, error } = await supabase.functions.invoke('generate-embeddings', {
            body: {
                agent_id: agentId,
                documents
            }
        });

        if (error) {
            console.error('Error indexing documents:', error);
            throw new Error(`Failed to index documents: ${error.message}`);
        }

        console.log(`✅ Indexed ${data.count} documents for agent ${agentId}`);
        return data;

    } catch (error) {
        console.error('Document indexing failed:', error);
        throw error;
    }
}

/**
 * Semantic search over agent's knowledge base using pgvector
 *
 * @param agentId - ID of the agent to search in
 * @param query - Query text to search for
 * @param options - Search options (threshold, limit)
 * @returns Array of relevant documents with similarity scores
 */
export async function searchAgentKnowledge(
    agentId: string,
    query: string,
    options: RAGSearchOptions = {}
): Promise<RAGDocument[]> {
    const {
        threshold = DEFAULT_RAG_SETTINGS.similarity_threshold,
        limit = DEFAULT_RAG_SETTINGS.max_results
    } = options;

    try {
        // Step 1: Generate embedding for the query
        const { data: embeddingData, error: embError } = await supabase.functions.invoke(
            'generate-embeddings',
            {
                body: {
                    agent_id: agentId,
                    documents: [{
                        id: 'query',
                        content: query,
                        metadata: { type: 'query' }
                    }]
                }
            }
        );

        if (embError) {
            console.error('Error generating query embedding:', embError);
            // Fallback: return empty array instead of throwing
            return [];
        }

        if (!embeddingData?.embeddings?.[0]) {
            console.warn('No embedding returned for query');
            return [];
        }

        const queryEmbedding = embeddingData.embeddings[0];

        // Step 2: Search using pgvector similarity
        const { data, error } = await supabase.rpc('match_agent_documents', {
            query_embedding: queryEmbedding,
            p_agent_id: agentId,
            match_threshold: threshold,
            match_count: limit
        });

        if (error) {
            console.error('RPC error during semantic search:', error);
            return [];
        }

        return (data || []) as RAGDocument[];

    } catch (error) {
        console.error('Semantic search failed:', error);
        // Graceful fallback
        return [];
    }
}

/**
 * Build an augmented system prompt with RAG context
 * Includes relevant documents and their similarity scores
 *
 * @param basePrompt - Original system prompt
 * @param relevantDocs - Documents retrieved from knowledge base
 * @returns Enhanced prompt with context
 */
export function buildRAGPrompt(
    basePrompt: string,
    relevantDocs: RAGDocument[]
): string {
    if (!relevantDocs || relevantDocs.length === 0) {
        return basePrompt;
    }

    // Format documents with similarity scores for transparency
    const contextItems = relevantDocs
        .map((doc, index) => {
            const similarity = Math.round(doc.similarity * 100);
            return `[Документ ${index + 1}] (релевантность: ${similarity}%)\n${doc.content}`;
        })
        .join('\n\n');

    // Build augmented prompt with clear separation
    const augmentedPrompt = `${basePrompt}

==========================================
📚 БАЗА ЗНАНИЙ (Контекст из документов)
==========================================

Используй следующие документы для ответа на вопросы пользователя:

${contextItems}

Правила использования контекста:
- Если ответ содержится в документах - используй эту информацию
- Всегда указывай источник информации из документов
- Если информации нет в документах - честно скажи об этом
- Не выдумывай информацию, которой нет в контексте

==========================================`;

    return augmentedPrompt;
}

/**
 * Delete all documents for an agent
 * Useful for re-indexing or cleanup
 *
 * @param agentId - ID of the agent
 * @returns Number of deleted documents
 */
export async function deleteAgentDocuments(agentId: string): Promise<number> {
    try {
        const { data, error, count } = await supabase
            .from('agent_knowledge_docs')
            .delete()
            .eq('agent_id', agentId);

        if (error) {
            throw new Error(`Failed to delete documents: ${error.message}`);
        }

        console.log(`✅ Deleted ${count} documents for agent ${agentId}`);
        return count || 0;

    } catch (error) {
        console.error('Failed to delete agent documents:', error);
        throw error;
    }
}

/**
 * Get document count for an agent
 *
 * @param agentId - ID of the agent
 * @returns Number of documents in knowledge base
 */
export async function getAgentDocumentCount(agentId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('agent_knowledge_docs')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agentId);

        if (error) {
            throw error;
        }

        return count || 0;

    } catch (error) {
        console.error('Failed to get document count:', error);
        return 0;
    }
}

/**
 * Check if agent has any knowledge documents indexed
 *
 * @param agentId - ID of the agent
 * @returns True if agent has documents
 */
export async function hasAgentKnowledge(agentId: string): Promise<boolean> {
    const count = await getAgentDocumentCount(agentId);
    return count > 0;
}
