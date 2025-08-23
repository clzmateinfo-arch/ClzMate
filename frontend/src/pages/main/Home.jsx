import React from "react";
import { Hero } from "@/features/portfolio/ui/Hero";
import Features from "../../features/portfolio/ui/Features";
import SpotlightCard from "../../features/portfolio/ui/SpotlightCard";
import { Platforms } from "../../features/portfolio/ui/Platforms";
import { LogosQueue } from "../../features/portfolio/ui/LogosQueue";
import { AdvertisementLayout } from "../../features/portfolio/ui/AdvertisementLayout";
import { PopularCourses } from "../../features/portfolio/ui/PopularCourses";
import Footer from "../../widgets/Footer/Footer";



export default function Home() {

  return (
    <main className="bg-white text-[#0b1220]">
      <Hero />
      <PopularCourses />
      <Features />
      <SpotlightCard />
      <Platforms />
      {/* <LogosQueue logos={["/logos/supabase.svg","/logos/tailscale.svg", "/logos/upstash.svg"]} speedSeconds={50} /> */}
      <AdvertisementLayout />
      <Footer />
    </main>
  );
}






{/* 
  
  

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
  
  <section className="relative bg-white overflow-hidden">
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