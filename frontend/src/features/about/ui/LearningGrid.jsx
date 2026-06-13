import { LinkButton } from "@/shared/components/ui/LinkButton";

const LearningGridArray = [
  {
    order: -1,
    heading: "World Class Learning for",
    highlightText: "Anyone, Anywhere",
    description: "'Up' brings flexible, affordable, relevant online learning to individuals worldwide",
    BtnText: "Learn More",
    BtnLink: "/",
  },
  {
    order: 2,
    heading: "Active Learning Methods",
    description:
      "our methods focus on doing and building real outcomes students value",
  },
  {
    order: 3,
    heading: "Certification",
    description:
      "Receive verifiable certificates and portfolios that showcase what you actually learned",
  },
  {
    order: 4,
    heading: `Auto grading & Feedback`,
    description:
      "Automated grading, human review and actionable feedback help learners iterate quickly and improve faster",
  },
  {
    order: 5,
    heading: "Ready to Work",
    description:
      "Career prep, interview kits and hiring partners help graduates transition from learning to paid work",
  },
];

export default function LearningGrid() {
  return (
    <section aria-labelledby="what-you-learn" className="w-full">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 auto-rows-fr">
        {LearningGridArray.map((card, idx) => {
          if (card.order < 0) {
            return (
              <article
                key={card.order}
                className="lg:col-span-2 lg:row-span-2 rounded-2xl p-8 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm"
                aria-labelledby={`lg-hero-${idx}-title`}
              >
                <h3 id={`lg-hero-${idx}-title`} className="text-3xl lg:text-4xl font-semibold text-black leading-tight">
                  {card.heading} <span className="text-fuchsia-950">{card.highlightText}</span>
                </h3>

                <p className="mt-4 text-base text-black max-w-prose">
                  {card.description}
                </p>

                {card.BtnText && (
                  <div className="mt-6">
                    <LinkButton
                      to={card.BtnLink}
                      className="inline-flex items-center gap-2 btn-xl btn-purple btn-border-dark rounded-full"
                    >
                      {card.BtnText}
                    </LinkButton>
                  </div>
                )}
              </article>
            );
          }

          return (
            <article
              key={card.order}
              className="rounded-2xl p-6 bg-white/4 border border-white/10 shadow-sm hover:shadow-lg transition"
              aria-labelledby={`lg-item-${card.order}-title`}
            >
              <h4 id={`lg-item-${card.order}-title`} className="text-lg font-semibold text-black">
                {card.heading}
              </h4>
              <p className="mt-3 text-sm text-black">
                {card.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
