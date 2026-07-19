import { Metadata } from "next";
import Link from "next/link";
import { PublicPage, PublicPageContent, PublicPageHero } from "@/components/public-page-shell";
import { CANONICAL_SITE_URL } from "@/constants";
import { cn, constructMetadata } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import {
  ShieldCheckIcon,
  DatabaseIcon,
  GlobeIcon,
  ClockIcon,
  LockIcon,
  CookieIcon,
  ScaleIcon,
  MailIcon,
  UserIcon,
  FileEditIcon,
  CheckCircle2Icon,
  BotIcon,
} from "lucide-react";

const privacyDescription =
  "Learn how RealDoor handles account data, synthetic practice documents, readiness sessions, AI-assisted extraction, analytics, and deletion requests.";

export const metadata: Metadata = constructMetadata({
  title: "Privacy Policy",
  description: privacyDescription,
  alternates: {
    canonical: "/privacy",
  },
});

const privacyPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy",
  description: privacyDescription,
  url: `${CANONICAL_SITE_URL}/privacy`,
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

function SectionIcon({ icon: Icon }: { icon: typeof ShieldCheckIcon }) {
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
  icon: typeof ShieldCheckIcon;
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

export default function PrivacyPage() {
  return (
    <PublicPage>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyPageSchema) }}
      />

      <PublicPageHero
        eyebrow="Legal"
        title="Privacy Policy"
        meta="Last updated: July 19, 2026"
        description="How RealDoor handles account information, synthetic practice documents, readiness sessions, service providers, and your data choices."
      />

      <PublicPageContent className="space-y-16">
        <section>
          <SectionHeading icon={DatabaseIcon} title="1. Information We Collect" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            RealDoor collects the information needed to provide and secure its application-readiness
            experience:
          </p>
          <ul className="space-y-3">
            <ListItem>
              <strong className="text-foreground">Account information:</strong> Your name, email
              address, password hash when you use password sign-in, verification status, and basic
              Google profile information if you choose Google sign-in.
            </ListItem>
            <ListItem>
              <strong className="text-foreground">Practice documents:</strong> Synthetic PDF, JPEG,
              or PNG files you upload, along with file names, types, sizes, document categories,
              processing status, and extracted text or fields.
            </ListItem>
            <ListItem>
              <strong className="text-foreground">Readiness session data:</strong> Your
              confirmations and corrections, saved rule questions, calculations, checklist status,
              packet selections, consent records, rule-set version, and product activity.
            </ListItem>
            <ListItem>
              <strong className="text-foreground">Technical and security data:</strong> Session
              identifiers, IP address, request and error information, and security events used to
              authenticate users, prevent abuse, and keep the service reliable.
            </ListItem>
          </ul>
          <div className="mt-6 rounded-xl border border-status-warning/40 bg-status-warning/10 p-4">
            <p className="text-sm font-medium text-foreground">
              RealDoor is a research prototype for synthetic or test data. Do not upload real
              applicant documents or other real personal information.
            </p>
          </div>
        </section>

        <section>
          <SectionHeading icon={UserIcon} title="2. How We Use Information" />
          <ul className="space-y-3">
            <ListItem>
              Authenticate your account and protect the service from fraud, spam, and unauthorized
              access.
            </ListItem>
            <ListItem>
              Run the Profile → Understand → Prepare workflow, including document reading,
              allowlisted field extraction, renter confirmation, cited rule explanations,
              deterministic calculations, checklists, and packet previews.
            </ListItem>
            <ListItem>
              Let you download a renter-controlled packet, export available account data, delete
              documents or sessions, and manage your account.
            </ListItem>
            <ListItem>
              Send verification, password-reset, security, and service messages and respond to
              support requests.
            </ListItem>
            <ListItem>
              Measure and improve public-site performance and diagnose product errors.
            </ListItem>
          </ul>
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              <strong>Product boundary:</strong> RealDoor does not approve or deny housing
              applications, determine eligibility, score or rank renters, predict acceptance, or
              automatically send a packet to a property or housing program.
            </p>
          </div>
        </section>

        <section>
          <SectionHeading icon={BotIcon} title="3. Document and AI Processing" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            RealDoor may extract text from a synthetic practice document and send that text to
            OpenAI to identify a limited set of fields. The original file is not sent to OpenAI by
            this workflow. Automated results can be incomplete or wrong, so extracted values remain
            unconfirmed until you review and confirm or correct them.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            RealDoor uses your practice content to provide the requested workflow. Provider handling
            is also governed by the applicable provider terms and settings; this policy does not
            promise that every provider copy or log is deleted at the same moment as data held in
            RealDoor&apos;s active systems.
          </p>
        </section>

        <section>
          <SectionHeading icon={GlobeIcon} title="4. Service Providers" id="data-processors" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            We use service providers to operate RealDoor. Depending on the feature you use,
            information may be processed by:
          </p>
          <ul className="space-y-3">
            <ListItem>
              <strong className="text-foreground">Cloudflare</strong> for hosting, storage,
              databases, authentication sessions, and bot protection.
            </ListItem>
            <ListItem>
              <strong className="text-foreground">OpenAI</strong> for AI-assisted extraction from
              text in synthetic practice documents.
            </ListItem>
            <ListItem>
              <strong className="text-foreground">Google</strong> when you choose Google sign-in.
            </ListItem>
            <ListItem>
              <strong className="text-foreground">Resend</strong> for transactional email, plus
              email-validation services that may check an address during sign-up.
            </ListItem>
            <ListItem>
              <strong className="text-foreground">
                Ahrefs and a Convex-hosted analytics service
              </strong>{" "}
              for analytics on public pages. These scripts are not loaded on dashboard, settings, or
              authentication pages.
            </ListItem>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            These providers may process information in countries other than the one where you live.
            We may also disclose information when required by law, to protect users or the service,
            or as part of a business transaction subject to appropriate safeguards.
          </p>
        </section>

        <section>
          <SectionHeading icon={ClockIcon} title="5. Retention and Deletion" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            We keep account and readiness-session information until you delete the relevant
            document, session, or account, or until it is no longer needed for security, legal, or
            operational purposes. RealDoor does not promise an automatic, time-based purge of
            readiness data.
          </p>
          <ul className="space-y-3">
            <ListItem>
              Deleting a document removes its active stored file and linked readiness records.
            </ListItem>
            <ListItem>
              Deleting a readiness session removes its active stored uploads and linked facts,
              questions, calculations, checklist state, packet state, and session activity records.
            </ListItem>
            <ListItem>
              Deleting your account removes active account records, readiness sessions, stored
              uploads, and active authentication sessions.
            </ListItem>
            <ListItem>
              Downloaded packets or exports remain on your device and under your control.
            </ListItem>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Deletion from active RealDoor systems may not immediately remove limited records
            retained in provider backups, security logs, or where retention is required by law.
          </p>
        </section>

        <section className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <SectionIcon icon={LockIcon} />
            <h2 className="text-2xl font-semibold text-foreground">6. Security</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            RealDoor applies technical and organizational safeguards designed to protect
            information. Uploaded file contents and sensitive readiness fields are encrypted by the
            application before storage, and access-controlled routes check that a signed-in user
            owns the requested session.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            No system is completely secure. Keep your credentials private, use only synthetic
            practice documents, and contact us if you believe your account has been compromised.
          </p>
        </section>

        <section>
          <SectionHeading icon={CookieIcon} title="7. Cookies and Analytics" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            RealDoor uses cookies and similar browser storage needed for sign-in, session security,
            CSRF protection, Google sign-in, and access-gate state. Disabling them may prevent parts
            of the service from working.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Public pages load Ahrefs Analytics and a Convex-hosted analytics script. RealDoor
            suppresses these public analytics scripts on dashboard, settings, sign-in, sign-up,
            verification, password-reset, and single-sign-on routes.
          </p>
        </section>

        <section>
          <SectionHeading icon={ScaleIcon} title="8. Your Choices and Rights" />
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            RealDoor provides controls to correct or confirm extracted facts, remove individual
            documents, delete a readiness session, export available account and session data, and
            delete your account. An account export does not include the original uploaded files;
            those remain available separately until you delete them.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Depending on where you live, applicable law may also give you rights to request access,
            correction, deletion, portability, restriction, or objection, and to complain to a
            privacy regulator. To make a request, email{" "}
            <a href={`mailto:${siteConfig.links.email}`} className="text-primary hover:underline">
              {siteConfig.links.email}
            </a>
            . We may need to verify your identity before completing a request.
          </p>
        </section>

        <section>
          <SectionHeading icon={FileEditIcon} title="9. Changes to This Policy" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update this policy as RealDoor changes. We will post the revised policy here and
            update the date above. If a change materially affects how we handle information, we will
            provide additional notice when appropriate.
          </p>
        </section>

        <section className="pb-4">
          <div className="mb-4 flex items-center gap-3">
            <SectionIcon icon={MailIcon} />
            <h2 className="text-2xl font-semibold text-foreground">10. Contact Us</h2>
          </div>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            For questions about this policy or a data request, contact{" "}
            <a href={`mailto:${siteConfig.links.email}`} className="text-primary hover:underline">
              {siteConfig.links.email}
            </a>
            .
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
              Return to Home
            </Link>
            <Link href="/terms" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Terms of Service
            </Link>
          </div>
        </section>
      </PublicPageContent>
    </PublicPage>
  );
}
