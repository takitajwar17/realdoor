import { Metadata } from "next";
import Link from "next/link";
import { CANONICAL_SITE_URL } from "@/constants";
import { siteConfig } from "@/lib/config";
import { constructMetadata } from "@/lib/utils";
import { PublicPage, PublicPageContent, PublicPageHero } from "@/components/public-page-shell";
import {
  FileTextIcon,
  UserIcon,
  CopyrightIcon,
  BrainCircuitIcon,
  ShieldAlertIcon,
  DatabaseIcon,
  FileEditIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  BanIcon,
} from "lucide-react";

const termsDescription =
  "Read the terms for using RealDoor's synthetic application-readiness workflow, including acceptable use, output limits, data processing, and renter control.";

export const metadata: Metadata = constructMetadata({
  title: "Terms of Service",
  description: termsDescription,
  alternates: {
    canonical: "/terms",
  },
});

const termsPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Terms of Service",
  description: termsDescription,
  url: `${CANONICAL_SITE_URL}/terms`,
  dateModified: "2026-07-19",
  isPartOf: {
    "@type": "WebSite",
    name: siteConfig.name,
    url: CANONICAL_SITE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    url: CANONICAL_SITE_URL,
  },
};

function SectionIcon({ icon: Icon }: { icon: typeof FileTextIcon }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  id,
}: {
  icon: typeof FileTextIcon;
  title: string;
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3" id={id}>
      <SectionIcon icon={icon} />
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle2Icon className="mt-1 h-4 w-4 shrink-0 text-primary" />
      <span className="text-sm leading-relaxed text-muted-foreground">{children}</span>
    </li>
  );
}

export default function TermsPage() {
  return (
    <PublicPage>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsPageSchema) }}
      />

      <PublicPageHero
        eyebrow="Legal"
        title="Terms of Service"
        meta="Last updated: July 19, 2026"
        description="The terms for using RealDoor's synthetic application-readiness workflow, including acceptable use, output limits, data processing, and renter control."
      />

      <PublicPageContent className="space-y-16">
        <section>
          <SectionHeading icon={FileTextIcon} title="1. Acceptance and Service Scope" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            By accessing RealDoor or creating an account, you agree to these Terms and our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            . RealDoor is a research prototype that helps renters rehearse an affordable-housing
            application using synthetic or test documents.
          </p>
          <div className="flex items-start gap-3 rounded-xl border border-status-warning/40 bg-status-warning/10 p-4">
            <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
            <p className="text-sm font-medium text-foreground">
              RealDoor is an application-readiness aid, not a housing provider, screening service,
              law firm, or government agency. It does not provide legal advice or decide whether
              anyone qualifies for housing.
            </p>
          </div>
        </section>

        <section>
          <SectionHeading icon={UserIcon} title="2. Your Responsibilities" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            You may use RealDoor only for synthetic or authorized test data. Do not upload real
            applicant documents, real Social Security numbers, financial records, identification,
            health information, or other real personal data.
          </p>
          <ul className="space-y-3">
            <ListItem>
              Review extracted facts, source citations, calculations, checklist items, and packet
              content before relying on or downloading them.
            </ListItem>
            <ListItem>
              Check current requirements with the relevant property, housing program, or qualified
              professional.
            </ListItem>
            <ListItem>
              Keep your account secure and promptly notify us of suspected unauthorized access.
            </ListItem>
            <ListItem>
              Do not misuse the service, probe for vulnerabilities, bypass access controls, disrupt
              other users, upload malicious files, or use automated access without permission.
            </ListItem>
          </ul>
        </section>

        <section>
          <SectionHeading icon={BanIcon} title="3. What RealDoor Does Not Do" />
          <ul className="space-y-3">
            <ListItem>
              RealDoor does not approve, deny, accept, or reject a housing application.
            </ListItem>
            <ListItem>
              RealDoor does not determine eligibility, score or rank renters, predict acceptance,
              recommend properties, or perform tenant screening.
            </ListItem>
            <ListItem>
              Checklist labels describe the current practice session only; they are not a judgment
              about a person or a guarantee that an application is complete.
            </ListItem>
            <ListItem>
              RealDoor does not submit or automatically send documents or packets to a landlord,
              property, housing program, or other recipient.
            </ListItem>
          </ul>
        </section>

        <section className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <SectionIcon icon={BrainCircuitIcon} />
            <h2 className="text-2xl font-semibold text-foreground">
              4. Automated Output and Rules
            </h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            RealDoor uses automated processing to read practice documents and suggest a limited set
            of facts. It also uses a frozen demonstration rule set for cited explanations and
            deterministic calculations. You acknowledge that:
          </p>
          <ul className="space-y-3">
            <ListItem>
              Document reading and extracted values may be incomplete or wrong. Suggested values are
              not treated as confirmed until you review them.
            </ListItem>
            <ListItem>
              Rule citations and explanations may be incomplete, outdated, or inapplicable to a real
              property or program.
            </ListItem>
            <ListItem>
              Calculations depend on the confirmed facts and demonstration rules available in the
              session.
            </ListItem>
            <ListItem>
              A packet preview may omit information or include mistakes. You control whether to
              download or use it.
            </ListItem>
          </ul>
          <p className="mt-6 text-sm font-semibold text-foreground">
            A qualified human at the relevant property or program—not RealDoor—makes any real
            application decision.
          </p>
        </section>

        <section>
          <SectionHeading
            icon={DatabaseIcon}
            title="5. Data Processing and Deletion"
            id="data-processing"
          />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            To provide the service, RealDoor stores and processes account information, synthetic
            practice documents, extracted and confirmed facts, rule questions, calculations,
            checklist state, and packet selections. Text extracted from some documents may be
            processed by OpenAI. Other providers support hosting, storage, authentication, email,
            security, and public-page analytics as described in our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You can delete individual documents, readiness sessions, or your account on demand.
            Deletion removes the corresponding data from RealDoor&apos;s active systems, subject to
            limited provider backups, security logs, and legal retention obligations. Copies you
            download remain under your control.
          </p>
        </section>

        <section>
          <SectionHeading icon={CopyrightIcon} title="6. Ownership and License" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            RealDoor and its licensors own the service, software, design, branding, and related
            materials. We grant you a limited, revocable, non-exclusive, non-transferable license to
            use the service for its intended research, demonstration, or evaluation purpose while
            these Terms apply.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You retain any rights you have in content you provide. You give RealDoor permission to
            host, process, reproduce, and display that content only as needed to operate, secure,
            and support the service.
          </p>
        </section>

        <section>
          <SectionHeading
            icon={ShieldAlertIcon}
            title="7. Availability, Disclaimers, and Liability"
          />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            RealDoor is provided on an “as is” and “as available” basis. We do not guarantee
            uninterrupted availability, error-free output, complete document extraction, current
            housing requirements, or any application outcome.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To the maximum extent permitted by applicable law, RealDoor and its suppliers are not
            liable for indirect, incidental, special, consequential, or punitive damages, or for
            losses caused by reliance on automated output, use of a downloaded packet, service
            interruption, or unauthorized access. Nothing in these Terms excludes liability that
            cannot legally be limited. You remain responsible for how you use any output.
          </p>
        </section>

        <section>
          <SectionHeading icon={FileEditIcon} title="8. Suspension, Changes, and Contact" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            We may suspend or end access when needed to protect the service, comply with law,
            address misuse, or discontinue the prototype. You may stop using RealDoor and delete
            your account at any time.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update these Terms by posting a revised version and changing the date above. If a
            change is material, we will provide additional notice when appropriate. Questions may be
            sent to{" "}
            <a href={`mailto:${siteConfig.links.email}`} className="text-primary hover:underline">
              {siteConfig.links.email}
            </a>
            .
          </p>
        </section>
      </PublicPageContent>
    </PublicPage>
  );
}
