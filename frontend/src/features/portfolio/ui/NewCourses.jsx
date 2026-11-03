import { LinkButton } from "@/shared/components/ui/LinkButton";
import CourseGrid from "@/shared/components/ui/CourseGrid";
import Loading from "@/shared/components/navigation/Loading";
import { usePublicResource } from "@/shared/snapshot/dataCache";

export function NewCourses() {
    const { data, isSettled } = usePublicResource("newCourses");
    const courses = (data ?? []).slice(0, 3);
    const loading = !isSettled;

    function onAddToCart() {}

    return (
        <section className="relative bg-white py-10 xl:py-10 overflow-visible">
            <div className="mt-20 relative container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="gap-x-8 xl:gap-x-16 items-center">
                    <div className="space-y-4">
                        <span className="inline-flex mb-1 rounded-full px-2.5 py-0.5 text-xs tracking-wide font-extrabold text-black bg-gradient-to-br from-green-300/50 to-green-300/50 ring-1 ring-green-500/35">
                            NEW!
                        </span>

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#0b1220]">
                            New Courses
                        </h2>

                        <p className="text-lg text-[#374151] max-w-2xl mb-10">
                            Discover top curated courses loved by our students practical, hands-on, and instructor led
                        </p>

                        {loading ? (
                            <div className="py-8">
                                <div className="flex justify-center">
                                    <Loading />
                                </div>
                            </div>
                        ) : (
                            <CourseGrid cards={courses} onAddToCart={onAddToCart} />
                        )}

                        <div className="mt-6 mr-5 flex justify-end">
                            <LinkButton
                                to="/catalog/all"
                                className="btn-xl group/btn btn-border-dark rounded-full"
                                variant="light"
                            >
                                Explore More
                            </LinkButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default NewCourses;
