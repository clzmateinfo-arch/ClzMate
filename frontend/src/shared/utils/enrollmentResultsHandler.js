// enrollmentResultsHandler.js
import { toast } from "react-hot-toast";

/**
 * `results` is an array of { courseId, status: 'pending'|'enrolled' }
 * - navigate is react-router navigate function
 * - options: { showToast: true, onEnrolled: fn }
 */
export const handleEnrollmentResults = (results = [], navigate, options = {}) => {
    const pending = results.filter((r) => r.status === "pending");
    const enrolled = results.filter((r) => r.status === "enrolled");

    if (enrolled.length > 0) {
        // default behavior: go to enrolled courses overview or specific course
        if (options.onEnrolled) options.onEnrolled(enrolled);
        else {
            toast.success("Enrollment successful");
            // navigate to enrolled courses list
            navigate("/dashboard/enrolled-courses");
        }
    }

    if (pending.length > 0) {
        if (options.showToast !== false) toast("Enrollment pending approval", { icon: "⏳" });
        // navigate to pending page
        navigate("/dashboard/enrollments/pending");
    }
};
