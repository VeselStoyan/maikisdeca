import { BrainstormBoard } from "@/components/brainstorm-board";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-zinc-50 via-white to-teal-50/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-teal-950/20">
      <BrainstormBoard />
    </div>
  );
}
