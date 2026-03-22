-- pgvector column for semantic KB search (default HF model BAAI/bge-large-en-v1.5 = 1024 dims)
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "embeddingVector" vector(1024);
