import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { fetchInstructorCourses } from "@/entities/course/model/courseDetailsAPI";
import { getInstructorData } from "@/entities/user/model/userAPI";
import InstructorChart from "../../features/dashboard/ui/InstructorChart";
import Img from "@/shared/components/ui/Img";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import { LinkButton } from "@/shared/components/ui/LinkButton";

export default function InstructorDashboard() {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [instructorData, setInstructorData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [page] = useState(1);
  const [searchTerm] = useState("");
  const [pageSize] = useState(9999);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const instructorApiData = await getInstructorData(token);
        const instructorCoursesApiData = await fetchInstructorCourses({
          token: token,
          page,
          limit: pageSize,
          search: searchTerm,
        });
        if (!mounted) return;
        //console.log("instructorApiData: ", instructorApiData, "instructorCoursesApiData: ", instructorCoursesApiData);
        setInstructorData(Array.isArray(instructorApiData) ? instructorApiData : []);
        setCourses(Array.isArray(instructorCoursesApiData?.data) ? instructorCoursesApiData?.data : []);
      } catch (err) {
        console.error("Instructor load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location.pathname, token]);

  const totalAmount = instructorData?.reduce(
    (acc, curr) => acc + (curr.totalAmountGenerated || 0),
    0
  );
  const totalStudents = instructorData?.reduce(
    (acc, curr) => acc + (curr.totalStudentsEnrolled || 0),
    0
  );

  const SkeletonCard = () => (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-3/4 rounded bg-gray-200/30" />
        <div className="h-4 w-1/3 rounded bg-gray-200/30" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="h-40 w-full rounded bg-gray-200/30" />
          <div className="h-28 w-full rounded-full bg-gray-200/30" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
      <DashboardHeader
        title={`Hi ${user?.firstName || "Instructor"}`}
        subtitle="Here's your instructor dashboard"
        background={backImg}
        showSearch={false}
        onSearch={null}
      />
      <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            <SkeletonCard />
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-1/3 rounded bg-gray-200/30" />
                <div className="mt-4 flex gap-4">
                  <div className="h-48 w-full rounded bg-gray-200/30" />
                  <div className="hidden sm:block h-48 w-80 rounded bg-gray-200/30" />
                </div>
              </div>
            </div>
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-5">
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6 min-h-[300px]">
                {totalAmount > 0 || totalStudents > 0 ? (
                  <InstructorChart courses={instructorData} />
                ) : (
                  <div className="h-full flex flex-col justify-center items-start gap-3">
                    <p className="mt-2 text-base text-black/70">Not enough data to visualize</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6">
                <p className="text-lg font-bold text-black mb-4">Statistics</p>
                <div className="space-y-4">
                  <div className="my-3">
                    <p className="text-sm text-black/70">Total Courses</p>
                    <p className="text-2xl font-semibold text-black">{courses.length}</p>
                  </div>
                  <div className="my-3">
                    <p className="text-sm text-black/70">Total Students</p>
                    <p className="text-2xl font-semibold text-black">{totalStudents}</p>
                  </div>
                  <div className="my-3">
                    <p className="text-sm text-black/70">Total Income</p>
                    <p className="text-2xl font-semibold text-black">Rs. {totalAmount ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-bold text-black">My Courses</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {courses.slice(0, 3).map((course) => (
                  <article key={course._id} className="flex flex-col rounded-lg overflow-hidden">
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
                      <Img
                        src={course.thumbnail}
                        alt={course.courseName}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-black line-clamp-2">{course.courseName}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-black/80">
                        <span>{course.studentsEnrolled?.length || 0} students</span>
                        <span>•</span>
                        <span>Rs. {course.price ?? 0}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-6">
                <LinkButton
                  to="/dashboard/my-courses"
                  className="btn-xl btn-purple group/btn btn-border-dark rounded-full"
                >
                  Explore More
                </LinkButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6 text-center">
            <p className="text-2xl font-bold text-black mb-3">You haven&apos;t created any courses yet</p>
            <Link to="/dashboard/add-course">
              <p className="text-lg font-semibold text-yellow-50 hover:underline">Create a course</p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
