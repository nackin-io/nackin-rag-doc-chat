export interface Document {
  id: string;
  name: string;
  size: number | null;
  status: "processing" | "ready" | "error";
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[];
  chunk_index: number;
  created_at: string;
}

export interface ChunkMatch {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChunkMatch[];
  timestamp: Date;
}

export interface UploadResponse {
  documentId: string;
  status: string;
}

export interface ChatRequest {
  message: string;
  documentId?: string | null;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}
