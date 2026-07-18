"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, DownloadIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PacketDownloadButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "downloading" | "downloaded" | "error">("idle");

  async function downloadPacket() {
    setStatus("downloading");
    try {
      const response = await fetch(`/api/readiness/packet/${sessionId}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="([^"]+)"/u)?.[1] ?? "vidicy-readiness-packet.html";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("downloaded");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button type="button" onClick={downloadPacket} disabled={status === "downloading"}>
        {status === "downloading" ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : status === "downloaded" ? (
          <CheckCircle2Icon className="h-4 w-4" />
        ) : (
          <DownloadIcon className="h-4 w-4" />
        )}
        {status === "downloading"
          ? "Preparing…"
          : status === "downloaded"
            ? "Downloaded"
            : "Download packet"}
      </Button>
      <p
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={
          status === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"
        }
      >
        {status === "downloaded"
          ? "Downloaded to you; not sent."
          : status === "error"
            ? "The download did not finish. Please try again."
            : "Nothing is sent when you download."}
      </p>
    </div>
  );
}
