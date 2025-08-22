import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ImGithub, ImLinkedin2 } from "react-icons/im";
import { FaFacebookF, FaGoogle, FaTwitter, FaYoutube } from "react-icons/fa";
import { FooterLink2 } from "@/app/config/footer-links";
import { Logo } from "@/shared/components/ui/Logo";

const slugify = (text = "") =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_/]/g, "");

const NavItem = ({ to, children, className = "" }) => (
  <div className={`text-[14px] cursor-pointer hover:text-richblack-50 transition-all duration-200 ${className}`}>
    <Link to={to}>{children}</Link>
  </div>
);

const SocialIcons = () => (
  <div className="flex gap-3 text-lg duration-200">
    <a href="#" aria-label="facebook" className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-richblack-700">
      <FaFacebookF size={14} />
    </a>
    <a href="#" aria-label="google" className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-richblack-700">
      <FaGoogle size={14} />
    </a>
    <a href="#" aria-label="twitter" className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-richblack-700">
      <FaTwitter size={14} />
    </a>
    <a href="#" aria-label="youtube" className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-richblack-700">
      <FaYoutube size={14} />
    </a>
  </div>
);

const defaultLeft = {
  logoTitle: "Company",
  links: ["About", "Careers", "Affiliates"],
};

const defaultResources = ["Articles", "Blog", "Chart Sheet", "Code challenges", "Docs", "Projects"];
const defaultPlans = ["Paid memberships", "For students"];
const defaultCommunity = ["Forums", "Chapters", "Events"];
const defaultBottom = ["Privacy Policy", "Cookie Policy", "Terms"];

const Column = ({ title, children }) => (
  <div className="w-[48%] lg:w-[30%] mb-7 lg:pl-0">
    <h1 className="text-richblack-50 font-semibold text-[16px]">{title}</h1>
    <div className="flex flex-col gap-2 mt-2">{children}</div>
  </div>
);

const Footer = ({
  left = defaultLeft,
  resources = defaultResources,
  plans = defaultPlans,
  community = defaultCommunity,
  bottom = defaultBottom,
  columns = FooterLink2,
}) => {
  const leftLinks = useMemo(() => left.links || [], [left]);

  return (
    <footer className="bg-richblack-800 mx-7 rounded-3xl mb-10">
      <div className="flex lg:flex-row gap-8 items-center justify-between w-11/12 max-w-maxContent text-richblack-400 leading-6 mx-auto relative py-14">
        <div className="border-b w-[100%] flex flex-col lg:flex-row pb-5 border-richblack-700">
          {/* Section 1 */}
          <div className="lg:w-[50%] flex flex-wrap flex-row justify-between lg:border-r lg:border-richblack-700 pl-3 lg:pr-5 gap-3">
            <div className="w-[30%] flex flex-col gap-3 lg:w-[30%] mb-7 lg:pl-0">
              <Logo></Logo>
              <h1 className="text-richblack-50 font-semibold text-[16px]">{left.logoTitle}</h1>

              <div className="flex flex-col gap-2">
                {leftLinks.map((label, i) => (
                  <NavItem key={i} to={slugify(label)}>
                    {label}
                  </NavItem>
                ))}
              </div>

              <SocialIcons />
            </div>

            <div className="w-[48%] lg:w-[30%] mb-7 lg:pl-0">
              <Column title="Resources">
                {resources.map((r, i) => (
                  <NavItem key={i} to={slugify(r)}>
                    {r}
                  </NavItem>
                ))}

                <h1 className="text-richblack-50 font-semibold text-[16px] mt-7">Support</h1>
                <NavItem to={slugify("help-center")}>Help Center</NavItem>
              </Column>
            </div>

            <div className="w-[48%] lg:w-[30%] mb-7 lg:pl-0">
              <Column title="Plans">
                {plans.map((p, i) => (
                  <NavItem key={i} to={slugify(p)}>
                    {p}
                  </NavItem>
                ))}

                <h1 className="text-richblack-50 font-semibold text-[16px] mt-7">Community</h1>
                {community.map((c, i) => (
                  <NavItem key={i} to={slugify(c)}>
                    {c}
                  </NavItem>
                ))}
              </Column>
            </div>
          </div>

          {/* Section 2 - dynamic columns from FooterLink2 config */}
          <div className="lg:w-[50%] flex flex-wrap flex-row justify-between pl-3 lg:pl-5 gap-3">
            {columns.map((col, i) => (
              <div key={i} className="w-[35%] lg:w-[30%] mb-7 lg:pl-0">
                <h1 className="text-richblack-50 font-semibold text-[16px]">{col.title}</h1>
                <div className="flex flex-col gap-2 mt-2">
                  {col.links.map((link, idx) => (
                    <NavItem key={idx} to={link.link}>{link.title}</NavItem>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* bottom footer */}
      <div className="flex flex-row items-center justify-between w-11/12 max-w-maxContent text-richblack-400 mx-auto pb-14 text-sm">
        <div className="flex justify-between lg:items-start items-center flex-col lg:flex-row gap-3 w-full">
          <div className="flex">
            {bottom.map((label, ind) => (
              <div key={ind} className={`${bottom.length - 1 === ind ? "" : "border-r border-richblack-700"} px-3 cursor-pointer hover:text-richblack-50 transition-all duration-200`}>
                <Link to={slugify(label)}>{label}</Link>
              </div>
            ))}
          </div>

          <div className="text-center flex flex-col sm:flex-row ">
            <div className="flex ">
              <span> Made with ❤️ </span>
              <a href="https://github.com/clzmate" target="_blank" rel="noopener noreferrer" className="text-white hover:underline mr-1">
                Xelavon Dev Team
              </a>
            </div>
            <span> © {new Date().getFullYear()} Up™</span>
          </div>

          <div className="flex items-center">
            <a href="https://www.linkedin.com/in/clzmate-a48800231/" className="text-white p-3 hover:bg-richblack-700 rounded-full duration-300" target="_blank" rel="noopener noreferrer">
              <ImLinkedin2 size={17} />
            </a>
            <a href="https://www.github.com/clzmate" className="text-white p-3 hover:bg-richblack-700 rounded-full duration-300" target="_blank" rel="noopener noreferrer">
              <ImGithub size={17} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
