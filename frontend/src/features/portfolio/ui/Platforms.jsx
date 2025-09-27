import React from "react";
import { Link } from "react-router-dom";
import { LinkButton } from "@/shared/components/ui/LinkButton";

const defaultPlatforms = [
    { name: "Computing", src: "/shared/assets/images/porfolio/advertisment.png", href: "/catalog/computing" },
    { name: "Information Communication Technology", src: "/shared/assets/images/porfolio/advertisment.png", href: "/catalog/ict" },
    { name: "Java Script", src: "/shared/assets/images/porfolio/advertisment.png", href: "/catalog/javascript" },
    { name: "Python", src: "/shared/assets/images/porfolio/advertisment.png", href: "/catalog/python" },
    { name: "Web Development", src: "/shared/assets/images/porfolio/advertisment.png", href: "/catalog/web-development" },
    { name: "Network Security", src: "/shared/assets/images/porfolio/advertisment.png", href: "/catalog/network-security" },
];

export function PlatformsGrid({ platforms = defaultPlatforms }) {
    return (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-5">
            {platforms.map((p) => (
                <li key={p.name}>
                    <Link
                        to={p.href ?? "#"}
                        className="group h-full grid place-items-center px-4 py-8 rounded-2xl bg-white/6 backdrop-blur-sm hover:scale-105 focus:scale-105 transform transition will-change-transform ring-1 ring-white/6"
                        aria-label={p.name}
                    >
                        <img
                            src={p.src}
                            alt={p.name}
                            className="max-w-full h-8 object-contain brightness-0 invert"
                            loading="lazy"
                            width="150"
                            height="28"
                        />
                    </Link>
                </li>
            ))}
        </ul>
    );
};

export function Platforms({ platforms = defaultPlatforms }) {
    return (
        <section className="relative py-16 lg:py-24 xl:py-32 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-20 items-center">
                    <div className="relative max-w-xl space-y-6">
                        <div
                            aria-hidden="true"
                            className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] -rotate-3 pointer-events-none"
                            style={{
                                backgroundImage: "url('/phx/ui/images/graph-6eab844a3587d8caf1e76d16a9140ab2.svg')",
                                backgroundRepeat: "repeat",
                                backgroundSize: "100px auto",
                                WebkitMaskImage: "radial-gradient(125% 100%, rgba(255,255,255,0.025) 25%, rgba(255,255,255,1))",
                                maskImage: "radial-gradient(125% 100%, rgba(255,255,255,0.025) 25%, rgba(255,255,255,1))",
                                opacity: 0.28,
                            }}
                        />

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-5">
                            Learn the Tech You Love
                        </h2>

                        <p className="text-lg text-white/80 mb-5">
                            Our courses are designed and taught by industry experts who have years of experience and
                            are passionate about sharing their knowledge with you
                        </p>

                        <LinkButton
                            to="/catalog/all"
                            className="btn-xl group/btn btn-border-dark rounded-full"
                            variant="light"
                        >
                            Learn More
                        </LinkButton>
                    </div>

                    <div className="w-full">
                        <PlatformsGrid platforms={platforms} />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Platforms;
