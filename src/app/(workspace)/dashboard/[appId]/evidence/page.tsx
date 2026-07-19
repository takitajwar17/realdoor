import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  FileSearchIcon,
  FileTextIcon,
  HistoryIcon,
} from "lucide-react";

import { ReadinessPageShell } from "@/components/readiness/readiness-page-shell";
import { SourceCitationDialog } from "@/components/readiness/source-citation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FACT_STATUS } from "@/db/schema";
import { getReadinessWorkspace } from "@/features/readiness/server";
import { formatFactValue, getFactLabel } from "@/features/readiness/presentation";
import { summarizeConfirmedIncome } from "@/features/readiness/domain";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = { title: "Evidence trail · Application readiness" };

const auditLabels: Record<string, string> = {
  session_started: "You started this session",
  document_uploaded: "You added a document",
  document_extracted: "Suggested fields are ready to review",
  document_extraction_failed: "A document could not be read automatically",
  document_instruction_ignored: "Instructions inside a document were ignored",
  document_details_confirmed: "You confirmed document details",
  document_removed: "You removed a document and its linked fields",
  fact_confirmed: "You confirmed a field",
  fact_removed: "You removed a field",
  manual_fact_confirmed: "You added or corrected a profile value",
  rule_question_answered: "A rule question was answered from the practice guide",
  rule_question_unresolved: "A question could not be answered from the practice guide",
  document_included: "You included a document in the packet",
  document_excluded: "You excluded a document from the packet",
  packet_downloaded: "You downloaded the packet",
};

export default async function EvidencePage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const auth = await requireVerifiedPageSession(`/dashboard/${appId}/evidence`);
  let workspace: Awaited<ReturnType<typeof getReadinessWorkspace>>;
  try {
    workspace = await getReadinessWorkspace(appId, auth.userId);
  } catch {
    notFound();
  }

  const confirmedCount = workspace.facts.filter(
    (fact) => fact.status === FACT_STATUS.CONFIRMED,
  ).length;
  const awaitingCount = workspace.facts.filter(
    (fact) => fact.status === FACT_STATUS.EXTRACTED,
  ).length;
  const income = summarizeConfirmedIncome(workspace.confirmedFacts);
  const documentById = new Map(workspace.documents.map((document) => [document.id, document]));
  const latestChange = workspace.audit.find((event) =>
    ["fact_confirmed", "fact_removed", "manual_fact_confirmed", "document_removed", "document_details_confirmed"].includes(event.action),
  );

  return (
    <ReadinessPageShell
      session={workspace.session}
      current="evidence"
      title="Evidence trail"
      description="Inspect every confirmed input, its source, the exact transformation it drives, and the frozen rule passage used downstream."
      actions={
        <Button asChild variant="outline">
          <Link href={`/dashboard/${appId}/prepare`}>
            <ArrowLeftIcon className="h-4 w-4" /> Back to Prepare
          </Link>
        </Button>
      }
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TrailMetric icon={FileTextIcon} label="Documents" value={workspace.documents.length} />
        <TrailMetric
          icon={FileSearchIcon}
          label="Suggested fields"
          value={workspace.facts.length}
        />
        <TrailMetric icon={CheckCircle2Icon} label="Confirmed facts" value={confirmedCount} />
        <TrailMetric icon={HistoryIcon} label="Actions" value={workspace.audit.length} />
      </section>

      <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
        <CardHeader className="border-b border-border/70 bg-muted/20">
          <CardTitle className="text-base">How your information is used</CardTitle>
          <p className="text-sm text-muted-foreground">
            Every suggested field waits for your confirmation before RealDoor uses it.
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
            <TrustNode
              eyebrow="Source"
              title="Your documents"
              detail={`${workspace.documents.length} in this session`}
            />
            <ArrowRightIcon className="mx-auto hidden h-4 w-4 text-muted-foreground lg:block" />
            <TrustNode
              eyebrow="Review"
              title="Suggested fields"
              detail={
                awaitingCount === 1
                  ? "1 waiting for confirmation"
                  : `${awaitingCount} waiting for confirmation`
              }
            />
            <ArrowRightIcon className="mx-auto hidden h-4 w-4 text-muted-foreground lg:block" />
            <TrustNode
              eyebrow="Your control"
              title="Confirmed facts"
              detail={
                confirmedCount === 1
                  ? "1 used in later steps"
                  : `${confirmedCount} used in later steps`
              }
              accent
            />
            <ArrowRightIcon className="mx-auto hidden h-4 w-4 text-muted-foreground lg:block" />
            <TrustNode
              eyebrow="Result"
              title="Math and packet"
              detail="Only after you confirm"
            />
          </div>
        </CardContent>
      </Card>

      {latestChange ? (
        <section role="status" aria-live="polite" className="rounded-xl border border-primary/25 bg-primary/7 p-4">
          <h2 className="text-sm font-bold">What changed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {auditLabels[latestChange.action] ?? "Your session changed"}. The worksheet,
            checklist, evidence trail, preview, and downloadable packet now use packet v
            {workspace.session.revision}; replaced values are no longer reused.
          </p>
        </section>
      ) : null}

      <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
        <CardHeader className="border-b border-border/70 bg-muted/20">
          <CardTitle className="text-base">Confirmed inputs and downstream use</CardTitle>
          <p className="text-sm text-muted-foreground">
            Only these confirmed values can influence the worksheet, checklist, or packet.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {workspace.confirmedFacts.length ? (
            <div className="divide-y divide-border/70">
              {workspace.confirmedFacts.map((fact) => {
                const document = fact.documentId ? documentById.get(fact.documentId) : undefined;
                return (
                  <article key={fact.factId ?? fact.key} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.7fr)]">
                    <div>
                      <h3 className="text-sm font-bold">{getFactLabel(fact.key)}</h3>
                      <p className="mt-1 text-lg font-semibold">{formatFactValue(fact.key, fact.value)}</p>
                      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <div><dt className="font-semibold">Source</dt><dd className="text-muted-foreground">{document?.payload.name ?? "Entered by renter"}{fact.page ? ` · page ${fact.page}` : ""}</dd></div>
                        <div><dt className="font-semibold">Reading confidence</dt><dd className="text-muted-foreground">{fact.confidence === null || fact.confidence === undefined ? "Renter-entered" : `${Math.round(fact.confidence * 100)}% · confirmed by renter`}</dd></div>
                        <div><dt className="font-semibold">Evidence location</dt><dd className="text-muted-foreground">{fact.box ? `${Math.round(fact.box.x * 100)}% from left, ${Math.round(fact.box.y * 100)}% from top, ${Math.round(fact.box.width * 100)}% wide` : "Renter-entered; no document box"}</dd></div>
                        <div><dt className="font-semibold">Used in</dt><dd className="text-muted-foreground">{downstreamUse(fact.key)}</dd></div>
                      </dl>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/18 p-4">
                      <p className="text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Exact evidence</p>
                      <blockquote className="mt-2 border-l-2 border-primary pl-3 text-sm">{fact.sourceQuote ? `“${fact.sourceQuote}”` : "Entered directly by the renter"}</blockquote>
                      <p className="mt-3 text-xs text-muted-foreground">Confirmation is required before every downstream use.</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <p className="p-6 text-sm text-muted-foreground">No confirmed inputs yet.</p>}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader><CardTitle className="text-base">Deterministic transformations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {income.status === "complete" ? income.components.map((component) => (
              <div key={component.label} className="rounded-xl border border-border bg-muted/18 p-4">
                <p className="text-sm font-bold">{component.label}</p><p className="mt-1 font-mono text-xs">{component.formula}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Income arithmetic remains unresolved until the needed facts are confirmed.</p>}
            {workspace.comparison.status === "complete" ? <p className="font-mono text-xs">{workspace.comparison.formula}</p> : null}
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader><CardTitle className="text-base">Rules used</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {workspace.rulePack.sources.filter((source) => workspace.rulePack.calculationSourceIds.includes(source.id)).map((source) => (
              <SourceCitationDialog key={source.id} source={source} version={workspace.rulePack.version} effectiveDate={workspace.rulePack.effectiveDate} />
            ))}
            <p className="text-xs leading-5 text-muted-foreground">Version {workspace.rulePack.version} · effective {workspace.rulePack.effectiveDate}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Your session activity</CardTitle>
            <p className="text-sm text-muted-foreground">
              What happened and when. Personal values, source text, questions, and answers are never
              shown here.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {workspace.audit.length > 0 ? (
              <ol className="divide-y divide-border/70">
                {workspace.audit.map((event) => (
                  <li
                    key={event.id}
                    className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <p className="text-sm font-bold">
                        {auditLabels[event.action] ?? "Session updated"}
                      </p>
                    </div>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={event.createdAt.toISOString()}
                    >
                      {event.createdAt.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">No activity yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">What RealDoor keeps—and what it never creates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm leading-6">
            <Boundary
              title="Kept private in your session"
              detail="Documents, filenames, evidence excerpts, fact values, questions, and answers."
            />
            <Boundary
              title="Activity without personal values"
              detail="The type of action and when it happened—for example, that a fact was confirmed, but not the fact itself."
            />
            <Boundary
              title="Never produced"
              detail="Eligibility decisions, approval predictions, readiness scores, ranks, or automatic submissions."
            />
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/data-we-use">Open Data we use</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </ReadinessPageShell>
  );
}

function downstreamUse(key: string) {
  if (key === "household_size") return "Frozen threshold selection, worksheet, packet";
  if (["weekly_hours", "hourly_rate", "gross_pay", "pay_frequency", "monthly_benefit", "gross_receipts"].includes(key)) return "Annualized-income worksheet, threshold comparison, packet";
  if (["pay_date", "document_date", "application_date", "statement_month"].includes(key)) return "Checklist evidence, evidence trail, packet";
  return "Profile, evidence trail, selected packet facts";
}

function TrailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileTextIcon;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/9 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </span>
          <strong className="mt-0.5 block text-sm font-bold">{value}</strong>
        </span>
      </CardContent>
    </Card>
  );
}

function TrustNode({
  eyebrow,
  title,
  detail,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${accent ? "border-primary/30 bg-primary/7" : "border-border bg-muted/20"}`}
    >
      <p className="text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {eyebrow}
      </p>
      <p className="mt-1 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Boundary({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
