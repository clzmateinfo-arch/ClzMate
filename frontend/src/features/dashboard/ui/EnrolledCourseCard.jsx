 
import { useNavigate } from "react-router-dom";
import ProgressBar from "@ramonak/react-progress-bar";
import Img from "@/shared/components/ui/Img";

export default function EnrolledCourseCard({
    course,
    onOpenCourse = null,
    maxDescriptionLength = 90,
    showDuration = true,
    className = "",
}) {
    const navigate = useNavigate();
    const progress = Number(course?.progressPercentage) || 0;
    const sectionId = course?.courseContent?.[0]?._id;
    const subSectionId = course?.courseContent?.[0]?.subSection?.[0]?._id;
    const courseBase = course?._id ?? course?.id ?? "";

    const toPath =
        sectionId && subSectionId
            ? `/view-course/${courseBase}/section/${sectionId}/sub-section/${subSectionId}`
            : `/view-course/${courseBase}`;

    const open = (_e) => {
        if (onOpenCourse) return onOpenCourse(toPath);
        return navigate(toPath);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
        }
    };

    const desc =
        typeof course?.courseDescription === "string"
            ? course.courseDescription.length > maxDescriptionLength
                ? `${course.courseDescription.slice(0, maxDescriptionLength)}...`
                : course.courseDescription
            : "";

    return (
        <article
            className={`flex flex-col sm:flex-row sm:items-center border border-white/8 bg-white/6 px-4 py-4 rounded-lg transition-all hover:shadow-xs ${className}`}
        >
            <div
                role="link"
                tabIndex={0}
                onClick={open}
                onKeyDown={handleKeyDown}
                className="flex items-start gap-4 w-full sm:w-2/5 cursor-pointer"
                aria-label={`Open ${course?.courseName || "course"}`}
            >
                <Img
                    src={course?.thumbnail}
                    alt={course?.courseName || "Course image"}
                    className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                />

                <div className="min-w-0">
                    <p className="font-semibold text-richblack-900 truncate">
                        {course?.courseName ?? "Untitled Course"}
                    </p>
                    <p className="text-xs text-richblack-400 mt-1 line-clamp-2">{desc}</p>
                </div>
            </div>

            {showDuration ? (
                <div className="hidden sm:flex items-center justify-center w-1/4 px-2 text-sm text-richblack-600">
                    {course?.totalDuration ?? " "}
                </div>
            ) : null}

            <div className="w-full sm:flex-1 px-2 mt-3 sm:mt-0">
                <div className="flex items-center justify-between mb-2 text-xs text-richblack-500">
                    <div>Progress</div>
                    <div>{progress}%</div>
                </div>

                <ProgressBar
                    completed={progress}
                    height="10px"
                    isLabelVisible={false}
                    bgColor="#7C3AED"
                    baseBgColor="#E6E6F0"
                    borderRadius="999px"
                />
            </div>
        </article>
    );
}
