"use client";

import Link from "next/link";
import type { Route } from "next";
import { ExternalLinkIcon, LibraryIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SourceCitationDialog({
  source,
  version,
  effectiveDate,
}: {
  source: { id: string; title: string; url: string; passage: string };
  version: string;
  effectiveDate: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto justify-start py-2 text-left">
          <LibraryIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{source.title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{source.title}</DialogTitle>
          <DialogDescription>
            Practice guide {version} · dated {effectiveDate}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-muted/25 p-4">
          <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Passage used for this answer
          </p>
          <p className="mt-2 text-sm leading-6">{source.passage}</p>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          This is the exact saved passage Vidicy used. Open the source to read it in its original
          context.
        </p>
        <Button asChild>
          <Link
            href={source.url as Route}
            target={source.url.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
          >
            Open source
            <ExternalLinkIcon className="h-4 w-4" />
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
