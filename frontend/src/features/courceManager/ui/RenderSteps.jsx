 
import { useSelector } from "react-redux";
import CourseBuilderForm from "@/features/courceManager/ui/CourseBuilder/CourseBuilderForm";
import CourseInformationForm from "@/features/courceManager/ui/CourseInformation/CourseInformationForm";
import PublishCourse from "@/features/courceManager/ui/PublishCourse/PublishCourse";
import StepCard from "../../../shared/components/navigation/StepCard";

export default function RenderSteps() {
  const { step } = useSelector((state) => state.course);

  const steps = [
    {
      id: 1,
      title: "Course Information",
      short: "Basics",
      desc: "Add title, description, price, thumbnail and tags. This is the primary information learners see.",
    },
    {
      id: 2,
      title: "Course Builder",
      short: "Sections & lectures",
      desc: "Create sections, add lectures (video / resources) and arrange the course flow for learners.",
    },
    {
      id: 3,
      title: "Publish",
      short: "Visibility & final checks",
      desc: "Choose whether the course is public or draft and publish once you're ready.",
    },
  ];

  return (
    <>
      <div className="mb-6">
        <div className="md:hidden">
          {steps.map((s) => {
            if (s.id !== step) return null;
            const state = step > s.id ? "done" : step === s.id ? "active" : "future";
            return (
              <StepCard
                key={s.id}
                id={s.id}
                title={s.title}
                short={s.short}
                desc={s.desc}
                state={state}
                compact={true}
              />
            );
          })}
        </div>

        <div className="hidden md:grid md:grid-cols-3 gap-3">
          {steps.map((s) => {
            const state = step > s.id ? "done" : step === s.id ? "active" : "future";
            return (
              <div key={s.id} className="relative">
                <StepCard
                  id={s.id}
                  title={s.title}
                  short={s.short}
                  desc={s.desc}
                  state={state}
                />
                {s.id !== steps.length && (
                  <div className="absolute top-1/2 right-[-1.5rem] w-[48px] h-px">
                    <div
                      className={`h-px w-full ${step > s.id ? "bg-yellow-50" : step === s.id ? "bg-violet-500" : "bg-white/12"
                        }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-violet-950">
            {steps.find((st) => st.id === step)?.title ?? "Course Step"}
          </h2>
        </div>
      </div>

      <div className="rounded-2xl">
        {step === 1 && <CourseInformationForm />}
        {step === 2 && <CourseBuilderForm />}
        {step === 3 && <PublishCourse />}
      </div>
    </>
  );
}
