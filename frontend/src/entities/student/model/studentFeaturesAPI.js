import { apiConnector } from "@/shared/services/api/apiConnector";
import { resetCart } from "@/entities/cart/model/cartSlice";
import { setPaymentLoading } from "@/entities/course/model/courseSlice";
import { studentEndpoints, cartEndpoints } from "@/app/config/apis";
import { toast } from "react-hot-toast";

const {
  COURSE_VERIFY_API,
  STUDENT_DASHBOARD_API,
} = studentEndpoints;

const { CART_API } = cartEndpoints;

export async function buyCourse(
  token,
  coursesId,
  requiresApproval = false,
  _userDetails = null,
  navigate,
  dispatch
) {
  const toastId = toast.loading("Processing...");
  try {
    await verifyPayment({ coursesId, requiresApproval }, token, navigate, dispatch);
  } catch (err) {
    console.error("buyCourse error", err);
    toast.error(err?.message || "Could not complete purchase");
  } finally {
    toast.dismiss(toastId);
  }
}

async function verifyPayment(bodyData, token, navigate, dispatch) {
  const toastId = toast.loading("Verifying Payment....");
  dispatch(setPaymentLoading(true));

  try {
    const response = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Payment verify failed");
    }

    // Clear backend cart — resetCart only clears local state; without this, cart
    // page repopulates from server on next visit showing already-enrolled courses
    try {
      await apiConnector("POST", `${CART_API}/clear`, null, { Authorization: `Bearer ${token}` });
    } catch {
      // non-critical — local cart is still cleared below
    }
    dispatch(resetCart());

    // Determine navigation and messaging from actual per-course results, not from
    // bodyData.requiresApproval (which is caller-supplied and wrong for cart page)
    const results = response.data.results || [];
    const pendingCount = results.filter((r) => r.status === "pending").length;
    const enrolledCount = results.filter((r) => r.status === "enrolled").length;

    if (pendingCount > 0) {
      toast("Enrollment request submitted. Awaiting instructor approval.", { icon: "⏳" });
      if (enrolledCount > 0) {
        toast.success(`${enrolledCount} course(s) enrolled immediately.`);
      }
      navigate("/dashboard/enrollments/pending");
    } else {
      toast.success("Enrolled successfully.");
      navigate("/dashboard/enrolled-courses");
    }
  } catch (error) {
    console.log("PAYMENT VERIFY ERROR....", error);
    toast.error("Could not verify Payment");
  } finally {
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
  }
}

export async function fetchStudentDashboard(token) {
  try {
    const response = await apiConnector("GET", STUDENT_DASHBOARD_API, null, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Failed to fetch dashboard");
    }

    return response.data.data; // { studentData, courses }
  } catch (error) {
    console.error("FETCH_STUDENT_DASHBOARD ERROR", error);
    toast.error(error?.message ?? "Could not fetch dashboard");
    return null;
  }
}
