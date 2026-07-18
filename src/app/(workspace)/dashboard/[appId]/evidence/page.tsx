import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  FileSearchIcon,
  GitCommitHorizontalIcon,
  HistoryIcon,
} from "lucide-react";

import { ReadinessPageShell } from "@/components/readiness/readiness-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FACT_STATUS } from "@/db/schema";
import { getReadinessWorkspace } from "@/features/readiness/server";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = { title: "Evidence trail · Application readiness" };

const auditLabels: Record<string, string> = {
  session_started: "Session started with consent",
  document_uploaded: "Encrypted document added",
  document_extracted: "Candidate fields extracted",
  fact_confirmed: "Renter confirmed a field",
  fact_removed: "Renter removed a field",
  manual_facts_confirmed: "Manual calculation inputs confirmed",
  rule_question_answered: "Rule question answered from corpus",
  rule_question_unresolved: "Rule question safely abstained",
  document_included: "Document included in packet",
  document_excluded: "Document excluded from packet",
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

  const confirmedCount = workspace.facts.filter((fact) => fact.status === FACT_STATUS.CONFIRMED).length;

  return (
    <ReadinessPageShell
      session={workspace.session}
      current="evidence"
      title="Evidence trail"
      description="Follow the trust chain from encrypted document, to extracted candidate, to renter confirmation, to deterministic calculation, checklist, and packet. Audit entries record actions—not renter values."
      actions={
        <Button asChild variant="outline">
          <Link href={`/dashboard/${appId}/prepare`}>
            <ArrowLeftIcon className="h-4 w-4" /> Back to Prepare
          </Link>
        </Button>
      }
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <TrailMetric icon={DatabaseIcon} label="Encrypted documents" value={workspace.documents.length} />
        <TrailMetric icon={FileSearchIcon} label="Field records" value={workspace.facts.length} />
        <TrailMetric icon={CheckCircle2Icon} label="Confirmed facts" value={confirmedCount} />
        <TrailMetric icon={GitCommitHorizontalIcon} label="Session revision" value={workspace.session.revision} />
        <TrailMetric icon={HistoryIcon} label="Content-free events" value={workspace.audit.length} />
      </section>

      <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
        <CardHeader className="border-b border-border/70 bg-muted/20">
          <CardTitle className="text-base">Trust chain</CardTitle>
          <p className="text-sm text-muted-foreground">Each arrow is an explicit boundary; no candidate skips confirmation.</p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
            <TrustNode eyebrow="Source" title="Encrypted document" detail={`${workspace.documents.length} in session`} />
            <ArrowRightIcon className="mx-auto hidden h-4 w-4 text-muted-foreground lg:block" />
            <TrustNode eyebrow="Extraction" title="Reviewable candidates" detail={`${workspace.facts.filter((fact) => fact.status === FACT_STATUS.EXTRACTED).length} awaiting confirmation`} />
            <ArrowRightIcon className="mx-auto hidden h-4 w-4 text-muted-foreground lg:block" />
            <TrustNode eyebrow="Renter control" title="Confirmed facts" detail={`${confirmedCount} allowed downstream`} accent />
            <ArrowRightIcon className="mx-auto hidden h-4 w-4 text-muted-foreground lg:block" />
            <TrustNode eyebrow="Derived" title="Arithmetic + packet" detail={`revision ${workspace.session.revision}`} />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Session event log</CardTitle>
            <p className="text-sm text-muted-foreground">Values, source text, questions, and answers are deliberately absent from this log.</p>
          </CardHeader>
          <CardContent className="p-0">
            {workspace.audit.length > 0 ? (
              <ol className="divide-y divide-border/70">
                {workspace.audit.map((event) => (
                  <li key={event.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-bold">{auditLabels[event.action] ?? event.action.replaceAll("_", " ")}</p>
                        <p className="mt-1 font-mono text-2xs text-muted-foreground">
                          {event.subjectType}{event.subjectId ? ` · ${event.subjectId.slice(-8)}` : ""}
                        </p>
                      </div>
                    </div>
                    <time className="text-xs text-muted-foreground" dateTime={event.createdAt.toISOString()}>
                      {event.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </time>
                  </li>
                ))}
              </ol>
            ) : <p className="p-6 text-sm text-muted-foreground">No events recorded.</p>}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Data boundaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm leading-6">
            <Boundary title="Persisted and encrypted" detail="Document bytes, filenames, evidence excerpts, fact values, questions, and answers." />
            <Boundary title="Persisted without content" detail="Opaque identifiers, workflow state, timestamps, action names, sizes, and cryptographic hashes." />
            <Boundary title="Never produced" detail="Eligibility decisions, approval predictions, readiness scores, ranks, or auto-submissions." />
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/data-we-use">Open Data We Use</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </ReadinessPageShell>
  );
}

function TrailMetric({ icon: Icon, label, value }: { icon: typeof DatabaseIcon; label: string; value: number }) {
  return (
    <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/9 text-primary"><Icon className="h-4 w-4" /></span>
        <span><span className="block text-xs text-muted-foreground">{label}</span><strong className="text-xl">{value}</strong></span>
      </CardContent>
    </Card>
  );
}

function TrustNode({ eyebrow, title, detail, accent = false }: { eyebrow: string; title: string; detail: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/30 bg-primary/7" : "border-border bg-muted/20"}`}>
      <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
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
