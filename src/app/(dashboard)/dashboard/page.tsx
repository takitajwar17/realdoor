import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  CircleUserRoundIcon,
  Clock3Icon,
  FileCheck2Icon,
  ListChecksIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { StartSessionForm } from "@/components/readiness/start-session-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listReadinessSessions } from "@/features/readiness/server";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = {
  title: "Application readiness",
};

const journey = [
  {
    icon: CircleUserRoundIcon,
    title: "Profile",
    description:
      "Upload practice documents, check the supporting words, correct mistakes, and confirm each fact yourself.",
  },
  {
    icon: BookOpenCheckIcon,
    title: "Understand",
    description:
      "See the saved 2026 practice guide and every step in the arithmetic—without an eligibility judgment.",
  },
  {
    icon: ListChecksIcon,
    title: "Prepare",
    description:
      "Resolve checklist items, choose packet contents, preview, and download—never auto-send.",
  },
] as const;

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
  const showStart = params.new === "1" || sessions.length === 0;

  return (
    <>
      <PageHeader items={[{ href: "/dashboard", label: "Journey" }]} />
      <main className="mx-auto flex w-full max-w-[1520px] flex-1 flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        {params.deleted === "1" ? (
          <p
            role="status"
            className="rounded-xl border border-status-success/25 bg-status-success/8 px-4 py-3 text-sm font-medium text-status-success"
          >
            The session and all content linked to it were deleted from Vidicy.
          </p>
        ) : null}

        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card px-5 py-7 shadow-[var(--shadow-dashboard)] md:px-8 md:py-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)] xl:items-center">
            <div className="max-w-3xl">
              <Badge variant="outline" className="border-primary/20 bg-primary/7 text-primary">
                Renter-controlled application readiness
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] md:text-5xl">
                Turn scattered documents into a clear, reviewable application packet.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Vidicy traces every conclusion back to document evidence and renter-confirmed facts.
                It explains what is known, what is missing, and what remains unresolved—without
                deciding whether anyone is eligible or likely to be approved.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-primary" /> Encrypted session content
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
                  <FileCheck2Icon className="h-3.5 w-3.5 text-primary" /> Evidence before
                  conclusions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
                  <Clock3Icon className="h-3.5 w-3.5 text-primary" /> Delete the session any time
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              {journey.map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 rounded-xl border border-border/75 bg-background/85 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Step {index + 1}
                    </p>
                    <h2 className="mt-0.5 text-sm font-bold">{step.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {sessions.length > 0 ? (
          <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
            <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border/70 bg-muted/20">
              <div>
                <CardTitle className="text-base">Your practice sessions</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Only you can open these private sessions.
                </p>
              </div>
              {!showStart ? (
                <Button asChild variant="outline">
                  <Link href="/dashboard?new=1">New practice session</Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="divide-y divide-border/70 p-0">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">Boston LIHTC practice journey</p>
                      <Badge
                        variant="outline"
                        className="border-amber-500/25 bg-amber-500/6 text-amber-700 dark:text-amber-300"
                      >
                        2026 practice only
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {session.metro} · packet version {session.revision} · last opened{" "}
                      {session.lastAccessedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/dashboard/${session.id}/profile`}>
                      Open session
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {showStart ? <StartSessionForm /> : null}
      </main>
    </>
  );
}
