export {
  normalizeChunkText,
  scoreChunkRelevance,
  rankKnowledgeChunks,
  type RagChunkInput,
} from "./rag";
export { splitTextIntoChunks } from "./ingest";
export {
  DEFAULT_BGE_QUERY_PREFIX,
  embedDocumentTexts,
  embedQueryText,
  embedTextsHuggingFace,
  hfFeatureExtractionToVector,
  l2Normalize,
} from "./embeddings";
export {
  retrieveHospitalKnowledgeSemantic,
  retrieveHospitalKnowledgeWithFallback,
  retrievePatientEducationSemantic,
  type RetrievePatientEducationOptions,
} from "./semantic-rag";
export {
  completeHospitalRagChat,
  completePatientEducationRagChat,
  isRagLlmConfigured,
  type RagContextChunk,
  type RagLlmResult,
} from "./rag-llm";
export { getLlmConfig, isLlmConfigured } from "./llm-config";
export {
  DRUG_INTERACTION_TOOL,
  featherlessChatCompletions,
  HOSPITAL_KB_TOOL,
  PATIENT_CHART_TOOL,
  PATIENT_KB_TOOL,
  type FeatherlessChatMessage,
  type FeatherlessChatCompletionsResponse,
  type FeatherlessToolCall,
} from "./featherless-chat";
export { runDoctorKbAssistantChat, runKbAssistantChat, type DoctorKbChatContext } from "./kb-chat-agent";
export { PATIENT_EDUCATION_DOCUMENTS } from "./patient-education";
export { seedPatientEducationKnowledge } from "./seed-patient-education";
export { createIcd10Client, type Icd10SearchResult } from "./icd10-client";
export { createPubMedClient, type PubMedSearchResponse, type PubMedSummaryResponse } from "./pubmed-client";
export { createDrugBankClient } from "./drugbank-client";
