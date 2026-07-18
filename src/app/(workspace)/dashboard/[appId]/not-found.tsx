import Link from "next/link";
import { ArrowLeftIcon, FolderXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PracticeSessionNotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-7 text-center shadow-[var(--shadow-dashboard)] sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FolderXIcon className="h-6 w-6" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Session unavailable
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          We couldn&apos;t open this practice session
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          It may have been deleted, or it may belong to another account. Your other private sessions
          are still available from your journey.
        </p>
        <Button asChild className="mt-7">
          <Link href="/dashboard">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to your journey
          </Link>
        </Button>
      </div>
    </main>
  );
}
