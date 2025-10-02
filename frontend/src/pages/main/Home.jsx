import React from "react";
import { Hero } from "@/features/portfolio/ui/Hero";
import Features from "@/features/portfolio/ui/Features";
import SpotlightCard from "@/features/portfolio/ui/SpotlightCard";
import { Platforms } from "@/features/portfolio/ui/Platforms";
import { LogosQueue } from "@/features/portfolio/ui/LogosQueue";
import { AdvertisementLayout } from "@/features/portfolio/ui/AdvertisementLayout";
import { PopularCourses } from "@/features/portfolio/ui/PopularCourses";
import Footer from "@/widgets/Footer/Footer";



export default function Home() {

  return (
    <main className="bg-white text-[#0b1220]">
      <Hero />
      <PopularCourses />
      <Features />
      <SpotlightCard />
      {/* <LogosQueue logos={["/logos/supabase.svg","/logos/tailscale.svg", "/logos/upstash.svg"]} speedSeconds={50} /> */}
      <Platforms />
      <AdvertisementLayout />
      <Footer />
    </main>
  );
}