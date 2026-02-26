import { PDFParse } from "pdf-parse";
import { generateEmbedding } from "./openai";
import { supabaseAdmin } from "./supabase";
import { recursiveCharacterSplit } from "./text-splitter";

export async function processPDF(
  fileBuffer: Buffer,
  documentId: string
): Promise<void> {
  try {
    await supabaseAdmin
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    const text = result.text;

    if (!text || text.trim().length === 0) {
      throw new Error("No text content found in PDF");
    }

    const chunks = recursiveCharacterSplit(text, {
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const embeddingsPromises = batch.map((chunk) =>
        generateEmbedding(chunk)
      );
      const embeddings = await Promise.all(embeddingsPromises);

      const rows = batch.map((content, j) => ({
        document_id: documentId,
        content,
        embedding: JSON.stringify(embeddings[j]),
        chunk_index: i + j,
      }));

      const { error } = await supabaseAdmin
        .from("document_chunks")
        .insert(rows);

      if (error) throw error;
    }

    await supabaseAdmin
      .from("documents")
      .update({ status: "ready" })
      .eq("id", documentId);
  } catch (error) {
    console.error("PDF processing error:", error);
    await supabaseAdmin
      .from("documents")
      .update({ status: "error" })
      .eq("id", documentId);
    throw error;
  }
}
