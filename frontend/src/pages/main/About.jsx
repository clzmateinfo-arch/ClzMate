/* eslint-disable react/no-unescaped-entities */
import React from "react";

import PageHeader from "@/shared/components/ui/PageHeader";
import Footer from "@/widgets/Footer/Footer";
import HighlightText from "@/shared/components/ui/HighlightText";
import Img from "@/shared/components/ui/Img";

import FoundingStory from "@/shared/assets/images/FoundingStory.png";
import BannerImage1 from "@/shared/assets/images/aboutus1.webp";
import BannerImage2 from "@/shared/assets/images/aboutus2.webp";
import BannerImage3 from "@/shared/assets/images/aboutus3.webp";

import LearningGrid from "@/features/about/ui/LearningGrid";
import ContactFormSection from "@/features/about/ui/ContactFormSection";
import StatsComponenet from "@/features/about/ui/Stats";
import ReviewSlider from "@/shared/components/feedback/ReviewSlider";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-white/8 text-richblack-5 ring-1 ring-white/6">
    {children}
  </span>
);

const TeamMember = ({ name, role, avatar, bio }) => (
  <article className="bg-white/5 rounded-2xl p-4 border border-white/8 shadow-sm">
    <div className="flex items-start gap-4">
      <Img src={avatar} alt={name} className="w-14 h-14 rounded-lg object-cover shadow-sm" />
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-richblack-5 truncate">{name}</h4>
        <div className="text-xs text-richblack-300">{role}</div>
        <p className="mt-3 text-sm text-richblack-300 line-clamp-3">{bio}</p>
      </div>
    </div>
  </article>
);

const About = () => {
  return (
    <div className="bg-transparent text-richblack-500">
      <PageHeader
        title="About Us"
        subtitle="Who are we?"
        description="'Up' is a new, student focused online tutoring platform. Simple to start with, powerful 
        to grow on. We've been building and refining it since 2024, and we think it's pretty amazing. We are passionate 
        about revolutionizing the way we learn. Our innovative platform combines technology expertise, and community to create an unparalleled educational experience"
        background={backImg}
        showSearch={false}
      />

      <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
        <h3 className="text-2xl font-semibold text-richblack-5 mb-4">What you'll learn</h3>
        <LearningGrid />
      </div>


      <div className="mx-auto w-11/12 max-w-maxContent py-14 space-y-12">





        {/* Stats (glass wrapper) */}
        <section className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
          <StatsComponenet />
        </section>

        {/* What you'll learn - reusing LearningGrid inside glass card */}

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TeamMember
              name="Sachini Kumarathunga"
              role="Founder"
              avatar={BannerImage1}
              bio="ICT Lecture, Software Engineer, BSc (Hons) Information Technology & Management - University of Moratuwa"
            />
            <TeamMember
              name="Nimantha Hennayake"
              role="Developer"
              avatar={BannerImage2}
              bio="Web developer who support to maintain this"
            />
          </div>
        </section>

        {/* Contact form & review slider grouped inside glass cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
            <h3 className="text-2xl font-semibold text-richblack-5 mb-4">Contact us</h3>
            <p className="text-sm text-richblack-300 mb-4">
              Questions about courses, partnerships or press? Drop a line — we typically reply within one business day.
            </p>
            <ContactFormSection />
          </div>

          <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
            <h3 className="text-2xl font-semibold text-richblack-5 mb-4">Learner stories</h3>
            <p className="text-sm text-richblack-300 mb-4">Real feedback from learners who built, launched and got hired.</p>
            <ReviewSlider />
          </div>
        </section>

        {/* Footer CTA (glass-ish) */}
        <section className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 text-center">
          <h3 className="text-xl font-semibold text-richblack-5">Ready to start?</h3>
          <p className="mt-2 text-richblack-300">Join a cohort, build projects, and level up your career today.</p>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;
