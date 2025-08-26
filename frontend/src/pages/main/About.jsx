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
import Quote from "@/features/about/ui/Quote";
import StatsComponenet from "@/features/about/ui/Stats";
import ReviewSlider from "@/shared/components/feedback/ReviewSlider";

/**
 * About (static, no animations)
 *
 * - Removed framer-motion & animations
 * - Uses glass-card style consistent with the rest of the app
 * - Keeps same structure and content blocks, with enhanced visual consistency
 */

const HeroMediaRow = () => (
  <div className="absolute inset-x-0 -bottom-10 flex justify-center px-6 pointer-events-none">
    <div className="grid grid-cols-3 gap-4 max-w-[1100px] w-full transform translate-y-1/2">
      <Img src={BannerImage1} alt="team image 1" className="rounded-2xl h-32 w-full object-cover shadow-lg" />
      <Img src={BannerImage2} alt="team image 2" className="rounded-2xl h-32 w-full object-cover shadow-lg" />
      <Img src={BannerImage3} alt="team image 3" className="rounded-2xl h-32 w-full object-cover shadow-lg" />
    </div>
  </div>
);

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
      {/* Hero / Page Header (static) */}
      <PageHeader
        title={
          <>
            Driving innovation in online education for a{" "}
            <HighlightText text="brighter future" />
          </>
        }
        subtitle="Discover, enroll and grow — world-class courses, mentors and community."
        description="We build experiences and communities that help learners transform their careers and lives."
        background={BannerImage1}
        className="relative overflow-visible"
      >
        <HeroMediaRow />
      </PageHeader>

      <main className="mx-auto w-11/12 max-w-maxContent py-14 space-y-12">
        {/* Quick Quote (glass card) */}
        <section>
          <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
            <Quote />
          </div>
        </section>

        {/* Founding story & image (glass cards) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
            <h2 className="text-3xl font-semibold text-richblack-5">Our Founding Story</h2>

            <p className="text-base text-richblack-300">
              We started with a simple conviction: education should be accessible,
              hands-on and career-focused. From small beginnings to a global learning
              community — our journey was built by educators and technologists working together.
            </p>

            <div className="space-y-3">
              <p className="text-base text-richblack-300">
                Today we deliver industry-vetted curricula, mentor-led cohorts and
                real projects that help learners build meaningful careers.
              </p>

              <div className="flex flex-wrap gap-3 mt-2">
                <Pill>Hands-on courses</Pill>
                <Pill>Mentor-led cohorts</Pill>
                <Pill>Real-world projects</Pill>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
            <Img
              src={FoundingStory}
              alt="Founding Story"
              className="w-full rounded-xl object-cover shadow-lg"
            />
          </div>
        </section>

        {/* Vision / Mission (glass cards) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
            <h3 className="text-2xl font-semibold text-richblack-5">Our Vision</h3>
            <p className="mt-3 text-richblack-300">
              Unlock human potential through accessible, high-quality learning —
              one project, one mentor, one community at a time.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
            <h3 className="text-2xl font-semibold text-richblack-5">Our Mission</h3>
            <p className="mt-3 text-richblack-300">
              Create real-world learning pathways that prepare learners for meaningful
              careers. We partner with industry to keep curriculum practical and relevant.
            </p>
          </div>
        </section>

        {/* Stats (glass wrapper) */}
        <section className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
          <StatsComponenet />
        </section>

        {/* What you'll learn - reusing LearningGrid inside glass card */}
        <section className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
          <h3 className="text-2xl font-semibold text-richblack-5 mb-4">What you'll learn</h3>
          <LearningGrid />
        </section>

        {/* Team (glass cards) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-richblack-5">Meet the team</h3>
            <p className="text-sm text-richblack-300">Small, focused and hands-on.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TeamMember
              name="Sandeepa Perera"
              role="Co-founder & CEO"
              avatar={BannerImage1}
              bio="Product-minded engineer focused on platform experience and curriculum partnerships."
            />
            <TeamMember
              name="Anjali Silva"
              role="Head of Curriculum"
              avatar={BannerImage2}
              bio="Educator and curriculum designer who turns industry needs into hands-on projects."
            />
            <TeamMember
              name="Ravi Kumar"
              role="Head of Engineering"
              avatar={BannerImage3}
              bio="Builds resilient systems and mentor tooling — keeps the platform humming."
            />
            <TeamMember
              name="Priya Fernando"
              role="Community Lead"
              avatar={BannerImage1}
              bio="Supports learners via mentorship, cohort ops and community programs."
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
      </main>

      <Footer />
    </div>
  );
};

export default About;
