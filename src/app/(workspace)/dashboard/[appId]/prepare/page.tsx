import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  EyeIcon,
  FileArchiveIcon,
  FileClockIcon,
  FileQuestionIcon,
  SendIcon,
} from "lucide-react";

import { updateDocumentIncludedAction } from "@/actions/readiness.action";
import { PacketDownloadButton } from "@/components/readiness/packet-download-button";
import { ReadinessPageShell } from "@/components/readiness/readiness-page-shell";
import { SourceCitationDialog } from "@/components/readiness/source-citation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReadinessWorkspace } from "@/features/readiness/server";
import { getRuleSource } from "@/features/readiness/rules";
import { cn } from "@/lib/utils";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = { title: "Prepare · Application readiness" };

const checklistMeta = {
  present: {
    label: "Present in session",
    icon: CheckCircle2Icon,
    className: "border-status-success/25 bg-status-success/8 text-status-success",
  },
  missing: {
    label: "Missing from session",
    icon: AlertCircleIcon,
    className: "border-status-warning/25 bg-status-warning/8 text-status-warning",
  },
  expired: {
    label: "Expired per checklist",
    icon: FileClockIcon,
    className: "border-destructive/25 bg-destructive/8 text-destructive",
  },
  unresolved: {
    label: "Unresolved",
    icon: FileQuestionIcon,
    className: "border-status-info/25 bg-status-info/8 text-status-info",
  },
} as const;

export default async function PreparePage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const auth = await requireVerifiedPageSession(`/dashboard/${appId}/prepare`);
  let workspace: Awaited<ReturnType<typeof getReadinessWorkspace>>;
  try {
    workspace = await getReadinessWorkspace(appId, auth.userId);
  } catch {
    notFound();
  }

  const includedDocuments = workspace.documents.filter((document) => document.included);

  return (
    <ReadinessPageShell
      session={workspace.session}
      current="prepare"
      title="Prepare a renter-controlled packet"
      description="Checklist states describe only what is present in this session. Choose what to include, preview the exact packet, and download it yourself. Vidicy never sends it."
      actions={
        <Button asChild variant="outline">
          <Link href={`/dashboard/${appId}/understand`}>
            <ArrowLeftIcon className="h-4 w-4" /> Understand
          </Link>
        </Button>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Application checklist</CardTitle>
            <p className="text-sm text-muted-foreground">
              No completion percentage is shown; ambiguity stays visible.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/70">
              {workspace.checklist.map((item) => {
                const meta = checklistMeta[item.state];
                const source = getRuleSource(item.sourceId);
                return (
                  <div key={item.id} className="flex items-start gap-3 p-4">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        meta.className,
                      )}
                    >
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold">{item.label}</p>
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.reason}</p>
                      <p className="mt-1 text-2xs text-muted-foreground">
                        Checked on {item.asOf}
                        {item.maxAgeDays === null
                          ? " · no age window in this practice guide"
                          : ` · ${item.maxAgeDays}-day practice window`}
                      </p>
                      {source ? (
                        <div className="mt-2">
                          <SourceCitationDialog
                            source={source}
                            version={workspace.rulePack.version}
                            effectiveDate={workspace.rulePack.effectiveDate}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Choose packet documents</CardTitle>
            <p className="text-sm text-muted-foreground">
              Inclusion is explicit and reversible. Original files are not embedded in the summary
              packet.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {workspace.documents.length > 0 ? (
              <div className="divide-y divide-border/70">
                {workspace.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{document.payload.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {document.kind.replaceAll("_", " ")} ·{" "}
                        {document.payload.issuedOn ?? "date unresolved"}
                      </p>
                    </div>
                    <form action={updateDocumentIncludedAction}>
                      <input type="hidden" name="sessionId" value={appId} />
                      <input type="hidden" name="documentId" value={document.id} />
                      <input
                        type="hidden"
                        name="included"
                        value={document.included ? "false" : "true"}
                      />
                      <Button
                        type="submit"
                        variant={document.included ? "default" : "outline"}
                        size="sm"
                      >
                        {document.included ? "Included" : "Include"}
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
                <FileArchiveIcon className="h-7 w-7 text-muted-foreground" />
                <p className="mt-3 text-sm font-bold">No documents in this session</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={`/dashboard/${appId}/profile`}>Add documents in Profile</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
        <CardHeader className="flex flex-col gap-4 border-b border-border/70 bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Packet preview</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Exact summary to be downloaded · packet version {workspace.session.revision}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link
                href={`/api/readiness/packet/${appId}?mode=preview`}
                target="_blank"
                rel="noreferrer"
              >
                <EyeIcon className="h-4 w-4" /> Open full preview
              </Link>
            </Button>
            <PacketDownloadButton sessionId={appId} />
          </div>
        </CardHeader>
        <CardContent className="p-5 md:p-7">
          <div className="mx-auto max-w-4xl rounded-sm border border-border bg-white p-6 text-slate-950 shadow-sm md:p-9 dark:bg-white dark:text-slate-950">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Vidicy application-readiness packet
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Boston LIHTC practice journey
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Renter-controlled summary · not submitted · not an eligibility decision
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <PacketSection title="Confirmed facts">
                {workspace.confirmedFacts.length > 0 ? (
                  <dl className="space-y-2 text-sm">
                    {workspace.confirmedFacts.map((fact) => (
                      <div
                        key={fact.key}
                        className="flex justify-between gap-4 border-b border-slate-100 pb-2"
                      >
                        <dt className="text-slate-500">{fact.key.replaceAll("_", " ")}</dt>
                        <dd className="text-right font-semibold">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">No renter-confirmed facts.</p>
                )}
              </PacketSection>

              <PacketSection title="Income comparison">
                {workspace.comparison.status === "complete" ? (
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500">Confirmed annual total:</span>{" "}
                      <strong>${workspace.comparison.annualIncome.toLocaleString("en-US")}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Synthetic benchmark:</span>{" "}
                      <strong>${workspace.comparison.incomeLimit.toLocaleString("en-US")}</strong>
                    </p>
                    <p className="font-mono text-xs">{workspace.comparison.formula}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Unresolved: {workspace.comparison.reason}
                  </p>
                )}
              </PacketSection>

              <PacketSection title="Checklist">
                <ul className="space-y-2 text-sm">
                  {workspace.checklist.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4">
                      <span>{item.label}</span>
                      <strong>{checklistMeta[item.state].label}</strong>
                    </li>
                  ))}
                </ul>
              </PacketSection>

              <PacketSection title="Included documents">
                {includedDocuments.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {includedDocuments.map((document) => (
                      <li key={document.id}>{document.payload.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No documents selected.</p>
                )}
              </PacketSection>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/6 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <SendIcon className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-bold">Nothing has been sent</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Downloading creates a local HTML file with selectable text and structured
                  headings. You choose what happens next.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="w-fit">
              Renter controlled
            </Badge>
          </div>
        </CardContent>
      </Card>
    </ReadinessPageShell>
  );
}

function PacketSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h3>
      {children}
    </section>
  );
}
