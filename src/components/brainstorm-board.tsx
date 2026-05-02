"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BRAINSTORM_COLUMNS,
  emptyRecordPerColumn,
  type ColumnKey,
} from "@/lib/brainstorm-columns";
import type { CommentRecord } from "@/lib/comment-types";
import { ColumnSubtitle } from "@/components/column-subtitle";

const DISPLAY_NAME_KEY = "funnel-brainstorm-display-name";
const POLL_MS = 5000;

type CommentsState = Record<ColumnKey, CommentRecord[]>;
type DraftState = Record<ColumnKey, string>;

const emptyComments = (): CommentsState =>
  emptyRecordPerColumn(() => [] as CommentRecord[]);

const emptyDrafts = (): DraftState => emptyRecordPerColumn(() => "");

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function BrainstormBoard() {
  const [displayName, setDisplayName] = useState("");
  const [comments, setComments] = useState<CommentsState | null>(null);
  const [drafts, setDrafts] = useState<DraftState>(emptyDrafts);
  const [apiHint, setApiHint] = useState<string | null>(null);
  const [posting, setPosting] = useState<ColumnKey | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(DISPLAY_NAME_KEY);
        if (saved) setDisplayName(saved);
      } catch {
        /* ignore */
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const persistName = useCallback((value: string) => {
    const trimmed = value.trim();
    try {
      if (trimmed) localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
      else localStorage.removeItem(DISPLAY_NAME_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const loadComments = useCallback(async () => {
    const res = await fetch("/api/comments", { cache: "no-store" });
    const data: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : "Could not load comments.";
      setApiHint(msg);
      setComments(emptyComments());
      return;
    }

    setApiHint(null);
    const raw =
      data &&
      typeof data === "object" &&
      "comments" in data &&
      typeof (data as { comments: unknown }).comments === "object" &&
      (data as { comments: Record<string, unknown> }).comments !== null
        ? (data as { comments: Record<string, CommentRecord[]> }).comments
        : null;

    const next = emptyComments();
    if (raw) {
      for (const col of BRAINSTORM_COLUMNS) {
        const list = raw[col.key];
        next[col.key] = Array.isArray(list)
          ? list.filter(
              (c): c is CommentRecord =>
                !!c &&
                typeof c === "object" &&
                typeof (c as CommentRecord).body === "string",
            )
          : [];
      }
    }
    setComments(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadComments();
    });
    const id = window.setInterval(() => void loadComments(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [loadComments]);

  const nameReady = displayName.trim().length > 0;

  const columnMeta = useMemo(
    () =>
      BRAINSTORM_COLUMNS.map((c, i) => ({
        ...c,
        accent: ["bg-teal-500", "bg-indigo-500", "bg-amber-500"][i],
      })),
    [],
  );

  async function submitColumn(columnKey: ColumnKey) {
    const body = (drafts[columnKey] ?? "").trim();
    if (!nameReady || !body || posting) return;

    setPosting(columnKey);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnKey,
          authorName: displayName.trim(),
          body,
        }),
      });

      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data &&
          typeof data === "object" &&
          "message" in data &&
          typeof (data as { message: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Could not post comment.";
        setApiHint(msg);
        return;
      }

      setDrafts((prev) => ({ ...prev, [columnKey]: "" }));
      setApiHint(null);
      await loadComments();
    } finally {
      setPosting(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Работещи майки, които нямат време за себе си.
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Пускайте коментари под всяко едно от предложенията ако сметнете за нужно
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Your name (saved locally)
            <input
              type="text"
              autoComplete="nickname"
              placeholder="e.g. Jordan"
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => persistName(displayName)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 shadow-sm outline-none ring-teal-500/25 placeholder:text-zinc-400 focus:border-teal-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
          </label>
          <button
            type="button"
            onClick={() => persistName(displayName)}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Save name
          </button>
        </div>

        {!nameReady && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Add your name to post comments — it is stored only in this
            browser&apos;s local storage.
          </p>
        )}

        {apiHint && (
          <div
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          >
            {apiHint}
          </div>
        )}
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
        {columnMeta.map((col) => (
          <section
            key={col.key}
            className="flex min-h-[320px] flex-col rounded-xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/60"
          >
            <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${col.accent}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {col.title}
                  </h2>
                  <div className="mt-2 max-h-[min(28rem,52vh)] overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/50">
                    <ColumnSubtitle markdown={col.subtitle} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 px-4 py-3">
              <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
                {comments === null ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Loading comments…
                  </p>
                ) : (comments[col.key] ?? []).length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No notes yet — be the first.
                  </p>
                ) : (
                  (comments[col.key] ?? []).map((c) => (
                    <article
                      key={c.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {c.authorName}
                        </span>
                        <time
                          dateTime={c.createdAt}
                          className="text-xs text-zinc-500 dark:text-zinc-400"
                        >
                          {formatWhen(c.createdAt)}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                        {c.body}
                      </p>
                    </article>
                  ))
                )}
              </div>

              <div className="mt-auto flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <label className="sr-only" htmlFor={`draft-${col.key}`}>
                  New comment for {col.title}
                </label>
                <textarea
                  id={`draft-${col.key}`}
                  rows={3}
                  maxLength={2000}
                  placeholder="Drop an idea, objection, or experiment…"
                  value={drafts[col.key] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [col.key]: e.target.value,
                    }))
                  }
                  disabled={!nameReady || posting === col.key}
                  className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none ring-teal-500/20 placeholder:text-zinc-400 focus:border-teal-500 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => void submitColumn(col.key)}
                  disabled={
                    !nameReady ||
                    !(drafts[col.key] ?? "").trim() ||
                    posting === col.key
                  }
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                >
                  {posting === col.key ? "Posting…" : "Post comment"}
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
