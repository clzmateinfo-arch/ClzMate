import { LinkButton } from "@/shared/components/ui/LinkButton";
import cloudCity from "@/shared/assets/images/porfolio/cloud-city.avif";

export function Hero() {
    return (
        <section className="overflow-x-hidden">
            <header className="hero relative flex flex-col h-[560px] sm:h-[720px] md:h-[800px] lg:h-[1000px] pb-[120px] sm:pb-[160px] md:pb-[200px] lg:pb-[268px] overflow-hidden">
                <svg
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                    width="1171"
                    height="241"
                    viewBox="0 0 1171 241"
                    fill="none"
                    aria-hidden="true"
                    style={{ top: "-56px", minWidth: "80rem" }}
                >
                    <g opacity=".175" filter="url(#filter0_f)">
                        <path d="M731.735 -179.55C596.571 -157.762 516.36 -74.1815 552.576 7.13199C588.793 88.4455 727.724 136.701 862.887 114.913C998.051 93.1247 1078.26 9.54454 1042.05 -71.769C1005.83 -153.082 866.898 -201.337 731.735 -179.55Z" fill="url(#paint0_linear)"></path>
                        <path d="M378 114.106C520.489 114.106 636 45.8883 636 -38.2623C636 -122.413 520.489 -190.63 378 -190.63C235.511 -190.63 120 -122.413 120 -38.2623C120 45.8883 235.511 114.106 378 114.106Z" fill="url(#paint1_linear)"></path>
                    </g>
                    <defs>
                        <filter id="filter0_f" x="0" y="-310.63" width="1170.74" height="550.775" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
                            <feGaussianBlur stdDeviation="60" result="effect1_foregroundBlur"></feGaussianBlur>
                        </filter>
                        <linearGradient id="paint0_linear" x1="567.5" y1="1.03997" x2="1029.02" y2="64.6468" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#001AFF"></stop><stop offset="1" stopColor="#6EE5C2"></stop>
                        </linearGradient>
                        <linearGradient id="paint1_linear" x1="155" y1="-11.0234" x2="511.855" y2="-162.127" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FFC83A"></stop><stop offset="0.504191" stopColor="#FF008A"></stop><stop offset="1" stopColor="#6100FF"></stop>
                        </linearGradient>
                    </defs>
                </svg>
                <div
                    className="absolute left-0 right-0 bottom-0 pointer-events-none transform -translate-y-10 sm:-translate-y-6 md:translate-y-0"
                    aria-hidden="true"
                    style={{ willChange: "transform" }}
                >
                    <picture>
                        <source srcSet={cloudCity} type="image/avif" />
                        <img
                            src={cloudCity}
                            alt=""
                            width="1440"
                            className="sm:w-full w-[170%] max-w-none h-auto object-center sm:object-bottom object-cover block transform scale-110 sm:scale-100 origin-center sm:origin-bottom"
                            style={{ display: "block" }}
                        />
                    </picture>
                </div>

                <div className="relative container lg:max-w-4xl m-auto px-4 sm:px-6 lg:px-8 z-10 pt-[18px] sm:pt-[40px]">
                    <div className="relative flex flex-col items-start sm:items-center sm:text-center mt-10">
                        <h1 className="font-heading text-3xl xs:text-4.5xl sm:text-5xl md:text-5.5xl lg:text-6xl xl:text-6.5xl !tracking-[-.045em] relative text-navy mb-5 -mt-4 sm:-mt-5 lg:-mt-6 xl:mt-[-26px] leading-tight/[1.15]">
                            A Smarter Classroom Built For <br className="hidden lg:block" /> Those
                            <em className="relative inline-block z-0">
                                &nbsp;Wants To Fly
                                <svg viewBox="0 0 1213 73" aria-hidden="true" preserveAspectRatio="none" height="12" className="absolute -bottom-1 sm:-bottom-0.5 lg:bottom-0 left-0 w-full h-3 text-purple-400 -z-1">
                                    <g>
                                        <path fill="url(#underline-gradient)" d="M1213.19 35.377c2.37-13.011-22.95-10.753-31.04-14.087C1086.89 5.705 911.742 2.887 815.218 2.809c-78.003.231-155.966-1.833-233.961.481-57.545.429-114.885 6.164-172.419 7.383-121.164 5.39-242.94 10.751-362.507 32.199-12.356 3.286-25.614 4.255-37.332 9.401-29.507 22.983 27.103 20.15 39.468 17.234 357.956-47.703 362.767-46.261 636.452-50.97 121.033-2.508 241.892 6.658 428.341 19.243 4.74.404 8.98-4.032 8-8.788a942.105 942.105 0 0154.69 6.378c9.44 1.843 18.92 3.583 28.29 5.729 4.01.839 8.02-1.718 8.95-5.712v-.01z"></path>
                                    </g>
                                    <defs>
                                        <linearGradient id="underline-gradient" gradientTransform="rotate(110)">
                                            <stop offset="5%" stopColor="#CA7FF8"></stop><stop offset="95%" stopColor="#795BE9"></stop>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </em>
                        </h1>

                        <p className="text-sm sm:text-base lg:text-[18px] tracking-prose mb-9 max-w-[46.875rem] mx-auto text-[#374151]">
                            <strong className="text-[#0b1220]">Up</strong> is a all in one platform where parents, instructors and students manage materials, run learning sessions, track progress and build thriving learning experiences. Explore a transformative approach to skill development on our online learning platform. Uncover a new realm of learning experiences and elevate your expertise
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <LinkButton to="/signup" className="gap-2 btn-xl btn-purple group/btn btn-border-dark rounded-full">
                                Get started, It’s free
                            </LinkButton>
                        </div>
                    </div>
                </div>
            </header>
        </section>
    );
}

export default Hero;
