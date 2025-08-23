// src/pages/Home.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import CourseCard from "@/shared/components/ui/CourseCard";
import HighlightText from "@/shared/components/ui/HighlightText";
import CTAButton from "@/shared/components/ui/Button";
import Img from "@/shared/components/ui/Img";
import { HomePageExplore } from "@/app/config/homepage-explore";
import InstructorImg from "@/shared/assets/images/teacher3.png";
import HeroMock from "@/shared/assets/images/Instructor.png"; // substitute with the laptop image used in the attached design
import HeroPhone from "@/shared/assets/images/Instructor.png";
import popular1 from "@/shared/assets/images/Instructor.png";
import popular2 from "@/shared/assets/images/Instructor.png";
import popular3 from "@/shared/assets/images/Instructor.png";
import know_your_progress from "@/shared/assets/images/Instructor.png";
import compare_with_others from "@/shared/assets/images/Instructor.png";
import plan_your_lesson from "@/shared/assets/images/Instructor.png";
import timelineImage from "@/shared/assets/images/Instructor.png";
import Logo1 from "@/shared/assets/images/Logo1.svg";
import Logo2 from "@/shared/assets/images/Logo2.svg";
import Logo3 from "@/shared/assets/images/Logo3.svg";
import Logo4 from "@/shared/assets/images/Logo4.svg";

/* -----------------------
   Small presentational pieces
   ----------------------- */

// Primary site LinkedButton (keeps your gradient)
export function LinkedButton({ children, to = "/app/sign-up", className = "" }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-3 rounded-full px-6 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition
        bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white shadow-md hover:opacity-95 ${className}`}
      aria-label={typeof children === "string" ? children : "Call to action"}
    >
      <span className="text-sm md:text-base">{children}</span>
      <span className="ml-2 inline-flex items-center opacity-75">
        <FaArrowRight aria-hidden />
      </span>
    </Link>
  );
}

// small icon box for features
function IconBox({ children, colorClass = "emerald" }) {
  const gradients = {
    emerald: "from-green-300/50 to-emerald-300/50 text-emerald-500 ring-emerald-500/30",
    blue: "from-sky-300/50 to-blue-300/50 text-blue-500 ring-blue-500/30",
    orange: "from-orange-200/50 to-orange-500/40 text-orange-500 ring-orange-500/35",
    amber: "from-yellow-200/75 to-orange-200/75 text-amber-500 ring-amber-400/60",
  };
  const cls = gradients[colorClass] || gradients.emerald;
  return (
    <div className={`flex justify-center items-center shrink-0 rounded-xl w-12 h-12 ring-1 shadow-xl bg-gradient-to-br ${cls}`}>
      {children}
    </div>
  );
}

/* -----------------------
   Hero section - left text, right image (laptop + phone stack)
   - Uses explicit width/height attributes to avoid layout shift
   ----------------------- */
function Hero() {
  return (
    <header className="relative pt-24 pb-8 lg:pb-10 overflow-hidden">
      {/* subtle background gradient band */}
      <div className="absolute inset-x-0 top-0 h-[220px] lg:h-[320px] bg-gradient-to-b from-white via-[#fbf7ff] to-white pointer-events-none" aria-hidden />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
          {/* Left: Headline + LinkedButton + small brand band */}
          <div className="max-w-2xl">
            <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-[-0.02em] text-[#0b1220]">
              Develop your skills in a new &amp; <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9b6af7] to-[#f08ae6]">
                unique way
              </span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-[#4b5563] max-w-xl">
              Explore a transformative approach to skill development on our online learning platform. Uncover a new realm of learning experiences and elevate your expertise.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <LinkedButton to="/signup">Enroll Now</LinkedButton>
              <Link to="/catalog" className="inline-flex items-center px-4 py-2 rounded-full border border-[#e9e6f8] text-[#6b7280] hover:bg-[#faf7ff] transition">
                Explore Courses
              </Link>
            </div>

            {/* brand strip */}
            <div className="mt-8 rounded-md overflow-hidden bg-gradient-to-r from-[#f3e8ff] via-[#f8e7ff] to-[#fef7ff] py-3 px-4 flex items-center gap-6">
              <img src={Logo1} alt="partner 1" className="h-6 w-auto object-contain" />
              <img src={Logo2} alt="partner 2" className="h-6 w-auto object-contain" />
              <img src={Logo3} alt="partner 3" className="h-6 w-auto object-contain" />
              <img src={Logo4} alt="partner 4" className="h-6 w-auto object-contain" />
            </div>
          </div>

          {/* Right: hero composition (laptop + phone) */}
          <div className="flex justify-center lg:justify-end items-center relative">
            <div className="w-[520px] max-w-full relative">
              <img
                src={HeroMock}
                alt="Laptop showing learning platform"
                width={960}
                height={600}
                className="w-full h-auto object-contain shadow-2xl rounded-xl"
                loading="lazy"
              />
              <img
                src={HeroPhone}
                alt="Phone showing mobile view"
                width={220}
                height={420}
                className="absolute right-[-30px] top-[20%] w-[160px] md:w-[190px] transform rotate-3 shadow-xl rounded-lg border border-white"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* -----------------------
   Search courses strip
   ----------------------- */
function SearchCourses() {
  const [q, setQ] = useState("");
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
      <div className="bg-white rounded-xl shadow-md border border-[#efe8ff] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search courses</label>
            <div className="relative">
              <input
                id="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for over 50+ courses"
                className="w-full rounded-full border border-[#ece7ff] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9a4ff] placeholder:text-[#9ca3af]"
              />
            </div>
          </div>
          <div>
            <button
              type="button"
              className="rounded-full px-6 py-3 bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white font-semibold shadow"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -----------------------
   Popular courses grid
   ----------------------- */
function PopularCourses() {
  // demo card props; in the real app map actual course objects
  const cards = [
    { img: popular1, title: "Web Design & Development", price: "$560.00", instructor: "J. Morgan" },
    { img: popular2, title: "Wireframing & Prototyping", price: "$160.00", instructor: "Jordan B" },
    { img: popular3, title: "Python For Data Science", price: "$432.00", instructor: "Alex Taylor" },
  ];

  return (
    <section className="pt-12 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#0b1220]">Our Popular Courses</h2>
        <p className="mt-3 text-[#6b7280] max-w-2xl mx-auto">Discover top curated courses loved by our students—practical, hands-on, and instructor-led.</p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-md border border-[#efe7ff]">
              <img src={c.img} alt={c.title} width={400} height={220} className="w-full h-44 object-cover rounded-md" loading="lazy" />
              <div className="mt-4 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{c.title}</h3>
                  <p className="text-sm text-[#6b7280] mt-1">{c.instructor}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#6b7280]">From</div>
                  <div className="font-bold text-lg">{c.price}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <LinkedButton to="/courses">View Course</LinkedButton>
                <button className="ml-auto inline-flex items-center px-4 py-2 rounded-full border border-[#efe7ff] hover:bg-[#faf7ff]">Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -----------------------
   Instructor LinkedButton block
   ----------------------- */
function InstructorSection() {
  return (
    <section className="bg-gradient-to-br from-[#fbf6ff] to-[#f6f0ff] py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-md grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="order-2 lg:order-1">
            <h3 className="text-2xl font-semibold">If you are a certified teacher then become an instructor</h3>
            <p className="mt-3 text-[#6b7280]">Unlock new opportunities and earn by creating courses. Share your expertise and reach learners worldwide.</p>
            <ul className="mt-4 text-sm text-[#374151] space-y-1">
              <li>• Global impact</li>
              <li>• Flexible schedule</li>
              <li>• Professional development</li>
            </ul>
            <div className="mt-6">
              <CTAButton active={true} linkto={"/signup"}>
                <div className="flex items-center gap-2">Become an Instructor <FaArrowRight /></div>
              </CTAButton>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center">
            <img src={InstructorImg} alt="Instructor" width={320} height={320} className="w-64 h-64 object-cover rounded-xl shadow" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -----------------------
   Learning Language small showcase + LinkedButton
   ----------------------- */
function LearningLanguageSection() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-3xl font-semibold">
          Your Swiss Knife for <HighlightText text={" learning any language"} />
        </h3>
        <p className="mt-4 text-[#6b7280] max-w-2xl mx-auto">
          Using spin making learning multiple languages easy — with 20+ languages, realistic voice-over, progress tracking, custom schedule and more.
        </p>

        <div className="mt-8 flex flex-col lg:flex-row gap-6 items-center justify-center">
          <img src={know_your_progress} alt="progress" className="w-44 h-auto object-contain" />
          <img src={compare_with_others} alt="compare" className="w-44 h-auto object-contain" />
          <img src={plan_your_lesson} alt="plan" className="w-44 h-auto object-contain" />
        </div>

        <div className="mt-8">
          <LinkedButton to="/signup">Learn more</LinkedButton>
        </div>
      </div>
    </section>
  );
}

/* -----------------------
   Testimonials (simple) + Subscribe footer block
   ----------------------- */
function TestimonialsAndSubscribe() {
  const testimonials = [
    { name: "Alexa Rodriguez", text: "Inspiring courses and excellent instructors.", title: "Student" },
    { name: "Emily Chen", text: "Practical, hands-on learning that accelerated my career.", title: "Student" },
    { name: "James Johnson", text: "Course structure and projects were top-notch.", title: "Student" },
  ];

  return (
    <section className="bg-gradient-to-br from-[#f3e6ff] to-[#fbe4ff] py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h4 className="text-center text-2xl font-semibold">Student's Testimonials</h4>
        <p className="text-center text-[#6b7280] mt-2">Real students, real results — see what learners are saying.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-5 rounded-lg shadow-sm border border-[#efe7ff]">
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-[#6b7280] mt-2">{t.text}</div>
              <div className="text-xs text-[#9ca3af] mt-3">{t.title}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-white p-6 md:p-10 mx-auto max-w-3xl shadow">
          <h5 className="text-lg font-semibold text-center">Get in touch!</h5>
          <p className="text-center text-[#6b7280] mt-2">Subscribe to get news, discounts and updates</p>
          <form className="mt-6 flex gap-3 items-center justify-center">
            <input aria-label="Email address" placeholder="Enter your email..." className="rounded-full px-4 py-3 border border-[#ece7ff] w-full max-w-xl focus:outline-none focus:ring-2 focus:ring-[#d6b1ff]" />
            <button className="rounded-full px-6 py-3 bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white font-semibold">Subscribe</button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* -----------------------
   Page assembly
   ----------------------- */
export default function Home2() {
  return (
    <main className="bg-white text-[#0b1220]">
      <Hero />
      <SearchCourses />
      <PopularCourses />
      <InstructorSection />
      <LearningLanguageSection />
      <TestimonialsAndSubscribe />
      {/* Final footer spacer (you likely have a global Footer widget) */}
      <div className="h-16" />
    </main>
  );
}
