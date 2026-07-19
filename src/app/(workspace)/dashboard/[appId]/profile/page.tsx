import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FileClockIcon,
  FileTextIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { DocumentUploader } from "@/components/readiness/document-uploader";
import { BulkConfirmFactsButton } from "@/components/readiness/bulk-confirm-facts-button";
import { DocumentControls } from "@/components/readiness/document-controls";
import { FactReviewCard, type FactReviewItem } from "@/components/readiness/fact-review-card";
import { ManualFactForm } from "@/components/readiness/manual-fact-form";
import { ReadinessPageShell } from "@/components/readiness/readiness-page-shell";
import { toChatMessages } from "@/features/readiness/chat-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FACT_STATUS } from "@/db/schema";
import { getDocumentKindLabel, getFactLabel } from "@/features/readiness/presentation";
import { getReadinessWorkspace } from "@/features/readiness/server";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = { title: "Profile" };

const statusMeta: Record<string, { label: string; className: string }> = {
  uploaded: {
    label: "Uploaded",
    className: "border-status-info/25 bg-status-info/8 text-status-info",
  },
  processing: {
    label: "Reading",
    className: "border-status-warning/25 bg-status-warning/8 text-status-warning",
  },
  ready: {
    label: "Ready to review",
    className: "border-status-success/25 bg-status-success/8 text-status-success",
  },
  failed: {
    label: "Needs your input",
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

  const documentMode = workspace.documents.some(
    (document) => document.payload.practiceMode === "household",
  )
    ? "household"
    : workspace.documents.some((document) => document.payload.practiceMode === "sample")
      ? "sample"
      : workspace.documents.length > 0
        ? "custom"
        : "empty";

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
        mimeType: document?.mimeType ?? null,
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
  const factsToReview = visibleFacts.filter((fact) => fact.status === FACT_STATUS.EXTRACTED);
  const confirmedReviewFacts = visibleFacts.filter((fact) => fact.status === FACT_STATUS.CONFIRMED);
  const attentionFacts = factsToReview.filter(
    (fact) => fact.conflict || (fact.confidence !== null && fact.confidence < 0.9),
  );
  const routineFacts = factsToReview.filter((fact) => !attentionFacts.includes(fact));
  const attentionGroups = Array.from(
    attentionFacts.reduce((groups, fact) => {
      const group = groups.get(fact.key) ?? [];
      group.push(fact);
      groups.set(fact.key, group);
      return groups;
    }, new Map<string, FactReviewItem[]>()),
  );

  return (
    <ReadinessPageShell
      session={workspace.session}
      current="profile"
      title="Confirm your facts"
      description="RealDoor suggests values from your documents. Review each one, fix anything wrong, and confirm only what you recognize before it is used later."
      chatMessages={toChatMessages(workspace.questions)}
      chatSources={workspace.rulePack.sources}
      ruleVersion={workspace.rulePack.version}
      ruleEffectiveDate={workspace.rulePack.effectiveDate}
      actions={
        <Button asChild>
          <Link href={`/dashboard/${appId}/understand`}>
            Continue to Understand <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">1. Add documents</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add a sample for each checklist type, load a full practice household, or upload your
              own PDF, JPEG, or PNG.
            </p>
          </CardHeader>
          <CardContent className="p-5">
            <DocumentUploader sessionId={appId} documentMode={documentMode} />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Documents in this session</CardTitle>
            <p className="text-sm text-muted-foreground">
              Files stay private to this session and are never sent automatically.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {workspace.documents.length > 0 ? (
              <div className="divide-y divide-border/70">
                {workspace.documents.map((document) => {
                  const meta = statusMeta[document.extractionStatus] ?? statusMeta.uploaded!;
                  return (
                    <details key={document.id} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 outline-none transition-colors hover:bg-muted/20 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                        <div className="flex min-w-0 items-center gap-3">
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
                              {getDocumentKindLabel(document.kind)} ·{" "}
                              {document.payload.issuedOn ?? "date not set"}
                            </p>
                            {document.payload.extractionError ? (
                              <p className="mt-1 text-xs text-destructive">
                                {document.payload.extractionError}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                          <Badge variant="outline" className={meta.className}>
                            {meta.label}
                          </Badge>
                          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                            Details
                          </span>
                          <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                        </div>
                      </summary>
                      <div className="border-t border-border/70 bg-muted/10">
                        <div className="flex items-center justify-between gap-3 px-4 pt-4">
                          <p className="text-xs leading-5 text-muted-foreground">
                            Review the original file before confirming its details.
                          </p>
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={`/api/readiness/documents/${document.id}?sessionId=${appId}`}
                              target="_blank"
                              rel="noreferrer"
                              prefetch={false}
                            >
                              Open document <ExternalLinkIcon className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
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
                    </details>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                <FileTextIcon className="h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-bold">No documents yet</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                  Start with a sample document for each checklist type, or add a full practice
                  household.
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
              <CardTitle className="text-base">2. Enter or correct key facts</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Add household size and income details here when they are missing or need a
                correction. Values you enter are labeled as entered by you.
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
            <h2 className="text-base font-bold tracking-tight text-foreground">
              3. Review suggested values
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {factsToReview.length} to review · {confirmedReviewFacts.length} confirmed
            </p>
          </div>
          {workspace.conflicts.length > 0 ? (
            <Badge
              variant="outline"
              className="border-destructive/25 bg-destructive/8 text-destructive"
            >
              {workspace.conflicts.length} value
              {workspace.conflicts.length === 1 ? "" : "s"} don&apos;t match
            </Badge>
          ) : null}
        </div>

        {factsToReview.length > 0 || confirmedReviewFacts.length > 0 ? (
          <div className="space-y-4">
            {attentionFacts.length > 0 ? (
              <section className="overflow-hidden rounded-xl border border-destructive/20 bg-card shadow-[var(--shadow-dashboard)]">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-destructive/15 bg-destructive/[0.035] px-5 py-4">
                  <div>
                    <h3 className="text-sm font-bold">Needs attention</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Review mismatched or less certain readings first.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-destructive/25 bg-destructive/8 text-destructive"
                  >
                    {attentionFacts.length} to check
                  </Badge>
                </div>
                <div className="space-y-6 p-3 sm:p-4">
                  {attentionGroups.map(([key, items]) => (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center justify-between gap-3 px-1">
                        <h4 className="text-sm font-bold">{getFactLabel(key)}</h4>
                        {items.some((item) => item.conflict) ? (
                          <span className="text-xs font-medium text-destructive">
                            {items.length} source{items.length === 1 ? "" : "s"} to compare
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            Review closely
                          </span>
                        )}
                      </div>
                      {items.map((item) => (
                        <FactReviewCard key={item.id} item={item} sessionId={appId} />
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-status-success/20 bg-status-success/[0.04] px-4 py-3">
                <CheckCircle2Icon className="h-5 w-5 shrink-0 text-status-success" />
                <div>
                  <p className="text-sm font-bold">Nothing needs extra attention</p>
                  <p className="text-xs text-muted-foreground">
                    The remaining readings are clear and ready for confirmation.
                  </p>
                </div>
              </div>
            )}

            {routineFacts.length > 0 ? (
              <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-[var(--shadow-dashboard)]">
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2Icon className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
                    <div>
                      <h3 className="text-sm font-bold">Ready to confirm</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Clear readings with no mismatch found.
                      </p>
                    </div>
                  </div>
                  <BulkConfirmFactsButton sessionId={appId} />
                </div>
                <details className="group border-t border-border/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 outline-none transition-colors hover:bg-muted/20 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Review individually
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{routineFacts.length}</Badge>
                      <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="space-y-3 border-t border-border/70 p-3 sm:p-4">
                    {routineFacts.map((item) => (
                      <FactReviewCard key={item.id} item={item} sessionId={appId} />
                    ))}
                  </div>
                </details>
              </section>
            ) : null}

            {confirmedReviewFacts.length > 0 ? (
              <details className="group overflow-hidden rounded-xl border border-border/70 bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 outline-none transition-colors hover:bg-muted/20 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  <div>
                    <h3 className="text-sm font-bold">Confirmed</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Values you have already reviewed.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{confirmedReviewFacts.length}</Badge>
                    <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                  </div>
                </summary>
                <div className="space-y-3 border-t border-border/70 p-3 sm:p-4">
                  {confirmedReviewFacts.map((item) => (
                    <FactReviewCard key={item.id} item={item} sessionId={appId} />
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <CheckCircle2Icon className="h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-bold">Nothing to review yet</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
              Upload a document or enter key facts above. RealDoor does not invent missing values.
            </p>
          </div>
        )}
      </section>
    </ReadinessPageShell>
  );
}
