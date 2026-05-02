/** PostgREST: relation not found / not in schema cache */
export function isPostgrestMissingRelation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "PGRST205"
  );
}

/** Postgres: permission denied / RLS blocks row */
export function isRowLevelSecurityViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  const code = (error as { code: unknown }).code;
  return code === "42501" || code === "PGRST301";
}

export const BRAINSTORM_TABLE_SETUP_HINT =
  "Supabase → SQL → New query → paste and run the migration file supabase/migrations/20260502120000_brainstorm_comments.sql (creates the table and reloads the API schema). " +
  "If Table Editor already lists brainstorm_comments but this error persists, run only: NOTIFY pgrst, 'reload schema'; " +
  "Also confirm NEXT_PUBLIC_SUPABASE_URL is this project’s URL under Settings → API.";

export const BRAINSTORM_RLS_HINT =
  "Supabase → SQL → run supabase/migrations/20260502120002_brainstorm_comments_policies.sql (adds select/insert policies). " +
  "Also confirm SUPABASE_SERVICE_ROLE_KEY is the service_role secret from Settings → API, not the anon key.";
