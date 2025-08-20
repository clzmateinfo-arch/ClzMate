/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import Img from "@/shared/components/ui/Img";
import companyLogo from "@/shared/assets/images/logo/logo.png";

/**
 * A shared template for sign-in / sign-up pages that mirrors fly.io layout:
 * - left column: logo, heading, social buttons, divider, and the form
 * - right aside: large image + quote (hidden on small screens)
 *
 * Props:
 * - title, description1, description2, image: left-hero image (legacy)
 * - asideImage: image for the right-side hero / background
 * - asideQuote: optional quote / citation to display in aside
 * - formType: "signup" | "signin"
 * - children: if you want to render custom form area instead of using formType logic
 */
function Template({
  title,
  description1,
  description2,
  image,
  asideImage,
  asideQuote,
  formType = "signup",
  children,
}) {
  return (
    <main className="w-full min-h-[calc(100vh-3.5rem)] grid lg:grid-cols-[1fr_32rem] text-richblack-700">
      {/* LEFT: form column */}
      <section className="h-full flex flex-col justify-center items-center p-6 lg:p-10">
        {/* logo */}
        <Link to="/" className="mb-auto self-start -mt-1">
          <img src={companyLogo} alt="logo" className="h-9 w-auto" />
        </Link>

        <div className="w-full max-w-md mt-16 pb-16 mb-auto">
          <h1 className="text-2xl md:text-3xl mb-4 text-richblack-900">{title}</h1>

          {description1 || description2 ? (
            <p className="mb-6 text-[1.05rem] text-richblack-600">
              <span>{description1}</span>{" "}
              <span className="font-edu-sa font-bold italic text-blue-100">
                {description2}
              </span>
            </p>
          ) : null}

          {/* children allow custom rendering (social buttons + forms handled there) */}
          {children ? (
            children
          ) : (
            // fallback: render either SignupForm or LoginForm internally if no children passed
            <div>
              {formType === "signup" ? (
                // client will still import and render the real SignupForm in the page file
                <div />
              ) : (
                <div />
              )}
            </div>
          )}
        </div>

        {/* footer small text (terms) */}
        <footer className="mx-auto mt-auto w-full max-w-md text-xs pt-6">
          <div className="text-center text-richblack-500">
            By continuing you agree to our{" "}
            <a
              className="underline underline-offset-2 decoration-1 hover:text-blue-100"
              href="/legal/terms-of-service/"
              target="_blank"
              rel="noreferrer"
            >
              terms of service
            </a>{" "}
            and{" "}
            <a
              className="underline underline-offset-2 decoration-1 hover:text-blue-100"
              href="/legal/privacy-policy/"
              target="_blank"
              rel="noreferrer"
            >
              privacy policy
            </a>
            .
          </div>
        </footer>
      </section>

      {/* RIGHT: aside image + quote (visible on lg+) */}
      <aside className="relative hidden lg:block h-full p-16">
        {asideImage ? (
          <img
            src={asideImage}
            className="absolute inset-0 max-w-none w-full h-full object-cover"
            alt="aside-hero"
          />
        ) : image ? (
          <Img
            src={image}
            alt="aside-hero"
            className="absolute inset-0 max-w-none w-full h-full object-cover"
          />
        ) : null}

        {asideQuote ? (
          <blockquote className="relative z-20 text-2xl font-heading text-purple-900">
            {asideQuote.lines?.map((ln, i) => (
              <p className="leading-tight" key={i}>
                {ln}
              </p>
            ))}
            {asideQuote.cite ? (
              <cite className="block not-italic text-xl mt-6">
                <span className="opacity-40">—</span>
                {asideQuote.cite}
              </cite>
            ) : null}
          </blockquote>
        ) : null}
      </aside>
    </main>
  );
}

export default Template;
