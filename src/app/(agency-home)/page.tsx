import Image from "next/image";
import Link from "next/link";

import Logo from "@/components/logo";
import Footer from "@/components/sections/footer";
import { constructMetadata } from "@/lib/utils";

const heroVideoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_134434_5de46cb4-38e7-42a6-a8bc-6e62b2fd6c7b.mp4";

const workflowHighlights = [
  {
    title: "Confirm the facts",
    description: "Review every source value.",
  },
  {
    title: "Understand the rule",
    description: "See citations and clear math.",
  },
  {
    title: "Control the packet",
    description: "Preview, download, and delete.",
  },
] as const;

const metrics = [
  { value: "3 stages", label: "profile to packet" },
  { value: "1 trail", label: "evidence at every step" },
  { value: "0 scores", label: "no eligibility decisions" },
] as const;

export const metadata = constructMetadata({
  title: "Affordable Housing Application-Readiness Copilot",
  description:
    "Turn synthetic household documents into confirmed facts, cited rule explanations, clear calculations, and a renter-controlled application packet.",
  alternates: {
    canonical: "/",
  },
});

function AnimatedText({
  as: Component = "p",
  text,
  className,
}: {
  as?: "h1" | "h2" | "p";
  text: string;
  className?: string;
}) {
  const words = text.split(" ");

  return (
    <Component aria-label={text} className={className}>
      {words.map((word, index) => (
        <span
          aria-hidden="true"
          className="inline-block opacity-0 animate-fadeUp motion-reduce:animate-none motion-reduce:opacity-100"
          key={`${word}-${index}`}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationFillMode: "forwards",
          }}
        >
          {word}
          {index < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </Component>
  );
}

export default function Home() {
  return (
    <>
      <main className="public-site-font-system public-landing-surface min-h-screen public-landing-ink">
        <section className="public-landing-surface relative overflow-hidden pb-0">
          <video
            aria-hidden="true"
            autoPlay
            className="absolute inset-x-0 top-0 h-[84vh] w-full object-cover object-bottom"
            loop
            muted
            playsInline
            preload="metadata"
            src={heroVideoUrl}
          />
          <div className="public-landing-media-fade pointer-events-none absolute inset-x-0 top-[calc(84vh-2rem)] h-8" />

          <nav className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 lg:px-20">
            <Link
              aria-label="RealDoor home"
              className="public-landing-ink flex items-center"
              href="/"
            >
              <Logo
                alt="RealDoor"
                className="h-5 w-auto sm:h-7"
                surface="light"
                variant="horizontal"
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                className="public-auth-link px-1 text-sm font-semibold transition-colors sm:px-2"
                href="/sign-in"
              >
                Log in
              </Link>
              <Link
                className="public-button-primary rounded-2xl px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4 sm:py-2.5"
                href="/sign-up"
              >
                Sign up
              </Link>
            </div>
          </nav>

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-8 pt-10 text-center sm:px-6 md:px-12 md:pt-10 lg:px-20">
            <AnimatedText
              as="h1"
              className="public-display-tight max-w-[20rem] text-[2.75rem] font-normal leading-[0.92] sm:max-w-3xl sm:text-5xl md:max-w-5xl md:text-6xl lg:text-7xl"
              text="Build an application packet you understand and control."
            />
            <AnimatedText
              className="public-landing-muted mt-5 max-w-[21rem] text-base leading-7 sm:max-w-3xl sm:text-lg md:text-xl"
              text="RealDoor turns synthetic household documents into confirmed facts, cited rules, clear calculations, and a packet you preview and download yourself."
            />

            <div className="mt-7 flex w-full max-w-[21rem] justify-center">
              <Link
                className="public-button-primary-strong inline-flex h-12 items-center justify-center rounded-2xl px-7 text-sm font-bold ring-1 ring-primary/10 transition-colors sm:h-14 sm:px-10 sm:text-base"
                href="/sign-up"
              >
                Start your session
              </Link>
            </div>

            <div className="public-landing-media-frame mt-8 aspect-[2830/1594] w-full max-w-[21rem] overflow-hidden rounded-2xl sm:max-w-3xl md:max-w-5xl md:rounded-3xl">
              <Image
                alt="RealDoor workflow from confirmed source facts through cited calculations to a renter-controlled PDF packet"
                className="h-full w-full object-cover"
                height={941}
                priority
                sizes="(min-width: 1024px) 64rem, (min-width: 640px) 48rem, 21rem"
                src="/dashboard-workflow.png"
                width={1672}
              />
            </div>

            <div className="public-landing-panel public-on-dark relative -mt-[clamp(1.65rem,8.25vw,5.5rem)] w-full max-w-[23.1rem] rounded-[clamp(0.55rem,1.265vw,0.9625rem)] border border-white/15 p-[clamp(0.605rem,1.87vw,1.375rem)] text-left sm:max-w-[52.8rem] md:max-w-[70.4rem]">
              <div className="grid grid-cols-[1.16fr_1.16fr_1.16fr_0.84fr_0.84fr_0.84fr] items-start gap-x-[clamp(0.308rem,1.32vw,1.815rem)]">
                {workflowHighlights.map((highlight) => (
                  <div className="min-w-0" key={highlight.title}>
                    <div className="flex h-[clamp(1.265rem,3.41vw,2.475rem)] items-end">
                      <p className="whitespace-nowrap text-[clamp(0.473rem,1.705vw,1.2375rem)] font-semibold leading-none">
                        {highlight.title}
                      </p>
                    </div>
                    <p className="public-on-dark-subtle mt-[clamp(0.198rem,0.495vw,0.385rem)] whitespace-nowrap text-[clamp(0.341rem,1.155vw,0.825rem)] leading-none">
                      {highlight.description}
                    </p>
                  </div>
                ))}
                {metrics.map((metric) => (
                  <div className="min-w-0 text-center" key={metric.label}>
                    <div className="flex h-[clamp(1.265rem,3.41vw,2.475rem)] items-end justify-center">
                      <p className="whitespace-nowrap text-[clamp(0.682rem,2.86vw,2.0625rem)] font-medium leading-none">
                        {metric.value}
                      </p>
                    </div>
                    <p className="public-on-dark-subtle mt-[clamp(0.176rem,0.462vw,0.44rem)] whitespace-nowrap text-[clamp(0.297rem,0.935vw,0.75625rem)] leading-none">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="public-landing-surface px-5 pb-20 pt-4 sm:px-6 md:px-12 md:pb-28 md:pt-10 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 md:items-start">
            <AnimatedText
              as="h2"
              className="public-display-tight public-on-dark max-w-3xl text-4xl font-normal leading-[0.95] sm:text-5xl md:text-6xl"
              text="From document evidence to a packet you control"
            />
            <AnimatedText
              className="public-on-dark-muted max-w-xl text-lg leading-8 md:justify-self-end md:text-right md:text-2xl md:leading-10"
              text="Confirm each fact, inspect the published rule and math, resolve missing items, then preview and download—nothing is decided or sent for you."
            />
          </div>
        </section>
      </main>
      <Footer className="mt-0 border-t-0" />
    </>
  );
}
