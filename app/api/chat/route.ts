import { NextRequest } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { openai, generateEmbedding, isOpenAIConfigured } from "@/lib/openai";
import type { ChatRequest, ChunkMatch } from "@/types";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() || !isOpenAIConfigured()) {
    return new Response(
      JSON.stringify({
        error: "Server not configured. Please set up environment variables.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const { message, documentId, conversationHistory } = body;

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const queryEmbedding = await generateEmbedding(message);

    const { data: chunks, error: matchError } = await supabaseAdmin.rpc(
      "match_chunks",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: 0.5,
        match_count: 5,
        filter_doc_id: documentId || null,
      }
    );

    if (matchError) throw matchError;

    const sources: ChunkMatch[] = (chunks ?? []).map(
      (c: { id: string; document_id: string; content: string; similarity: number }) => ({
        id: c.id,
        document_id: c.document_id,
        content: c.content,
        similarity: c.similarity,
      })
    );

    const contextText = sources.map((s, i) => `[${i + 1}] ${s.content}`).join("\n\n");

    const systemPrompt = `You are an intelligent document assistant. Answer questions based on the provided document context. If the context doesn't contain enough information to answer, say so clearly.

When referencing information from the context, cite your sources using [1], [2], etc. corresponding to the context chunk numbers.

Be concise, accurate, and helpful.

${
  contextText
    ? `## Document Context\n\n${contextText}`
    : "No relevant document context was found for this query. Let the user know and try to help based on general knowledge."
}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      stream: true,
      temperature: 0.3,
      max_tokens: 2048,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
        );

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", content })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Chat failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
