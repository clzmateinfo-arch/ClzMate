const crypto = require("crypto");
const User = require("../models/user");
const Course = require("../models/course");
const mailSender = require("../utils/mailSender");
const { paymentReceiptEmail } = require("../mail/templates");
const { enrollStudentInCourses } = require("../utils/enrollment");
const { isObjectIdArray } = require("../utils/validators");

const CURRENCY = "USD";
const MAX_IDENTIFIER_LENGTH = 100;

const isFreeCourse = (course) => course.price === 0;

const isStubbedPaymentAllowed = () =>
  process.env.NODE_ENV !== "production" && process.env.ALLOW_STUBBED_PAYMENT === "true";

const isShortString = (value) => typeof value === "string" && value.length > 0 && value.length <= MAX_IDENTIFIER_LENGTH;

function isSignatureValid(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function resolvePaymentAuthorization(body) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  const hasSignatureFields = [orderId, paymentId, signature].every(isShortString) && signature.length <= 128;

  if (process.env.RAZORPAY_SECRET && hasSignatureFields) {
    return isSignatureValid(orderId, paymentId, signature) ? "verified" : "invalid";
  }
  return isStubbedPaymentAllowed() ? "stubbed" : "unconfigured";
}

async function loadPublishedCourses(courseIds) {
  const uniqueIds = [...new Set(courseIds)];
  const courses = await Course.find({ _id: { $in: uniqueIds }, status: "Published" }).select("price courseName studentsEnrolled");
  return { uniqueIds, courses, allFound: courses.length === uniqueIds.length };
}

exports.capturePayment = async (req, res) => {
  try {
    const { coursesId } = req.body || {};
    const userId = req.user.id;

    if (!isObjectIdArray(coursesId)) {
      return res.status(400).json({ success: false, message: "coursesId must be a non-empty array of valid course ids" });
    }

    const { courses, allFound } = await loadPublishedCourses(coursesId);
    if (!allFound) {
      return res.status(404).json({ success: false, message: "Could not find the course" });
    }
    if (courses.some((course) => course.studentsEnrolled.some((studentId) => String(studentId) === String(userId)))) {
      return res.status(400).json({ success: false, message: "Student is already Enrolled" });
    }

    const totalAmount = courses.reduce((sum, course) => sum + (Number(course.price) || 0), 0);
    const receipt = `rcpt_${userId}_${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: [],
      data: { totalAmount, currency: CURRENCY, receipt },
    });
  } catch (error) {
    console.error("capturePayment error", error);
    return res.status(500).json({ success: false, message: "Could not Initiate Order" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const body = req.body || {};
    const userId = req.user.id;

    if (!isObjectIdArray(body.coursesId)) {
      return res.status(400).json({ success: false, message: "coursesId must be a non-empty array of valid course ids" });
    }

    const { uniqueIds, courses, allFound } = await loadPublishedCourses(body.coursesId);
    if (!allFound) {
      return res.status(404).json({ success: false, message: "One or more courses were not found or are unavailable" });
    }

    let authorization = "free";
    if (!courses.every(isFreeCourse)) {
      authorization = resolvePaymentAuthorization(body);
      if (authorization === "invalid") {
        return res.status(400).json({ success: false, message: "Payment signature verification failed" });
      }
      if (authorization === "unconfigured") {
        return res.status(402).json({ success: false, message: "Payment gateway not configured" });
      }
    }

    const results = await enrollStudentInCourses(uniqueIds, userId);
    if (authorization === "verified") await sendPaymentReceipt(userId, courses, results, body);
    return res.status(200).json({ success: true, results, message: "Payment Verified" });
  } catch (error) {
    console.error("verifyPayment error", error);
    return res.status(500).json({ success: false, message: "Could not verify payment" });
  }
};

async function sendPaymentReceipt(userId, courses, results, body) {
  try {
    const paidCourseIds = new Set(results.filter((result) => result.success).map((result) => String(result.courseId)));
    const items = courses
      .filter((course) => !isFreeCourse(course) && paidCourseIds.has(String(course._id)))
      .map((course) => ({ courseName: course.courseName, price: course.price }));
    if (items.length === 0) return;

    const student = await User.findById(userId).select("email firstName preferredName");
    if (!student) return;
    await mailSender.sendTemplate(
      student.email,
      paymentReceiptEmail({
        name: student.preferredName || student.firstName,
        items,
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
      })
    );
  } catch (error) {
    console.error("Failed to send payment receipt:", error.message);
  }
}
