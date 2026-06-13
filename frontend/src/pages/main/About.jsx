 
import PageHeader from "@/shared/components/ui/PageHeader";
import Footer from "@/widgets/Footer/Footer";
import Img from "@/shared/components/ui/Img";
import SachiniImg from "../../shared/assets/images/about/sachini.jpg";
import { FaLinkedinIn, FaGithub, FaFacebookF, FaTwitter } from "react-icons/fa";
import LearningGrid from "@/features/about/ui/LearningGrid";
import StatsComponenet from "@/features/about/ui/Stats";
import ReviewSlider from "@/shared/components/feedback/ReviewSlider";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

const SocialIcon = ({ href, children, label = "", className = "" }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    title={label}
    className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${className} transition-transform hover:scale-105`}
  >
    {children}
  </a>
);

const TeamMember = ({ name, role, avatar, bio, links = {} }) => {
  const { linkedin, github, facebook, twitter } = links || {};

  return (
    <article className="bg-white/5 rounded-2xl p-4 border border-white/8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="min-w-15">
          <Img
            src={avatar}
            alt={name}
            className="w-14 h-14 rounded-lg object-cover shadow-sm"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-black truncate">{name}</h4>
          <div className="text-xs text-black">{role}</div>
          <p className="mt-3 text-sm text-black line-clamp-3">{bio}</p>

          <div className="mt-3 flex items-center justify-end gap-2">

            <SocialIcon
              href={linkedin}
              label={`${name} on LinkedIn`}
              className="bg-gradient-to-br from-[#0e76a8]/90 to-[#0077b5]/70 text-white w-6 h-6"
            >
              <FaLinkedinIn className="w-4 h-4" />
            </SocialIcon>


            <SocialIcon
              href={github}
              label={`${name} on GitHub`}
              className="bg-gradient-to-br from-[#333333]/90 to-[#24292e]/70 text-white w-6 h-6"
            >
              <FaGithub className="w-4 h-4" />
            </SocialIcon>

            <SocialIcon
              href={twitter}
              label={`${name} on Twitter`}
              className="bg-gradient-to-br from-[#1da1f2]/90 to-[#0c85d0]/70 text-white w-6 h-6"
            >
              <FaTwitter className="w-4 h-4" />
            </SocialIcon>

            <SocialIcon
              href={facebook}
              label={`${name} on Facebook`}
              className="bg-gradient-to-br from-[#1877f2]/90 to-[#145dbf]/70 text-white w-6 h-6"
            >
              <FaFacebookF className="w-4 h-4" />
            </SocialIcon>
          </div>
        </div>
      </div>
    </article>
  );
};

const About = () => {
  return (
    <div className="bg-transparent text-black">
      <PageHeader
        title="About Us"
        subtitle="Who are we?"
        description="'Up' is a new, student focused online tutoring platform. Simple to start with, powerful 
        to grow on. We've been building and refining it since 2024, and we think it's pretty amazing. We are passionate 
        about revolutionizing the way we learn. Our innovative platform combines technology expertise, and community to create an unparalleled educational experience"
        background={backImg}
        showSearch={false}
      />
      <div className="mx-auto w-11/12 max-w-[95%]">
        <div className="rounded-2xl p-6 bg-white/6 mt-5 justify-center">
          <StatsComponenet />
          <LearningGrid />
          <div
            className="rounded-2xl p-6 mt-5 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm flex flex-col items-start"
          >
            <header className="mb-6 text-left">
              <h2 id="site-stats-title" className="text-2xl font-semibold text-black">
                Hi!
              </h2>
              <p className="mt-2 text-sm text-black">
                Meet Our Team
              </p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
              <TeamMember
                name="Sachini Kumarathunga"
                role="Founder"
                avatar={SachiniImg}
                linkedin="https://www.linkedin.com/in/sachini-kumarathunga/"
                github="https://github.com/sachkumarathunga"
                facebook="https://www.facebook.com/share/16yLFTXhVS/"
                twitter="twitter"
                bio="Computer Science & ICT Lecture, Software Engineer, Web Developer, BSc (Hons) Information Technology & Management - University of Moratuwa"
              />
              {/* <TeamMember
            name="Nimantha Hennayake"
            role="Developer"
            avatar={NimanthaImg}
            bio="Web developer who support to maintain this :)"
          /> */}
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-6 bg-white/6 mt-5">
          <header className="mb-6 text-center">
            <h2 id="site-stats-title" className="text-2xl font-semibold text-black">
              Learners Reviews
            </h2>
            <p className="mt-2 text-sm text-black">
              Feedback always matters
            </p>
          </header>
          <ReviewSlider />
        </div>
      </div>
      <Footer />
    </div >
  );
};

export default About;
