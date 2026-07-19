"use client";

import { useEffect, useRef, useState } from "react";
import { FileSearchIcon, LoaderCircleIcon } from "lucide-react";

type EvidenceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type EvidenceSourcePreviewProps = {
  sessionId: string;
  documentId: string;
  mimeType: string | null;
  page: number | null;
  box: EvidenceBox | null;
  alt: string;
};

const PREVIEW_WIDTH = 560;
const PREVIEW_ASPECT_RATIO = 16 / 9;
const PAD_X = 0.14;
const PAD_Y = 0.035;

function cropAroundBox(box: EvidenceBox, sourceWidth: number, sourceHeight: number) {
  const paddedBoxHeight = box.height + Math.max(PAD_Y, box.height) * 2;
  const widthNeededForHeight =
    paddedBoxHeight * (sourceHeight / sourceWidth) * PREVIEW_ASPECT_RATIO;
  const width = Math.min(
    1,
    Math.max(0.35, box.width + Math.max(PAD_X, box.width * 2.5) * 2, widthNeededForHeight),
  );
  const height = Math.min(1, width * (sourceWidth / sourceHeight) * (1 / PREVIEW_ASPECT_RATIO));
  const x = Math.min(Math.max(0, box.x + box.width / 2 - width / 2), 1 - width);
  const y = Math.min(Math.max(0, box.y + box.height / 2 - height / 2), 1 - height);

  return { x, y, width, height };
}

async function loadImage(url: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  return image;
}

async function renderPdfPageToCanvas(bytes: ArrayBuffer, pageNumber: number) {
  const { getResolvedPDFJS } = await import("unpdf");
  const pdfjs = await getResolvedPDFJS();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
  const page = await pdf.getPage(Math.max(1, pageNumber));
  const viewport = page.getViewport({ scale: 2.4 });
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable");

  // PDF.js render signatures differ slightly across builds; cast keeps this client path portable.
  const renderTask = page.render({
    canvasContext: context,
    viewport,
    canvas,
  } as never);
  await (renderTask as { promise: Promise<void> }).promise;

  return canvas;
}

function getSourceSize(source: CanvasImageSource) {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  if (source instanceof HTMLCanvasElement) {
    return { width: source.width, height: source.height };
  }
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { width: source.width, height: source.height };
  }
  return { width: 0, height: 0 };
}

function drawCroppedPreview(
  source: CanvasImageSource,
  target: HTMLCanvasElement,
  box: EvidenceBox | null,
) {
  const context = target.getContext("2d");
  if (!context) return;

  const { width: sourceWidth, height: sourceHeight } = getSourceSize(source);
  if (!sourceWidth || !sourceHeight) return;

  const crop = box
    ? cropAroundBox(box, sourceWidth, sourceHeight)
    : {
        x: 0,
        y: 0,
        width: 1,
        height: Math.min(1, (sourceWidth / sourceHeight) * (1 / PREVIEW_ASPECT_RATIO)),
      };

  const previewWidth = PREVIEW_WIDTH;
  const previewHeight = Math.round(previewWidth / PREVIEW_ASPECT_RATIO);
  target.width = previewWidth;
  target.height = previewHeight;

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, previewWidth, previewHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    source,
    crop.x * sourceWidth,
    crop.y * sourceHeight,
    crop.width * sourceWidth,
    crop.height * sourceHeight,
    0,
    0,
    previewWidth,
    previewHeight,
  );

  if (!box) return;

  const highlightX = ((box.x - crop.x) / crop.width) * previewWidth;
  const highlightY = ((box.y - crop.y) / crop.height) * previewHeight;
  const highlightW = (box.width / crop.width) * previewWidth;
  const highlightH = (box.height / crop.height) * previewHeight;

  context.save();
  context.strokeStyle = "rgba(37, 99, 235, 0.95)";
  context.lineWidth = Math.max(2, previewWidth * 0.006);
  context.shadowColor = "rgba(255, 255, 255, 0.9)";
  context.shadowBlur = 0;
  context.strokeRect(highlightX, highlightY, Math.max(highlightW, 4), Math.max(highlightH, 4));

  context.fillStyle = "rgba(37, 99, 235, 0.14)";
  context.fillRect(highlightX, highlightY, Math.max(highlightW, 4), Math.max(highlightH, 4));
  context.restore();
}

export function EvidenceSourcePreview({
  sessionId,
  documentId,
  mimeType,
  page,
  box,
  alt,
}: EvidenceSourcePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const controller = new AbortController();

    function abortForSessionDeletion() {
      controller.abort();
    }

    window.addEventListener("realdoor:session-deleting", abortForSessionDeletion);

    async function loadPreview() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/readiness/documents/${documentId}?sessionId=${encodeURIComponent(sessionId)}`,
          {
            credentials: "same-origin",
            headers: { "X-Requested-With": "RealDoorReadiness" },
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error("Could not open the source document.");

        const contentType = response.headers.get("content-type") ?? mimeType ?? "";
        const bytes = await response.arrayBuffer();
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Preview surface unavailable.");

        if (contentType.includes("pdf") || (!contentType && mimeType === "application/pdf")) {
          const pageCanvas = await renderPdfPageToCanvas(bytes, page ?? 1);
          if (cancelled) return;
          drawCroppedPreview(pageCanvas, canvas, box);
        } else if (contentType.startsWith("image/") || mimeType?.startsWith("image/")) {
          const blob = new Blob([bytes], { type: contentType || mimeType || "image/png" });
          objectUrl = URL.createObjectURL(blob);
          const image = await loadImage(objectUrl);
          if (cancelled) return;
          drawCroppedPreview(image, canvas, box);
        } else {
          throw new Error("This document type cannot be previewed here.");
        }

        if (!cancelled) setStatus("ready");
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Preview unavailable.");
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
      window.removeEventListener("realdoor:session-deleting", abortForSessionDeletion);
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [box, documentId, mimeType, page, sessionId]);

  return (
    <div className="mt-4 space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-border bg-background shadow-inner">
        <canvas
          ref={canvasRef}
          className="block h-auto w-full"
          style={{ display: status === "ready" ? "block" : "none" }}
          aria-label={alt}
          role="img"
        />

        {status === "loading" ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-4 py-10 text-muted-foreground">
            <LoaderCircleIcon className="h-5 w-5 animate-spin" />
            <p className="text-xs font-medium">Loading source location…</p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <FileSearchIcon className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">
              {errorMessage ?? "Source preview unavailable."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
