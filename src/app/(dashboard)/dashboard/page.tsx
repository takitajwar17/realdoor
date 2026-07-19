import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CalendarClockIcon, FileStackIcon, MapPinIcon } from "lucide-react";

import { StartSessionDialog } from "@/components/readiness/start-session-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMetroLabel, formatProgramLabel } from "@/features/readiness/presentation";
import { listReadinessSessions } from "@/features/readiness/server";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = {
  title: "Sessions",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; deleted?: string }>;
}) {
  const [auth, params] = await Promise.all([
    requireVerifiedPageSession("/dashboard"),
    searchParams,
  ]);
  const sessions = await listReadinessSessions(auth.userId);
  const latestSession = sessions.reduce<(typeof sessions)[number] | null>(
    (latest, session) =>
      !latest || session.lastAccessedAt > latest.lastAccessedAt ? session : latest,
    null,
  );

  return (
    <>
      <PageHeader items={[{ href: "/dashboard", label: "Sessions" }]} />
      <main className="mx-auto flex w-full max-w-[1520px] flex-1 flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        {params.deleted === "1" ? (
          <p
            role="status"
            className="rounded-xl border border-status-success/25 bg-status-success/8 px-4 py-3 text-sm font-medium text-status-success"
          >
            That session and everything linked to it were deleted.
          </p>
        ) : null}

        <section className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Your sessions
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Open a session, pick up where you left off, or start a new one.
            </p>
          </div>
          <StartSessionDialog
            key={params.new === "1" ? "start-open" : "start-closed"}
            defaultOpen={params.new === "1" || sessions.length === 0}
          />
        </section>

        {sessions.length > 0 ? (
          <>
            <section className="grid overflow-hidden rounded-xl border border-border/80 bg-card shadow-[var(--shadow-dashboard)] sm:grid-cols-3 sm:divide-x sm:divide-border/70">
              <DashboardMetric
                icon={FileStackIcon}
                label="Sessions"
                value={String(sessions.length)}
              />
              <DashboardMetric
                icon={CalendarClockIcon}
                label="Last opened"
                value={
                  latestSession
                    ? latestSession.lastAccessedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"
                }
              />
              <DashboardMetric icon={MapPinIcon} label="Area" value="Boston · 2026" />
            </section>

            <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
              <CardHeader className="border-b border-border/70 bg-muted/20">
                <CardTitle className="text-base">All sessions</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Only you can open these private sessions.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(220px,0.7fr)_minmax(150px,0.5fr)_auto] gap-4 border-b border-border/70 px-5 py-2.5 text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground md:grid">
                  <span>Session</span>
                  <span>Area</span>
                  <span>Last opened</span>
                  <span className="sr-only">Actions</span>
                </div>
                <div className="divide-y divide-border/70">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.7fr)_minmax(150px,0.5fr)_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold">{session.name}</p>
                          <Badge
                            variant="outline"
                            className="border-amber-500/25 bg-amber-500/6 text-amber-700 dark:text-amber-300"
                          >
                            Practice only
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {formatProgramLabel(session.program)} · {formatMetroLabel(session.metro)}
                        </p>
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold">{session.targetYear}</p>
                        <p className="mt-1 text-muted-foreground">Boston area</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.lastAccessedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <Button asChild size="sm">
                        <Link href={`/dashboard/${session.id}/profile`}>
                          Open
                          <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileStackIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 last:border-b-0 sm:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/9 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}
