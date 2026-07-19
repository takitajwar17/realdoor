"use client";

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
import { hasOpenableSourceUrl } from "@/features/readiness/source-url";

export function SourceCitationDialog({
  source,
  version,
  effectiveDate,
}: {
  source: { id: string; title: string; url: string; passage: string; locator?: string };
  version?: string;
  effectiveDate: string;
}) {
  if (!hasOpenableSourceUrl(source.url)) {
    return null;
  }

  const externalUrl = source.url.trim();

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
            {source.id}
            {source.locator && !source.title.includes(source.locator)
              ? ` · ${source.locator}`
              : ""}{" "}
            · effective {effectiveDate}
            {version ? ` · ${version}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-muted/25 p-4">
          <p className="text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Supporting passage
          </p>
          <p className="mt-2 text-sm leading-6">{source.passage}</p>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          This is the exact passage RealDoor used. Open the official source to read it in full.
        </p>
        <Button asChild>
          <a href={externalUrl} target="_blank" rel="noopener noreferrer">
            Open source
            <ExternalLinkIcon className="h-4 w-4" />
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
