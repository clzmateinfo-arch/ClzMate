import React, { useState } from "react";
import { Link } from "react-router-dom";

// local project imports used by the added sections
import { HomePageExplore } from "@/app/config/homepage-explore";
import CourseCard from "@/shared/components/ui/CourseCard";
import HighlightText from "@/shared/components/ui/HighlightText";
import CTAButton from "@/shared/components/ui/Button";
import Img from "@/shared/components/ui/Img";
import Instructor from "@/shared/assets/images/teacher3.png";
import know_your_progress from "@/shared/assets/images/Know_your_progress.png";
import compare_with_others from "@/shared/assets/images/Compare_with_others.png";
import plan_your_lesson from "@/shared/assets/images/Plan_your_lessons.png";
import Logo1 from "@/shared/assets/images/Logo1.svg";
import Logo2 from "@/shared/assets/images/Logo2.svg";
import Logo3 from "@/shared/assets/images/Logo3.svg";
import Logo4 from "@/shared/assets/images/Logo4.svg";
import timelineImage from "@/shared/assets/images/TimelineImage.png";
import { motion } from "framer-motion";
import { fadeIn, scaleUp } from "@/shared/utils/motionFrameVarients";

/**
 * Refactored Home page: central file that exports small presentational components and
 * the default Home component. All styling uses Tailwind utility classes only.
 *
 * Components included (exported for reuse):
 * - CTA
 * - IconBox
 * - FeatureItem
 * - LogosMarquee
 * - PlatformsGrid
 * - SpotlightCard
 * - ManagedPostgresSection
 * - FeaturesGrid
 * - Hero
 * - Home (default)
 *
 * Put required images in /public/images/ (see previous instructions).
 */

/* ------------------
   Small UI primitives
   ------------------ */

export function CTA({ children, to = "/app/sign-up", variant = "primary", className = "" }) {
  const base = "inline-flex items-center gap-3 rounded-full px-6 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition";
  const primary = "bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white shadow-md hover:opacity-95 focus:ring-[#996bec]";
  const light = "bg-white/6 text-white/95 border border-white/10 hover:bg-white/5 focus:ring-white/40";

  return (
    <Link
      to={to}
      className={`${base} ${variant === "primary" ? primary : light} ${className} group`}
      aria-label={typeof children === "string" ? children : "Call to action"}
    >
      <span className="text-sm md:text-base">{children}</span>
      <span className="ml-3 flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          className="transform transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M4 8h8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}

export function IconBox({ children, colorClass = "emerald" }) {
  const gradients = {
    emerald: "from-green-300/50 to-emerald-300/50 text-emerald-500 ring-emerald-500/30 shadow-emerald-500/30",
    blue: "from-sky-300/50 to-blue-300/50 text-blue-500 ring-blue-500/30 shadow-blue-500/30",
    orange: "from-orange-200/50 to-orange-500/40 text-orange-500 ring-orange-500/35 shadow-orange-500/30",
    amber: "from-yellow-200/75 to-orange-200/75 text-amber-500 ring-amber-400/60 shadow-amber-500/30",
  };
  const cls = gradients[colorClass] || gradients.emerald;

  return (
    <div className={`flex justify-center items-center shrink-0 rounded-xl w-12 h-12 ring-1 shadow-xl bg-gradient-to-br ${cls}`} aria-hidden>
      {children}
    </div>
  );
}

export function FeatureItem({ title, children, color = "emerald" }) {
  return (
    <li className="group w-full relative grid grid-cols-[auto_1fr] items-start gap-6 text-left">
      <IconBox colorClass={color}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="9" />
        </svg>
      </IconBox>
      <div>
        <h3 className="font-semibold text-lg text-[#0b1220]">{title}</h3>
        <p className="mt-3 text-base text-[#374151]">{children}</p>
      </div>
    </li>
  );
}

/* ------------------
   Logos marquee (simple)
   ------------------ */
export function LogosMarquee({ logos = [], speedSeconds = 40 }) {
  // Duplicate the list to create a seamless scroll effect.
  // Uses Tailwind JIT arbitrary animation. If JIT is disabled, you can provide a small style tag instead.
  const animation = `marquee_${speedSeconds}s`;

  return (
    <div className="relative overflow-hidden select-none py-6">
      <div className={`flex gap-8 will-change-transform animate-[${animation}_linear_infinite]`} style={{ minWidth: "200%" }}>
        {[...logos, ...logos].map((src, i) => (
          <a key={i} href="#" className="flex-none p-4 lg:px-6 rounded-full hover:scale-105 transition-transform" aria-hidden={i >= logos.length}>
            <img src={src} alt="" className="h-6 md:h-8 object-contain" width="120" height="28" loading="lazy" />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ------------------
   Platforms grid
   ------------------ */
export function PlatformsGrid({ platforms = [] }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-5">
      {platforms.map((p) => (
        <li key={p.name}>
          <a href="#" className="h-full grid place-items-center px-4 py-8 rounded-2xl bg-white/6 hover:scale-105 transform transition" aria-label={p.name}>
            <img src={p.src} alt={p.name} className="max-w-full h-8 object-contain" loading="lazy" width="150" height="28" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ------------------
   Spotlight / Promo card
   ------------------ */
export function SpotlightCard({ img, title, text, ctaText = "Learn More", ctaHref = "#" }) {
  return (
    <div className="grid lg:grid-cols-7 items-center gap-x-8 gap-y-4 px-6 md:px-12 py-6 rounded-3xl bg-gradient-to-br from-[#2b0b3a]/70 via-[#0b1220]/50 to-[#000000]/10 ring-1 ring-violet-400/10 border border-black/10">
      <div className="lg:order-last lg:col-span-3 lg:-mr-9 -mb-6 lg:mb-0">
        <img src={img} alt="Spotlight" width="400" className="w-full max-w-lg mx-auto object-contain" loading="lazy" />
      </div>

      <div className="space-y-4 py-6 md:py-10 lg:py-12 xl:py-20 lg:col-span-4">
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white bg-gradient-to-br from-orange-400 to-orange-600 ring-1 ring-orange-400">NEW!</span>
        <h2 className="text-2xl md:text-3xl font-semibold text-white -mt-1">{title}</h2>
        <p className="text-lg text-white/80 pb-3">{text}</p>
        <div className="flex gap-4">
          <CTA to={ctaHref} variant="primary">{ctaText}</CTA>
        </div>
      </div>
    </div>
  );
}

/* ------------------
   Managed Postgres section
   ------------------ */
export function ManagedPostgresSection({ img = "/images/managed-postgres.png" }) {
  return (
    <section className="relative bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-x-8 items-center">
        <img src={img} alt="Managed Postgres" width="400" className="w-full max-w-sm mx-auto mb-6 lg:mb-0 object-contain" loading="lazy" />
        <div className="space-y-3">
          <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold text-emerald-700 bg-gradient-to-br from-green-300/50 to-emerald-300/50 ring-1 ring-emerald-500/35">NEW!</span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#0b1220]">Fly.io Managed Postgres</h2>
          <p className="text-lg text-[#374151]">A fully-managed database service that handles all aspects of running production PostgreSQL where we take care of:</p>
          <ul className="space-y-2 mt-4 text-base text-[#374151]">
            <li className="flex items-start gap-3"><span className="text-emerald-500">•</span> Automatic backups and recovery</li>
            <li className="flex items-start gap-3"><span className="text-emerald-500">•</span> High availability with automatic failover</li>
            <li className="flex items-start gap-3"><span className="text-emerald-500">•</span> Performance monitoring and metrics</li>
            <li className="flex items-start gap-3"><span className="text-emerald-500">•</span> Resource scaling (CPU, RAM, storage)</li>
          </ul>
          <div className="mt-6">
            <CTA to="/docs/mpg" variant="primary">Learn More</CTA>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------
   Features grid (serverful JS etc)
   ------------------ */
export function FeaturesGrid() {
  return (
    <section className="relative py-16 lg:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid gap-8 lg:gap-12 xl:gap-20 items-center">
          <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
            <img src="/images/js-love.png" alt="JS Love" className="w-full max-w-md mx-auto object-contain" loading="lazy" />
            <div className="space-y-4 max-w-xl">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#0b1220]">Serverful JavaScript Without the Hassle of Serverless</h2>
              <p className="text-lg text-[#374151]">Imagine if a server could boot as fast as a serverless function? That's Fly Machines—serverless compute is a trade-off you no longer need to make.</p>
            </div>
          </div>

          <ul className="grid lg:grid-cols-3 gap-12 mt-8">
            <li className="group space-y-7">
              <div className="flex justify-center items-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-300/50 to-emerald-300/50 ring-1 shadow-xl text-emerald-500"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" /></svg></div>
              <h3 className="text-lg md:text-xl font-semibold text-[#0b1220]">Boots in 250ms or Less</h3>
              <p className="text-base text-[#374151] mt-3">Functions and apps boot and respond to web requests in 250ms or less with Fly Machines.</p>
            </li>

            <li className="group space-y-7">
              <div className="flex justify-center items-center w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-200/75 to-orange-200/75 ring-1 shadow-xl text-amber-500"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" /></svg></div>
              <h3 className="text-lg md:text-xl font-semibold text-[#0b1220]">Built for JavaScript Developers</h3>
              <p className="text-base text-[#374151] mt-3">JavaScript, TypeScript, Bun, Deno—whatever your flavor, Fly Launch automatically detects your runtime and generates a VM with everything you need to run your app.</p>
            </li>

            <li className="group space-y-7">
              <div className="flex justify-center items-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-300/50 to-blue-300/50 ring-1 shadow-xl text-blue-500"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" /></svg></div>
              <h3 className="text-lg md:text-xl font-semibold text-[#0b1220]">Real GPUs & CPUs on the Edge</h3>
              <p className="text-base text-[#374151] mt-3">Run workloads that require GPUs or lots of CPUs, memory, and storage in over 30 regions around the world.</p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------
   Hero component (uses CTA)
   ------------------ */
export function Hero({ heroBg = "/images/cloud-city.png", heroAvif = "/images/cloud-city.avif", globeImg = "/images/fly-globe.png" }) {
  return (
    <header className="relative flex flex-col pt-[70px] -mt-24 h-[720px] md:h-[820px] lg:h-[900px] pb-[200px] lg:pb-[268px] overflow-hidden">
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 lg:translate-x-0 z-0 pointer-events-none" aria-hidden="true">
        <picture>
          <source srcSet={heroAvif} type="image/avif" />
          <img src={heroBg} alt="" width="1440" className="w-[1200px] lg:w-[1750px] 3xl:w-full max-w-[2000px] h-auto object-contain" loading="lazy" />
        </picture>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="relative flex flex-col items-start sm:items-center sm:text-center max-w-3xl mx-auto">
          <h1 className="font-extrabold text-[34px] sm:text-[40px] md:text-[48px] lg:text-[64px] leading-[1.08] sm:leading-[1.12] tracking-[-0.025em] text-[#0b1220] mb-5 -mt-4">
            A Public Cloud Built For <br className="hidden lg:block" /> Developers Who <em className="relative inline-block">Ship</em>
          </h1>

          <p className="text-base md:text-lg tracking-normal mb-9 max-w-[46.875rem] text-[#374151]">
            <strong className="text-[#0b1220]">Over 3 million apps</strong> have launched on Fly.io, leveraging global Anycast load-balancing, zero-config private networking, hardware isolation, instant WireGuard VPN connections, and push-button deployments scaling to thousands of instances.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <CTA to="/app/sign-up">Deploy Your App in 5 minutes</CTA>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------
   Additional content sections (ExploreMore, InstructorSection, LearningLanguageSection, TimelineSection)
   ------------------ */

export function ExploreMore() {
  const tabsName = ["Free","New to coding","Most popular","Skills paths","Career paths"];
  const [currentTab, setCurrentTab] = useState(tabsName[0]);
  const [courses, setCourses] = useState(HomePageExplore[0]?.courses || []);
  const [currentCard, setCurrentCard] = useState(HomePageExplore[0]?.courses[0]?.heading || "");

  const setMyCards = (value) => {
    setCurrentTab(value);
    const result = HomePageExplore.filter((course) => course.tag === value);
    if (result[0]) {
      setCourses(result[0].courses);
      setCurrentCard(result[0].courses[0].heading);
    }
  };

  return (
    <section className="relative bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-3xl lg:text-4xl font-semibold text-center mb-6">
          Unlock the <HighlightText text={"Power of Code"} />
          <p className="text-center text-[#6b7280] text-base lg:text-lg font-semibold mt-1">Learn to Build Anything You Can Imagine</p>
        </div>

        <div className="hidden lg:flex gap-5 -mt-5 mx-auto w-max bg-[#0f1724] text-[#e6eef8] p-1 rounded-full font-medium shadow-md">
          {tabsName.map((ele, index) => (
            <button
              key={index}
              onClick={() => setMyCards(ele)}
              className={`text-[16px] flex items-center gap-2 ${currentTab === ele ? "bg-[#071029] text-white" : "text-[#cbd5e1]"} px-6 py-2 rounded-full transition-all duration-200`}
            >
              {ele}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6 lg:gap-10">
          {courses.map((ele, index) => (
            <div key={index} className="w-full sm:w-1/2 md:w-1/3 lg:w-[30%]">
              <CourseCard cardData={ele} currentCard={currentCard} setCurrentCard={setCurrentCard} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InstructorSection() {
  return (
    <section className="relative bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row gap-10 lg:gap-20 items-center">
          <motion.div variants={scaleUp} initial="hidden" whileInView={"show"} viewport={{ once: false, amount: 0.1 }} className="lg:w-1/2">
            <Img src={Instructor} alt="Instructor" className="shadow-white rounded-3xl object-contain" />
          </motion.div>

          <div className="lg:w-1/2 flex flex-col">
            <div className="text-3xl lg:text-4xl font-semibold mb-2">
              Become an <HighlightText text={"Instructor"} />
            </div>

            <p className="font-medium text-[16px] text-[#374151] mb-8">Instructors from around the world teach millions of students on ClzMate. We provide the tools and skills to teach what you love.</p>

            <div className="w-fit">
              <CTAButton active={true} linkto={'/signup'}>
                <div className="flex items-center gap-2">Start Teaching <span className="ml-1">→</span></div>
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LearningLanguageSection() {
  return (
    <section className="relative bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-3xl lg:text-4xl font-semibold">
          Your Swiss Knife for <HighlightText text={" learning any language"} />
        </div>

        <div className="mt-4 lg:text-center text-[#6b7280] mx-auto text-base font-medium lg:w-[70%]">Using spin making learning multiple languages easy — with 20+ languages, realistic voice-over, progress tracking, custom schedule and more.</div>

        <div className="flex flex-col lg:flex-row items-center justify-center mt-8 gap-6">
          <img src={know_your_progress} alt="Know your progress" className="object-contain max-w-xs" />
          <img src={compare_with_others} alt="Compare with others" className="object-contain max-w-xs" />
          <img src={plan_your_lesson} alt="Plan your lessons" className="object-contain max-w-xs" />
        </div>

        <div className="mt-8">
          <CTAButton active={true} linkto={'/signup'}>
            <div>Learn more</div>
          </CTAButton>
        </div>
      </div>
    </section>
  );
}

export function TimelineSection() {
  const timeline = [
    { Logo: Logo1, heading: "Leadership", Description: "Fully committed to the success company" },
    { Logo: Logo2, heading: "Responsibility", Description: "Students will always be our top priority" },
    { Logo: Logo3, heading: "Flexibility", Description: "The ability to switch is an important skills" },
    { Logo: Logo4, heading: "Solve the problem", Description: "Code your way to a solution" },
  ];

  return (
    <section className="relative bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <motion.div variants={fadeIn("right", 0.1)} initial="hidden" whileInView={"show"} viewport={{ once: false, amount: 0.1 }} className="w-full lg:w-1/2 flex flex-col gap-6">
            {timeline.map((el, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-[50px] h-[50px] rounded-full bg-[#0ea5a9] flex justify-center items-center">
                  <img src={el.Logo} alt="" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className="font-semibold text-[18px]">{el.heading}</h3>
                  <p className="text-base text-[#374151]">{el.Description}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeIn("left", 0.1)} initial="hidden" whileInView={"show"} viewport={{ once: false, amount: 0.1 }} className="relative w-full lg:w-1/2">
            <img src={timelineImage} alt="timeline" className="w-full max-w-[550px] mx-auto object-cover" />

            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0b7f73] text-white uppercase py-5 px-6 rounded-3xl flex gap-8">
              <div className="flex items-center gap-4 border-r border-[#057f71] pr-4">
                <p className="text-2xl font-bold">10</p>
                <p className="text-xs text-[#c7fff6]">Years of Experience</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-2xl font-bold">250</p>
                <p className="text-xs text-[#c7fff6]">Type of Courses</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

  const heroBg = "/images/cloud-city.png";
  const heroAvif = "/images/cloud-city.avif";
  const globeImg = "/images/fly-globe.png";
  const spotlightImg = "/images/fireball.png";
  const logos = [
    "/images/logo-supabase.png",
    "/images/logo-tailscale.png",
    "/images/logo-tigris.png",
    "/images/logo-upstash.png",
    "/images/logo-turso.png",
    "/images/logo-mailgun.png",
    "/images/logo-fanatics.png",
  ];

  const platforms = [
    { name: "Phoenix", src: "/images/logo-phoenix.png" },
    { name: "SvelteKit", src: "/images/logo-svelte.png" },
    { name: "Rails", src: "/images/logo-rails.png" },
    { name: "Docker", src: "/images/logo-docker.png" },
    { name: "Go", src: "/images/logo-go.png" },
    { name: "Rust", src: "/images/logo-rust.png" },
    { name: "Django", src: "/images/logo-django.png" },
    { name: "Laravel", src: "/images/logo-laravel.png" },
    { name: "NextJS", src: "/images/logo-next.png" },
  ];

  return (
    <main className="bg-white text-[#0b1220]">
      <Hero heroBg={heroBg} heroAvif={heroAvif} globeImg={globeImg} />

      <section className="relative bg-white overflow-hidden">
        <div className="rotate-3 absolute -inset-x-12 -top-6 h-12 bg-gradient-to-r from-sky-300 via-indigo-300 to-pink-300 blur-3xl opacity-60 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-50 via-indigo-50 to-pink-50 opacity-30 pointer-events-none" aria-hidden="true" />

        <div className="relative container mx-auto py-16 xl:py-24 px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 gap-x-8 xl:gap-x-16 items-start">
            <div className="relative max-w-xl space-y-4 lg:pb-20">
              <h2 className="font-semibold text-2xl md:text-3xl lg:text-4xl text-[#0b1220]">Public Cloud Infrastructure. Modern Platform Endorphins.</h2>
              <p className="text-lg text-[#374151]">The most flexible and powerful compute platform on any public cloud. Fly Machines are hardware-virtualized containers, running on our own hardware, that launch instantly and run exactly as long as you want them to — for a single HTTP request, or for weeks of uptime.</p>

              <div className="hidden lg:block w-full h-px absolute bottom-0 bg-gradient-to-r from-[#334155] via-[#334155]/40 to-transparent" aria-hidden />
            </div>

            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <img src={globeImg} alt="Globe visualization" width="400" className="w-full max-w-sm -mb-12 relative lg:-mt-4 object-contain" loading="lazy" />
            </div>
          </div>

          <ul className="grid lg:grid-cols-2 gap-y-12 gap-x-8 xl:gap-x-16 mt-12">
            <FeatureItem title="Get Right in Your Users' Faces" color="emerald">Deploy in 35 regions, from Sydney to São Paulo, for sub-100ms response times and native-app feel no matter where your users are.</FeatureItem>
            <FeatureItem title="Fork Off VMs Like They're Processes" color="blue">Fly Machines start fast enough to handle HTTP requests, run only when you need them, and scale into tens of thousands of instances.</FeatureItem>
            <FeatureItem title="Ship GPU-Boosted Models" color="orange">From LLMs to inferencing, hardware acceleration with the same developer experience as a simple CRUD app.</FeatureItem>
            <FeatureItem title="Built for Distributed Systems" color="amber">Clustered databases like Cockroach, globally-distributed Postgres, and modern RPC systems — no Terraform required.</FeatureItem>
          </ul>
        </div>
      </section>

      <section className="relative bg-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SpotlightCard img={spotlightImg} title={"Introducing Phoenix.new — The Remote AI Runtime for Phoenix"} text={"Describe your app, and watch it take shape. Prototype quickly, experiment freely, and share instantly."} ctaHref={'/phoenix.new'} />
        </div>
      </section>

      <section className="relative bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="sr-only">Trusted by teams</h3>
          <LogosMarquee logos={logos} />
        </div>
      </section>

      <section className="relative py-16 lg:py-24 xl:py-32 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid gap-8 lg:gap-12 xl:gap-20 items-center grid-cols-2">
            <div className="relative max-w-xl space-y-6">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold">Use the Tech You Love</h2>
              <p className="text-lg text-white/80">Build with your favorite framework. No Dockerfile? No problem: our CLI generates containers for most popular frameworks.</p>
              <div className="flex gap-3 mt-4">
                <CTA to="/docs/speedrun" variant="light">Learn More</CTA>
              </div>
            </div>

            <div className="w-full">
              <PlatformsGrid platforms={platforms} />
            </div>
          </div>
        </div>
      </section>

      <ExploreMore />
      <InstructorSection />
      <LearningLanguageSection />
      <TimelineSection />

      <ManagedPostgresSection />

      <FeaturesGrid />
    </main>
  );
}
