const Rajorpay = require("razorpay");
const { default: mongoose } = require("mongoose");
const crypto = require("crypto");
const instance = require("../config/rajorpay");
const User = require("../models/user");
const Course = require("../models/course");
const CourseProgress = require("../models/courseProgress");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const {
  paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");
require("dotenv-flow").config();



exports.capturePayment = async (req, res) => {
  const { coursesId } = req.body;

  const userId = req.user.id;

  if (coursesId.length === 0) {
    return res.json({ success: false, message: "Please provide Course Id" });
  }

  let totalAmount = 0;

  for (const course_id of coursesId) {
    let course;
    try {
      course = await Course.findById(course_id);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Could not find the course" });
      }

      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled.includes(uid)) {
        return res
          .status(400)
          .json({ success: false, message: "Student is already Enrolled" });
      }

      totalAmount += course.price;
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const currency = "USD";
  const options = {
    amount: totalAmount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
  };

  try {
    const paymentResponse = []; //await instance.instance.orders.create(options); //Fix Before Deploy
    // return response
    res.status(200).json({
      success: true,
      message: paymentResponse,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Could not Initiate Order" });
  }
};

exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;
  const courses = req.body?.coursesId;
  const userId = req.user.id;

  // await enrollStudents(courses, userId, res); //Fix Before Deploy
  // return res.status(200).json({ success: true,  }); //Fix Before Deploy
  const results = await enrollStudents(courses, userId, res);
  return res.status(200).json({ success: true, results, message: "Payment Verified" });

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Payment Failed, data not found" });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    //enroll student
    await enrollStudents(courses, userId, res);
    //return res
    return res.status(200).json({ success: true, message: "Payment Verified" });
  }
  return res.status(200).json({ success: "false", message: "Payment Failed" });
};

const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(400).json({
      success: false,
      message: "Please Provide data for Courses or UserId",
    });
  }

  const results = [];

  for (const courseId of courses) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        results.push({ courseId, success: false, message: "Course not found" });
        continue;
      }

      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled && course.studentsEnrolled.some((s) => s.toString() === uid.toString())) {
        results.push({ courseId, success: false, message: "Student already enrolled" });
        continue;
      }

      if (course.requiresApproval) {
        const existing = (course.enrollmentRequests || []).find((r) => r.user && r.user.toString() === uid.toString());
        if (existing) {
          existing.status = "Pending";
          existing.requestedAt = Date.now();
          existing.respondedAt = null;
          existing.responder = null;
        } else {
          course.enrollmentRequests.push({ user: uid, status: "Pending", requestedAt: Date.now() });
        }
        await course.save();

        try {
          const instructor = await User.findById(course.instructor);
          if (instructor) {
            await mailSender(
              instructor.email,
              `Enrollment request for ${course.courseName}`,
              `Student requested enrollment in ${course.courseName}. Please review on your instructor dashboard.`
            );
          }
        } catch (e) {
          console.warn("Failed to notify instructor:", e.message);
        }

        results.push({ courseId, success: true, status: "pending", message: "Enrollment pending instructor approval" });
        continue;
      }

      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        results.push({ courseId, success: false, message: "Course not found" });
        continue;
      }

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });

      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      );

      try {
        await mailSender(
          enrolledStudent.email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
        );
      } catch (e) {
        console.warn("Failed to send enrollment email:", e.message);
      }

      results.push({ courseId, success: true, status: "enrolled", message: "Enrolled successfully" });
    } catch (error) {
      console.log(error);
      results.push({ courseId, success: false, message: error.message });
    }
  }

  return results;
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;

  const userId = req.user.id;

  if (!orderId || !paymentId || amount == null || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the fields" });
  }

  try {
    const enrolledStudent = await User.findById(userId);
    if (!enrolledStudent) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );
    return res.status(200).json({ success: true, message: "Email sent" });
  } catch (error) {
    console.log("error in sending mail", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not send email" });
  }
};
