// UserCourses.jsx
import React, { useState, useCallback } from "react";
import { VscAdd } from "react-icons/vsc";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import IconBtn from "@/shared/components/ui/IconBtn";
import InstructorCourseSlider from "../../features/dashboard/ui/InstructorCourseSlider";
import { ACCOUNT_TYPE } from "@/utils/constants";

export default function UserCourses() {
  const { user } = useSelector((s) => s.profile);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const canAddCourse = user?.accountType === ACCOUNT_TYPE.INSTRUCTOR;

  return (
    <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
      <DashboardHeader
        title="My Courses"
        subtitle=""
        background={backImg}
        showSearch={true}
        onSearch={handleSearch}
      />

      <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
        <div className="mb-6 flex justify-between items-center">
          {canAddCourse && (
            <IconBtn
              text="Add Course"
              onclick={() => navigate("/dashboard/add-course")}
              customClasses="bg-violet-600"
            >
              <VscAdd />
            </IconBtn>
          )}
        </div>

        <InstructorCourseSlider searchTerm={searchTerm} />
      </div>
    </div>
  );
}
