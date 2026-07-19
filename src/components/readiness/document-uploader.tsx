"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DownloadIcon, FileUpIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DocumentUploader({ sessionId }: { sessionId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setStatus("error");
      setMessage("Choose a PDF, JPEG, or PNG document first.");
      return;
    }

    setStatus("uploading");
    setMessage("Encrypting and reading the document for suggested fields…");
    const formData = new FormData();
    formData.set("sessionId", sessionId);
    formData.set("file", file);

    try {
      const response = await fetch("/api/readiness/documents", {
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "RealDoorReadiness" },
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Upload failed");

      setStatus("success");
      setMessage("Document uploaded. RealDoor is reading it for suggested fields.");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
      window.setTimeout(() => router.refresh(), 1800);
      window.setTimeout(() => router.refresh(), 4200);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed. Try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-border bg-muted/15 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            aria-label="Choose a practice application document"
            disabled={status === "uploading"}
            className="bg-background"
          />
          <Button
            type="button"
            onClick={upload}
            disabled={status === "uploading"}
            className="sm:w-auto"
          >
            {status === "uploading" ? (
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
            ) : (
              <FileUpIcon className="h-4 w-4" />
            )}
            {status === "uploading" ? "Processing…" : "Upload document"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          PDF, JPEG, or PNG · 10 MB maximum · practice documents only
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Want to try practice files?
        </span>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/api/readiness/demo-documents/pay_stub" prefetch={false}>
            <DownloadIcon className="h-3.5 w-3.5" />
            Practice pay statement
          </Link>
        </Button>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/api/readiness/demo-documents/benefits_letter" prefetch={false}>
            <DownloadIcon className="h-3.5 w-3.5" />
            Practice benefits letter
          </Link>
        </Button>
      </div>

      {status !== "idle" ? (
        <p
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            status === "error"
              ? "text-xs font-medium text-destructive"
              : "text-xs font-medium text-primary"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
