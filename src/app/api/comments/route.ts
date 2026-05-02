import { NextResponse } from "next/server";
import { COLUMN_KEYS } from "@/lib/brainstorm-columns";
import type { ColumnKey } from "@/lib/brainstorm-columns";
import {
  fetchAllComments,
  insertComment,
  isDatabaseConfigured,
} from "@/lib/comments-db";
import {
  BRAINSTORM_RLS_HINT,
  BRAINSTORM_TABLE_SETUP_HINT,
  isPostgrestMissingRelation,
  isRowLevelSecurityViolation,
} from "@/lib/supabase-errors";

const MAX_NAME = 80;
const MAX_BODY = 2000;

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: "missing_database",
        message:
          "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY so comments sync for your team.",
      },
      { status: 503 },
    );
  }

  try {
    const comments = await fetchAllComments();
    return NextResponse.json({ comments });
  } catch (e) {
    console.error(e);
    if (isPostgrestMissingRelation(e)) {
      return NextResponse.json(
        {
          error: "missing_table",
          message: BRAINSTORM_TABLE_SETUP_HINT,
        },
        { status: 503 },
      );
    }
    if (isRowLevelSecurityViolation(e)) {
      return NextResponse.json(
        { error: "rls_denied", message: BRAINSTORM_RLS_HINT },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "fetch_failed", message: "Could not load comments." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: "missing_database",
        message:
          "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before posting comments.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { columnKey?: unknown }).columnKey !== "string" ||
    typeof (body as { authorName?: unknown }).authorName !== "string" ||
    typeof (body as { body?: unknown }).body !== "string"
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const columnKey = (body as { columnKey: string }).columnKey;
  const authorName = (body as { authorName: string }).authorName.trim();
  const text = (body as { body: string }).body.trim();

  if (!COLUMN_KEYS.has(columnKey)) {
    return NextResponse.json({ error: "unknown_column" }, { status: 400 });
  }

  if (!authorName || authorName.length > MAX_NAME) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  if (!text || text.length > MAX_BODY) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const comment = await insertComment({
      columnKey: columnKey as ColumnKey,
      authorName,
      body: text,
    });
    return NextResponse.json({ comment });
  } catch (e) {
    console.error(e);
    if (isPostgrestMissingRelation(e)) {
      return NextResponse.json(
        {
          error: "missing_table",
          message: BRAINSTORM_TABLE_SETUP_HINT,
        },
        { status: 503 },
      );
    }
    if (isRowLevelSecurityViolation(e)) {
      return NextResponse.json(
        { error: "rls_denied", message: BRAINSTORM_RLS_HINT },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "insert_failed", message: "Could not save comment." },
      { status: 500 },
    );
  }
}
