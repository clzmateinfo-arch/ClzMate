import { useEffect, useState } from "react";
import { VscAdd } from "react-icons/vsc";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchInstructorCourses } from "@/entities/course/model/courseDetailsAPI";
import IconBtn from "@/shared/components/ui/IconBtn";
import CoursesTable from "@/features/courceManager/ui/CoursesTable";

export default function UserCourses() {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getAllCourses = async () => {
      setLoading(true);
      const result = await fetchInstructorCourses(token);
      setLoading(false);
      if (result) {
        setCourses(result);
      }
    };
    getAllCourses();
  }, [useLocation().pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [useLocation().pathname]);

  return (
    <div>
      <div className="mb-14 flex justify-between">
        <h1 className="text-4xl font-medium text-black text-center lg:text-left">
          My Courses
        </h1>
        <IconBtn
          text="Add Course"
          onclick={() => navigate("/dashboard/add-course")}
        >
          <VscAdd />
        </IconBtn>
      </div>

      {/* course Table */}
      {courses && (
        <CoursesTable
          courses={courses}
          setCourses={setCourses}
          loading={loading}
          setLoading={setLoading}
        />
      )}
    </div>
  );
}
