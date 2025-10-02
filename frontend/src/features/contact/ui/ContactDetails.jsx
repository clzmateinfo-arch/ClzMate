/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import * as IconBi from "react-icons/bi";
import * as IconIo from "react-icons/io5";
import * as IconHi from "react-icons/hi2";
import * as IconFa from "react-icons/fa";

const contactDetails = [
  {
    icon: "BiMessageRounded",
    heading: "Chat with us",
    description: "Our friendly support team is here to help you anytime by email.",
    details: "clzmate.info@gmail.com",
    href: "mailto:clzmate.info@gmail.com",
  },
  {
    icon: "IoCall",
    heading: "Call us",
    description: "Mon   Fri · 8:00   17:00 (local time)",
    details: "+94 76 007 3341",
    href: "tel:+94760073341",
  },
  {
    icon: "HiBuildingOffice2",
    heading: "Visit us",
    description: "We’d love to meet you at our HQ.",
    details: "Colombo, Sri Lanka",
    href: "https://goo.gl/maps/xxxxx",
  },
  {
    icon: "FaDiscord",
    heading: "Join our community",
    description: "Connect with peers, ask questions, share knowledge.",
    details: "Clzmate Discord",
    href: "https://discord.gg/xxxxx",
  },
];

const socials = [
  { icon: "FaFacebookF", label: "Facebook", href: "https://facebook.com/clzmate" },
  { icon: "FaTwitter", label: "Twitter", href: "https://twitter.com/clzmate" },
  { icon: "FaInstagram", label: "Instagram", href: "https://instagram.com/clzmate" },
  { icon: "FaLinkedinIn", label: "LinkedIn", href: "https://linkedin.com/company/clzmate" },
];

const ContactDetails = () => {
  return (
    <aside className="space-y-8 text-black">
      {/* <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm">
        <h3 className="text-xl font-semibold mb-2 text-black">Get in Touch</h3>
        <p className="text-sm text-black">
          Whether you’ve got questions, feedback, or just want to say hi   we’re here for you.
          Expect replies within 24 hours on business days.
        </p>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {contactDetails.map((ele, i) => {
          const Icon =
            IconBi[ele.icon] ||
            IconIo[ele.icon] ||
            IconHi[ele.icon] ||
            IconFa[ele.icon] ||
            IconBi.BiMail;
          return (
            <div
              key={i}
              className="flex items-start gap-4 rounded-2xl p-5 bg-white/4 border border-white/10 shadow-sm hover:shadow-lg transition w-full"
              role="region"
              aria-labelledby={`contact-${i}-title`}
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-lg grid place-items-center
                           bg-gradient-to-br from-[#ba7bf0] via-[#996bec] to-[#5046e4]
                           shadow-md"
                aria-hidden="true"
              >
                <Icon size={22} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h4
                  id={`contact-${i}-title`}
                  className="text-lg font-semibold text-black truncate"
                >
                  {ele.heading}
                </h4>
                <p className="text-sm text-black mt-1">{ele.description}</p>

                <Link
                  to={ele.href}
                  className="mt-2 inline-block text-sm font-medium text-navy-300 underline underline-offset-2 decoration-navy-300/30 hover:text-violet-500 transition truncate"
                  // keep mailto / tel clickable in new tab behavior when needed
                  target={ele.href.startsWith("http") ? "_blank" : undefined}
                  rel={ele.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {ele.details}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-6 mt-3 bg-white/4 border border-white/10 shadow-sm">
        <h4 className="text-lg font-semibold text-black mb-3">Follow us</h4>
        <p className="text-sm text-black mb-4">
          Stay connected for updates, tips, and events.
        </p>
        <div className="flex flex-wrap gap-4">
          {socials.map((s, i) => {
            const Icon = IconFa[s.icon];
            return (
              <Link
                key={i}
                to={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full px-4 py-2 bg-white/6 hover:bg-white/12 transition text-sm font-medium text-black"
              >
                <Icon size={16} /> {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-5 mt-3 bg-gradient-to-r from-[#ba7bf0]/10 to-[#996bec]/10 border border-[#efe7ff] shadow-sm">
        <h4 className="text-base font-semibold text-black mb-2">Partnerships & Press</h4>
        <p className="text-sm text-black">
          For collaboration, sponsorship, or press inquiries, email{" "}
          <Link
            to="mailto:partnerships@clzmate.com"
            className="font-semibold text-black underline underline-offset-2 decoration-navy-300/30 hover:text-violet-600 transition"
          >
            partnerships@clzmate.com
          </Link>
          .
        </p>
      </div>
    </aside>
  );
};

export default ContactDetails;
