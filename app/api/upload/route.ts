import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { isOpenAIConfigured } from "@/lib/openai";
import { processPDF } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() || !isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "Server not configured. Please set up environment variables." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from("documents")
      .insert({ name: file.name, size: file.size, status: "processing" })
      .select()
      .single();

    if (docError) throw docError;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storagePath = `${doc.id}/${file.name}`;
    const { error: storageError } = await supabaseAdmin.storage
      .from("pdfs")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
    }

    processPDF(buffer, doc.id).catch((err) => {
      console.error("Background PDF processing failed:", err);
    });

    return NextResponse.json({
      documentId: doc.id,
      status: "processing",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
