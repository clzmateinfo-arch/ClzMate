import { LinkButton } from "@/shared/components/ui/LinkButton";
import spotlightImg from "@/shared/assets/images/porfolio/fireball.png";

export default function SpotlightCard({
    img = spotlightImg,
    title = "If you are a certified instructor \nthen become an instructor",
    text = "Unlock new opportunities and earn by creating courses. Share your expertise and reach learners worldwide",
    ctaText = "Start Now",
    ctaHref = "/signup",
}) {
    return (
        <section className="relative bg-white overflow-visible mb-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">
                <div
                    className="bg-[#2c0046] grid lg:grid-cols-7 items-center gap-x-8 gap-y-4 px-10 md:px-14 xl:px-20 py-0 rounded-3xl
                     bg-gradient-to-br from-[rgba(88,28,135,0.5)] via-[rgba(11,17,32,0.5)] to-[rgba(0,0,0,0.1)]
                     ring-1 ring-[rgba(19,0,70,0.45)] ring-inset border border-[rgba(2,6,23,0.85)]
                     overflow-hidden"
                    role="region"
                    aria-label="Spotlight: Phoenix.new"
                >
                    <div className="lg:order-last lg:col-span-3 lg:-mr-9 -mb-6 lg:mb-0">
                        <img
                            src={img}
                            alt="Phoenix demo"
                            width="400"
                            height="320"
                            className="w-full max-w-lg lg:max-w-none mx-auto block object-contain"
                            loading="lazy"
                            aria-hidden={false}
                        />
                    </div>

                    <div className="space-y-4 py-6 md:py-10 lg:py-12 xl:py-20 lg:col-span-4">
                        <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 mb-5 text-xs font-sans tracking-wide font-extrabold
                         bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-1 ring-orange-400"
                            aria-hidden="true"
                        >
                            NEW!
                        </span>

                        <h2 className="text-2xl md:text-3xl mb-5 mt-1 font-heading text-white -mt-1 whitespace-pre-line">{title}</h2>

                        <p className="block text-lg mb-5 mt-1 text-white/80 pb-3">{text}</p>

                        <LinkButton
                            to={ctaHref}
                            className="gap-2 btn-xl group/btn btn-border-light rounded-full w-full sm:w-auto inline-flex items-center"
                            variant="primary"
                            aria-label={ctaText}
                        >
                            <span className="inline-block">{ctaText}</span>
                        </LinkButton>
                    </div>
                </div>
            </div>
        </section>
    );
}
