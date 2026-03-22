import { prisma, setKnowledgeChunkEmbeddingVector } from "@mediconnect/db";

import { embedDocumentTexts } from "./embeddings";
import { splitTextIntoChunks } from "./ingest";
import { PATIENT_EDUCATION_DOCUMENTS } from "./patient-education";

/**
 * Inserts patient-education chunks with embeddings. Removes prior rows with metadata.kind = patient_education.
 */
export async function seedPatientEducationKnowledge(): Promise<{ documents: number; chunks: number }> {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "KnowledgeChunk" WHERE metadata->>'kind' = 'patient_education'`,
  );

  let totalChunks = 0;
  for (const doc of PATIENT_EDUCATION_DOCUMENTS) {
    const parts = splitTextIntoChunks(doc.body);
    if (parts.length === 0) continue;

    const embeddings = await embedDocumentTexts(parts);
    const chunkCount = parts.length;

    const rows = await prisma.$transaction(
      parts.map((chunk, i) =>
        prisma.knowledgeChunk.create({
          data: {
            source: `${doc.title} · ${doc.source} · part ${i + 1}/${chunkCount}`,
            content: chunk,
            metadata: {
              kind: "patient_education",
              audience: doc.audience,
              title: doc.title,
              source: doc.source,
              language: doc.language,
              reading_level: doc.reading_level,
              url: doc.url,
              chunkIndex: i,
              chunkCount,
            },
          },
        }),
      ),
    );

    for (let i = 0; i < rows.length; i++) {
      await setKnowledgeChunkEmbeddingVector(prisma, rows[i]!.id, embeddings[i]!);
    }
    totalChunks += rows.length;
  }

  return { documents: PATIENT_EDUCATION_DOCUMENTS.length, chunks: totalChunks };
}
