 
import { Link } from "react-router-dom";
import { ImGithub, ImLinkedin2 } from "react-icons/im";
import { FaTwitter } from "react-icons/fa";

/**
 * Fly-like Footer
 * - Background gradient + patterned overlay (mask)
 * - Columns: Company, Articles, Resources, Contact, Legal
 * - Violet hover color, small compact text
 */

const flyColumns = [
  {
    title: "Company",
    links: [
      { title: "About", link: "/about/" },
      { title: "Pricing", link: "/pricing/" },
      { title: "Jobs", link: "/jobs/" },
    ],
  },
  {
    title: "Articles",
    links: [
      { title: "Blog", link: "/blog/" },
      { title: "Phoenix Files", link: "/phoenix-files/" },
      { title: "Laravel Bytes", link: "/laravel-bytes/" },
      { title: "Ruby Dispatch", link: "/ruby-dispatch/" },
      { title: "Django Beats", link: "/django-beats/" },
      { title: "JavaScript Journal", link: "/javascript-journal/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Docs", link: "/docs/" },
      { title: "Customers", link: "/customers" },
      { title: "Support", link: "/docs/support/" },
      { title: "Support Metrics", link: "/support/" },
      { title: "Status", link: "https://status.fly.io/" },
    ],
  },
  {
    title: "Contact",
    links: [
      { title: "GitHub", link: "https://github.com/superfly/" },
      { title: "Twitter", link: "https://twitter.com/flydotio" },
      { title: "Community", link: "https://community.fly.io/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Security", link: "/security/" },
      { title: "Privacy policy", link: "/legal/privacy-policy" },
      { title: "Terms of service", link: "/legal/terms-of-service" },
      { title: "Acceptable Use Policy", link: "/legal/acceptable-use-policy" },
    ],
  },
];

const isExternal = (u = "") => /^https?:\/\//i.test(u);

function FooterLink({ to, children }) {
  if (!to) return <span className="text-[#aa87e7]">{children}</span>;

  // Use Link for both internal and external as requested.
  // For external URLs, keep target and rel so they open in a new tab.
  if (isExternal(to)) {
    return (
      <Link
        to={to}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-violet-400 transition-colors text-[#aa87e7]"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link to={to} className="hover:text-violet-400 transition-colors text-[#aa87e7]">
      {children}
    </Link>
  );
}

export default function Footer({
  columns = flyColumns,
  bottom = ["Privacy Policy", "Cookie Policy", "Terms"],
}) {
  return (
    <footer
      role="contentinfo"
      className="relative text-sm leading-6 text-white overflow-hidden"
      aria-label="Site footer"
    >
      <div
        aria-hidden="true"
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] -rotate-3 pointer-events-none opacity-20"
        style={{
          backgroundImage: "url('/phx/ui/images/graph-6eab844a3587d8caf1e76d16a9140ab2.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "100px auto",
          maskImage: "radial-gradient(125% 100%, rgba(255,255,255,.025) 25%, rgba(255,255,255,1))",
          WebkitMaskImage:
            "radial-gradient(125% 100%, rgba(255,255,255,.025) 25%, rgba(255,255,255,1))",
        }}
      />

      <div
        className="w-full"
        style={{
          background:
            "linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(10,12,20,0.95) 60%, rgba(7,8,15,0.96) 100%)",
          paddingTop: "3rem",
          paddingBottom: "2rem",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 lg:pb-12">
          <div className="grid md:grid-cols-[auto_1fr] gap-10 md:gap-16 items-start">
            <div className="justify-self-start">{/* You can place Logo here if needed */}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {columns.map((col, idx) => (
                <dl key={idx}>
                  <dt className="font-bold uppercase tracking-wider text-xs text-white mb-3">
                    {col.title}
                  </dt>
                  <dd className="font-medium flex flex-col items-start space-y-2 text-[#7c3aed]">
                    {col.links.map((link, i) => (
                      <FooterLink key={i} to={link.link ?? link.href}>
                        {link.title}
                      </FooterLink>
                    ))}
                  </dd>
                </dl>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {bottom.map((label, i) => {
                const path = `/${label.toString().toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <span
                    key={i}
                    className={`text-white/80 ${i !== bottom.length - 1 ? "pr-3 border-r border-white/6" : ""}`}
                  >
                    <Link to={path} className="hover:text-violet-400 transition-colors">
                      {label}
                    </Link>
                  </span>
                );
              })}
            </div>

            <div className="text-center text-xs text-[#575757]">
              <div className="mb-1 md:mb-0">
                Made with ❤️ by Xelavon Dev Team &nbsp;&nbsp;&nbsp; Copyright © {new Date().getFullYear()} Up
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="https://www.linkedin.com/in/clzmate-a48800231/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white p-2 rounded-full hover:bg-white/6 transition"
                aria-label="LinkedIn"
              >
                <ImLinkedin2 size={16} />
              </Link>

              <Link
                to="https://www.github.com/clzmate"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white p-2 rounded-full hover:bg-white/6 transition"
                aria-label="GitHub"
              >
                <ImGithub size={16} />
              </Link>

              <Link
                to="https://twitter.com/flydotio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white p-2 rounded-full hover:bg-white/6 transition"
                aria-label="Twitter"
              >
                <FaTwitter size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
