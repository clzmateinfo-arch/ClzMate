import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import CategoriesPanel from "@/features/admin/ui/CategoriesPanel";

export default function ManageCategories() {
    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
            <DashboardHeader
                title="Admin Console"
                subtitle="Manage categories and platform settings"
                background={backImg}
                showSearch={false}
            />

            <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[80%] lg:max-w-[90%] md:max-w-[95%] sm:max-w-[100%]">
                <div className="flex flex-col gap-6">
                    <section className="m-4 rounded-2xl bg-white/6 border border-white/8 backdrop-blur-md p-6 shadow-sm w-full">
                        <h2 className="text-lg font-semibold text-richblack-900 mb-4">Categories</h2>
                        <CategoriesPanel />
                    </section>
                </div>
            </div>
        </div>
    );
}
