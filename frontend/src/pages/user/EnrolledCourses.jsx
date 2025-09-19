import { useState, useCallback } from "react";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import EnrolledCourseSlider from "@/features/dashboard/ui/EnrolledCourseSlider";
import NewCourses from "../../features/portfolio/ui/NewCourses";

export default function EnrolledCourses() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  return (
    <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
      <DashboardHeader
        title="Enrolled Courses"
        subtitle=""
        background={backImg}
        showSearch={true}
        onSearch={handleSearch}
      />
      <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
        <EnrolledCourseSlider searchTerm={searchTerm} />
        <div className="space-y-2 items-start min-h-[420px] shadow-md rounded-lg border border-white/8 bg-white/6">
          <NewCourses />
        </div>
      </div>
    </div>
  );
}