import type { ColumnKey } from "./brainstorm-columns";

export type CommentRecord = {
  id: string;
  columnKey: ColumnKey;
  authorName: string;
  body: string;
  createdAt: string;
};
