import { emptyRecordPerColumn, type ColumnKey } from "./brainstorm-columns";
import type { CommentRecord } from "./comment-types";
import { getSupabaseAdmin } from "./supabase-server";

type DbRow = {
  id: number | string;
  column_key: string;
  author_name: string;
  body: string;
  created_at: string;
};

function rowToComment(row: DbRow): CommentRecord {
  const key = row.column_key as ColumnKey;
  return {
    id: String(row.id),
    columnKey: key,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function fetchAllComments(): Promise<
  Record<ColumnKey, CommentRecord[]>
> {
  const supabase = getSupabaseAdmin();
  const grouped: Record<ColumnKey, CommentRecord[]> = emptyRecordPerColumn(
    () => [],
  );

  if (!supabase) return grouped;

  const { data, error } = await supabase
    .from("brainstorm_comments")
    .select("id, column_key, author_name, body, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data) return grouped;

  for (const raw of data as DbRow[]) {
    const key = raw.column_key as ColumnKey;
    if (!grouped[key]) continue;
    grouped[key].push(rowToComment(raw));
  }

  return grouped;
}

export async function insertComment(input: {
  columnKey: ColumnKey;
  authorName: string;
  body: string;
}): Promise<CommentRecord> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase admin client is not configured");
  }

  const { data, error } = await supabase
    .from("brainstorm_comments")
    .insert({
      column_key: input.columnKey,
      author_name: input.authorName,
      body: input.body,
    })
    .select("id, column_key, author_name, body, created_at")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no row");

  return rowToComment(data as DbRow);
}
