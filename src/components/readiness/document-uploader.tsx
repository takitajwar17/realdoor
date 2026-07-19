"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DownloadIcon,
  FilePlus2Icon,
  FileStackIcon,
  FileUpIcon,
  InfoIcon,
  LoaderCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** One sample PDF per checklist document kind (from the frozen gold pack). */
const sampleDocuments = [
  {
    kind: "application_summary",
    label: "Application summary",
    fileName: "hh-003_d01_application_summary.pdf",
  },
  {
    kind: "pay_stub",
    label: "Recent pay statement",
    fileName: "hh-003_d02_pay_stub.pdf",
  },
  {
    kind: "pay_stub",
    label: "Earlier pay statement",
    fileName: "hh-003_d03_pay_stub.pdf",
  },
  {
    kind: "benefit_letter",
    label: "Benefit letter",
    fileName: "hh-003_d04_benefit_letter.pdf",
  },
] as const;

const sampleHouseholds = [
  {
    id: "hh-001",
    label: "Regular hourly pay",
    files: [
      "hh-001_d01_application_summary.pdf",
      "hh-001_d02_pay_stub.pdf",
      "hh-001_d03_pay_stub.pdf",
      "hh-001_d04_employment_letter.pdf",
    ],
  },
  {
    id: "hh-002",
    label: "Pay statements that need a correction",
    files: [
      "hh-002_d01_application_summary.pdf",
      "hh-002_d02_pay_stub.pdf",
      "hh-002_d03_pay_stub.pdf",
      "hh-002_d04_employment_letter.pdf",
    ],
  },
  {
    id: "hh-003",
    label: "Wages and monthly benefits",
    files: [
      "hh-003_d01_application_summary.pdf",
      "hh-003_d02_pay_stub.pdf",
      "hh-003_d03_pay_stub.pdf",
      "hh-003_d04_benefit_letter.pdf",
    ],
  },
  {
    id: "hh-004",
    label: "Wages and gig income",
    files: [
      "hh-004_d01_application_summary.pdf",
      "hh-004_d02_pay_stub.pdf",
      "hh-004_d03_pay_stub.pdf",
      "hh-004_d04_gig_statement.pdf",
    ],
  },
  {
    id: "hh-005",
    label: "Employment letter that is out of date",
    files: [
      "hh-005_d01_application_summary.pdf",
      "hh-005_d02_pay_stub.pdf",
      "hh-005_d03_pay_stub.pdf",
      "hh-005_d04_employment_letter.pdf",
    ],
  },
  {
    id: "hh-006",
    label: "Wages and benefits near the benchmark",
    files: [
      "hh-006_d01_application_summary.pdf",
      "hh-006_d02_pay_stub.pdf",
      "hh-006_d03_pay_stub.pdf",
      "hh-006_d04_benefit_letter.pdf",
    ],
  },
] as const;

type SessionDocumentMode = "empty" | "custom" | "sample" | "household";

export function DocumentUploader({
  sessionId,
  documentMode,
}: {
  sessionId: string;
  documentMode: SessionDocumentMode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sampleId, setSampleId] = useState<(typeof sampleHouseholds)[number]["id"]>("hh-002");
  const [addingFile, setAddingFile] = useState<string | null>(null);

  async function postDocument(
    file: File,
    practiceMode: "custom" | "sample" | "household" = "custom",
    practiceHouseholdId?: string,
  ) {
    const formData = new FormData();
    formData.set("sessionId", sessionId);
    formData.set("file", file);
    formData.set("practiceMode", practiceMode);
    if (practiceHouseholdId) formData.set("practiceHouseholdId", practiceHouseholdId);
    const response = await fetch("/api/readiness/documents", {
      method: "POST",
      body: formData,
      headers: { "X-Requested-With": "RealDoorReadiness" },
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error || "Upload failed");
  }

  async function fetchDemoFile(fileName: string) {
    const response = await fetch(`/api/readiness/demo-documents/${encodeURIComponent(fileName)}`);
    if (!response.ok) throw new Error("A practice document could not be loaded.");
    return new File([await response.blob()], fileName, { type: "application/pdf" });
  }

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setStatus("error");
      setMessage("Choose a PDF, JPEG, or PNG document first.");
      return;
    }

    setStatus("uploading");
    setMessage("Uploading and reading the document for suggested fields…");
    try {
      await postDocument(file, "custom");

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

  async function addSampleDocument(fileName: string, label: string) {
    setAddingFile(fileName);
    setStatus("uploading");
    setMessage(`Adding sample ${label.toLowerCase()}…`);
    try {
      const file = await fetchDemoFile(fileName);
      await postDocument(file, "sample");
      setStatus("success");
      setMessage(`${label} added. Confirm the type, date, and suggested values.`);
      router.refresh();
      window.setTimeout(() => router.refresh(), 1800);
      window.setTimeout(() => router.refresh(), 4200);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "The sample document could not be added.",
      );
    } finally {
      setAddingFile(null);
    }
  }

  async function loadSampleHousehold() {
    const sample = sampleHouseholds.find((item) => item.id === sampleId)!;
    setStatus("uploading");
    setMessage(
      `Adding ${sample.files.length} practice documents for ${sample.label.toLowerCase()}…`,
    );
    try {
      for (const fileName of sample.files) {
        const file = await fetchDemoFile(fileName);
        await postDocument(file, "household", sample.id);
      }
      setStatus("success");
      setMessage(
        `${sample.files.length} practice documents added. Confirm their details and the values you want to use.`,
      );
      router.refresh();
      window.setTimeout(() => router.refresh(), 2200);
      window.setTimeout(() => router.refresh(), 5000);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "The practice documents could not be added.",
      );
    }
  }

  const busy = status === "uploading";
  const householdLocked = documentMode === "household";
  const householdChoiceLocked = documentMode !== "empty";
  const individualBlockMessage =
    "A complete practice household is already in this session. Start a new session for individual documents, or remove the household documents first.";
  const householdBlockMessage =
    documentMode === "sample"
      ? "Individual sample documents are already in this session. Start a new session for a complete household, or remove every sample first."
      : "This session already contains documents. Start a new session for a complete practice household, or remove the existing documents first.";

  return (
    <div className="space-y-4">
      {documentMode !== "empty" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/6 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">
                {householdLocked
                  ? "This session is reserved for one complete practice household."
                  : "This session is using individual documents."}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {householdLocked
                  ? "To try other files, start a new session or remove this household first."
                  : "To try a complete household, start a new session or remove every current document first."}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/dashboard?new=1">Start new session</Link>
          </Button>
        </div>
      ) : null}

      <div className="rounded-xl border border-dashed border-border bg-muted/15 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <BlockedControl blocked={householdLocked} message={individualBlockMessage}>
            <Input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              aria-label="Choose a practice application document"
              disabled={busy || householdLocked}
              className="bg-background"
            />
          </BlockedControl>
          <BlockedControl blocked={householdLocked} message={individualBlockMessage}>
            <Button
              type="button"
              onClick={upload}
              disabled={busy || householdLocked}
              className="sm:w-auto"
            >
              {busy && !addingFile ? (
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              ) : (
                <FileUpIcon className="h-4 w-4" />
              )}
              {busy && !addingFile ? "Processing…" : "Upload document"}
            </Button>
          </BlockedControl>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          PDF, JPEG, or PNG · 10 MB maximum · practice documents only
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/15 p-4">
        <p className="text-sm font-bold">Sample documents by type</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          These documents all belong to the same synthetic renter. Download one, or add individual
          samples to this session.
        </p>
        <ul className="mt-3 divide-y divide-border/70 rounded-lg border border-border bg-background">
          {sampleDocuments.map((sample) => {
            const isAdding = addingFile === sample.fileName;
            return (
              <li
                key={sample.fileName}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{sample.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{sample.fileName}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button asChild type="button" variant="outline" size="sm" disabled={busy}>
                    <Link
                      href={`/api/readiness/demo-documents/${encodeURIComponent(sample.fileName)}`}
                      prefetch={false}
                    >
                      <DownloadIcon className="h-3.5 w-3.5" />
                      Download
                    </Link>
                  </Button>
                  <BlockedControl blocked={householdLocked} message={individualBlockMessage}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy || householdLocked}
                      onClick={() => void addSampleDocument(sample.fileName, sample.label)}
                    >
                      {isAdding ? (
                        <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FilePlus2Icon className="h-3.5 w-3.5" />
                      )}
                      {isAdding ? "Adding…" : "Add to session"}
                    </Button>
                  </BlockedControl>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-muted/15 p-4">
        <p className="text-sm font-bold">Try a complete practice household</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Add a full synthetic household set, then review and confirm what RealDoor found.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="sample-household" className="sr-only">
            Practice household
          </label>
          <select
            id="sample-household"
            value={sampleId}
            onChange={(event) => setSampleId(event.target.value as typeof sampleId)}
            disabled={busy || householdChoiceLocked}
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {sampleHouseholds.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.label}
              </option>
            ))}
          </select>
          <BlockedControl blocked={householdChoiceLocked} message={householdBlockMessage}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadSampleHousehold()}
              disabled={busy || householdChoiceLocked}
            >
              {busy && !addingFile ? (
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              ) : (
                <FileStackIcon className="h-4 w-4" />
              )}
              Add practice set
            </Button>
          </BlockedControl>
        </div>
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

function BlockedControl({
  blocked,
  message,
  children,
}: {
  blocked: boolean;
  message: string;
  children: React.ReactNode;
}) {
  if (!blocked) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex min-w-0 cursor-not-allowed" tabIndex={0}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs leading-5" side="top">
        <span className="flex items-start gap-2">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message}</span>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
