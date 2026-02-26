import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;

    const { data: doc } = await supabaseAdmin
      .from("documents")
      .select("name")
      .eq("id", id)
      .single();

    if (doc) {
      await supabaseAdmin.storage.from("pdfs").remove([`${id}/${doc.name}`]);
    }

    const { error } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
