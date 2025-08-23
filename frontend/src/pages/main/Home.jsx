import React from "react";
import { Hero } from "../../features/portfolio/ui/Hero";
import { Features } from "../../features/portfolio/ui/Features";
import { LogosQueue } from "../../features/portfolio/ui/LogosQueue";
import { Platforms } from "../../features/portfolio/ui/Platforms";
import { SpotlightCard } from "../../features/portfolio/ui/SpotlightCard";
import { AdvertisementLayout } from "../../features/portfolio/ui/AdvertisementLayout";
import Footer from "../../widgets/Footer/Footer";

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

export default function Home() {
  const heroBg = "/src/shared/assets/images/porfolio/cloud-city.png";
  const heroAvif = "/src/shared/assets/images/porfolio/cloud-city.avif";
  const spotlightImg = "/images/fireball.png";

  return (
    <main className="bg-white text-[#0b1220]">
      <section className="relative flex flex-col pt-[70px] -mt-24 h-[720px] md:h-[820px] lg:h-[900px] pb-[200px] lg:pb-[268px] overflow-hidden">
        <Hero />
      </section>

      {/* <section className="relative bg-white overflow-hidden">
        <Features />
      </section>

      <section className="relative bg-white overflow-hidden">
        <SpotlightCard img={spotlightImg} title={"Introducing Phoenix.new — The Remote AI Runtime for Phoenix"} text={"Describe your app, and watch it take shape. Prototype quickly, experiment freely, and share instantly."} ctaHref={'/phoenix.new'} />
      </section>

      <section className="relative bg-white">
        <LogosQueue logos={logos} />
      </section>

      <section className="relative py-16 lg:py-24 xl:py-32 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white overflow-hidden">
        <Platforms platforms={platforms} />
      </section>

      <section className="relative bg-white py-16 lg:py-24">
        <AdvertisementLayout />
      </section>

      <Footer /> */}
    </main>
  );
}
