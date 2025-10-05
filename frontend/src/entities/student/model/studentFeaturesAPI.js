import { apiConnector } from "@/shared/services/api/apiConnector";
import { resetCart } from "@/entities/cart/model/cartSlice";
import { setPaymentLoading } from "@/entities/course/model/courseSlice";
import { studentEndpoints } from "@/app/config/apis";
import { toast } from "react-hot-toast";

const {
  COURSE_VERIFY_API,
  SEND_PAYMENT_SUCCESS_EMAIL_API,
  STUDENT_DASHBOARD_API,
} = studentEndpoints;

export async function buyCourse(
  token,
  coursesId,
  requiresApproval = false,
  userDetails = null,
  navigate,
  dispatch
) {
  const toastId = toast.loading("Processing...");
  try {
    // For now we are bypassing Razorpay (stub flow). Send email & verify API.
    // In production you'd create order with COURSE_PAYMENT_API and open Razorpay.
    await sendPaymentSuccessEmail(
      { razorpay_order_id: "null", razorpay_payment_id: "null" },
      0,
      token
    );

    // verifyPayment will call COURSE_VERIFY_API which adds the courses to user and clears cart
    await verifyPayment({ coursesId, requiresApproval }, token, navigate, dispatch);
  } catch (err) {
    console.error("buyCourse error", err);
    toast.error(err?.message || "Could not complete purchase");
  } finally {
    toast.dismiss(toastId);
  }
}

async function sendPaymentSuccessEmail(response, amount, token) {
  try {
    await apiConnector(
      "POST",
      SEND_PAYMENT_SUCCESS_EMAIL_API,
      {
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        amount,
      },
      {
        Authorization: `Bearer ${token}`,
      }
    );
  } catch (error) {
    console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
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

    toast.success("Payment Successful, You are added to the course");
    bodyData?.requiresApproval ? navigate("/dashboard/enrollments/pending") : navigate("/dashboard/enrolled-courses");

    dispatch(resetCart());
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
