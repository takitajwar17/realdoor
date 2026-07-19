import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileClockIcon,
  FileTextIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { DocumentUploader } from "@/components/readiness/document-uploader";
import { DocumentControls } from "@/components/readiness/document-controls";
import { FactReviewCard, type FactReviewItem } from "@/components/readiness/fact-review-card";
import { ManualFactForm } from "@/components/readiness/manual-fact-form";
import { ReadinessPageShell } from "@/components/readiness/readiness-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FACT_STATUS } from "@/db/schema";
import { getReadinessWorkspace } from "@/features/readiness/server";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = { title: "Profile · Application readiness" };

const documentKindLabels: Record<string, string> = {
  pay_stub: "Pay stub",
  benefits_letter: "Benefits letter",
  photo_id: "Photo ID",
  bank_statement: "Bank statement",
  other: "Other document",
};

const statusMeta: Record<string, { label: string; className: string }> = {
  uploaded: {
    label: "Queued",
    className: "border-status-info/25 bg-status-info/8 text-status-info",
  },
  processing: {
    label: "Extracting",
    className: "border-status-warning/25 bg-status-warning/8 text-status-warning",
  },
  ready: {
    label: "Evidence ready",
    className: "border-status-success/25 bg-status-success/8 text-status-success",
  },
  failed: {
    label: "Needs manual entry",
    className: "border-destructive/25 bg-destructive/8 text-destructive",
  },
};

export default async function ProfilePage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const auth = await requireVerifiedPageSession(`/dashboard/${appId}/profile`);
  let workspace: Awaited<ReturnType<typeof getReadinessWorkspace>>;
  try {
    workspace = await getReadinessWorkspace(appId, auth.userId);
  } catch {
    notFound();
  }

  const documentById = new Map(workspace.documents.map((document) => [document.id, document]));
  const visibleFacts: FactReviewItem[] = workspace.facts
    .filter((fact) => fact.status !== FACT_STATUS.REJECTED)
    .map((fact) => {
      const document = fact.documentId ? documentById.get(fact.documentId) : null;
      return {
        id: fact.id,
        key: fact.key,
        status: fact.status,
        confidence: fact.confidence === null ? null : fact.confidence / 1000,
        documentId: fact.documentId,
        documentName: document?.payload.name ?? null,
        value: fact.payload.value,
        sourceQuote: fact.payload.sourceQuote,
        page: fact.payload.page,
        box: fact.payload.box,
        conflict: workspace.conflicts.includes(fact.key as never),
      };
    });

  const confirmedValues = Object.fromEntries(
    workspace.confirmedFacts.map((fact) => [fact.key, fact.value]),
  );

  return (
    <ReadinessPageShell
      session={workspace.session}
      current="profile"
      title="Build a renter-confirmed profile"
      description="RealDoor suggests fields from each document, but does not treat them as true until you review them. Open the source, correct anything that is wrong, and confirm only what you recognize."
      actions={
        <Button asChild>
          <Link href={`/dashboard/${appId}/understand`}>
            Continue to Understand
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">1. Add practice documents</CardTitle>
            <p className="text-sm text-muted-foreground">
              Download the built-in samples or upload your own practice PDF, JPEG, or PNG.
            </p>
          </CardHeader>
          <CardContent className="p-5">
            <DocumentUploader sessionId={appId} />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Documents in this session</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your original file is encrypted before it is saved.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {workspace.documents.length > 0 ? (
              <div className="divide-y divide-border/70">
                {workspace.documents.map((document) => {
                  const meta = statusMeta[document.extractionStatus] ?? statusMeta.uploaded!;
                  return (
                    <div key={document.id}>
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/9 text-primary">
                            {document.extractionStatus === "processing" ? (
                              <FileClockIcon className="h-4 w-4" />
                            ) : (
                              <FileTextIcon className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{document.payload.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {documentKindLabels[document.kind]} ·{" "}
                              {document.payload.issuedOn ?? "date not confirmed"} ·{" "}
                              {(document.sizeBytes / 1024).toFixed(0)} KB
                            </p>
                            {document.payload.extractionError ? (
                              <p className="mt-1 text-xs text-destructive">
                                {document.payload.extractionError}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge variant="outline" className={meta.className}>
                            {meta.label}
                          </Badge>
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/api/readiness/documents/${document.id}?sessionId=${appId}`}
                              target="_blank"
                              rel="noreferrer"
                              prefetch={false}
                            >
                              Open <ExternalLinkIcon className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <DocumentControls
                        key={`${document.id}:${document.kind}:${document.payload.issuedOn ?? ""}`}
                        sessionId={appId}
                        documentId={document.id}
                        kind={document.kind}
                        issuedOn={document.payload.issuedOn}
                        confirmed={document.metadataConfirmed}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                <FileTextIcon className="h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-bold">No documents yet</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                  Start with the two practice PDFs to try the complete journey.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
        <CardHeader className="border-b border-border/70 bg-muted/20">
          <div className="flex items-start gap-3">
            <ShieldAlertIcon className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">
                2. Confirm the facts used in the comparison
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                These four fields are the only values used in the practice calculation. Manual
                entries are always labeled.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <ManualFactForm sessionId={appId} values={confirmedValues} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              3. Review every suggested field against its document
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visibleFacts.length} fact{visibleFacts.length === 1 ? "" : "s"} ready for review ·{" "}
              {workspace.confirmedFacts.length} confirmed
            </p>
          </div>
          {workspace.conflicts.length > 0 ? (
            <Badge
              variant="outline"
              className="border-destructive/25 bg-destructive/8 text-destructive"
            >
              {workspace.conflicts.length} unresolved conflict
              {workspace.conflicts.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>

        {visibleFacts.length > 0 ? (
          <div className="space-y-3">
            {visibleFacts.map((item) => (
              <FactReviewCard key={item.id} item={item} sessionId={appId} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <CheckCircle2Icon className="h-7 w-7 text-muted-foreground" />
            <h2 className="mt-3 text-base font-bold">No suggested fields to review</h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Upload a practice document, or enter the calculation inputs manually above. Nothing is
              guessed when a document is missing.
            </p>
          </div>
        )}
      </section>
    </ReadinessPageShell>
  );
}
