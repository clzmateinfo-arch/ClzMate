const { renderEmail, appLink, brandName, formatDateTime, formatPrice } = require("../layout");

const displayName = (name) => (typeof name === "string" && name.trim() ? name.trim() : "");

const securityNotice = (actionText) => [
  `If you did not ${actionText}, reset your password right away and contact us. Someone may have access to your account.`,
];

exports.otpEmail = ({ name, otp, ttlMinutes = 5 }) =>
  renderEmail({
    subject: `${otp} is your ${brandName()} verification code`,
    preheader: `Use ${otp} to verify your email. It expires in ${ttlMinutes} minutes.`,
    heading: "Verify your email address",
    greetingName: displayName(name),
    intro: [`Use this code to finish creating your ${brandName()} account:`],
    code: otp,
    codeCaption: `Expires in ${ttlMinutes} minutes`,
    notice: ["Never share this code with anyone. Our team will never ask you for it."],
    outro: ["If you did not try to sign up, you can safely ignore this email."],
    footerReason: "You received this email because this address was used to sign up.",
  });

exports.welcomeEmail = ({ name, accountType, isPendingApproval }) =>
  renderEmail({
    subject: `Welcome to ${brandName()}`,
    preheader: isPendingApproval ? "Your email is verified. Your instructor account is waiting for approval." : "Your email is verified. You can sign in now.",
    heading: `Welcome to ${brandName()}`,
    greetingName: displayName(name),
    intro: isPendingApproval
      ? [
          "Your email address is verified.",
          ["Your ", { strong: "instructor account is pending approval" }, ". You can sign in now. Course and classroom tools unlock as soon as an administrator approves your account, and we will email you when that happens."],
        ]
      : [
          "Your email address is verified and your account is ready.",
          accountType === "Instructor"
            ? "You can now create courses and classrooms for your students."
            : "Browse the catalog, enroll in courses and keep track of your progress from your dashboard.",
        ],
    cta: { label: "Sign in", url: appLink("/login") },
    footerReason: "You received this email because you created an account.",
  });

exports.passwordResetRequestEmail = ({ name, resetUrl, ttlMinutes = 15 }) =>
  renderEmail({
    subject: `Reset your ${brandName()} password`,
    preheader: `Use this link within ${ttlMinutes} minutes to choose a new password.`,
    heading: "Reset your password",
    greetingName: displayName(name),
    intro: [["We received a request to reset your password. This link works once and expires in ", { strong: `${ttlMinutes} minutes` }, "."]],
    cta: { label: "Choose a new password", url: resetUrl },
    notice: ["If you did not ask to reset your password, you can ignore this email. Your password stays the same."],
    footerReason: "You received this email because a password reset was requested for your account.",
  });

exports.passwordResetCompletedEmail = ({ name, at = new Date() }) =>
  renderEmail({
    subject: `Your ${brandName()} password was reset`,
    preheader: "Your password was just reset. You have been signed out everywhere.",
    heading: "Your password was reset",
    greetingName: displayName(name),
    intro: ["Your password was reset successfully. For your security, every device that was signed in has been signed out."],
    details: [{ label: "When", value: formatDateTime(at) }],
    cta: { label: "Sign in", url: appLink("/login") },
    notice: securityNotice("reset your password"),
    footerReason: "You received this security notice because your account password changed.",
  });

exports.passwordChangedEmail = ({ name, at = new Date() }) =>
  renderEmail({
    subject: `Your ${brandName()} password was changed`,
    preheader: "Your password was just changed from your account settings.",
    heading: "Your password was changed",
    greetingName: displayName(name),
    intro: ["The password for your account was changed from your account settings. Other devices have been signed out."],
    details: [{ label: "When", value: formatDateTime(at) }],
    cta: { label: "Forgot password? Reset it", url: appLink("/forgot-password") },
    notice: securityNotice("change your password"),
    footerReason: "You received this security notice because your account password changed.",
  });

const ENROLLMENT_REASONS = {
  free: "You are enrolled and can start learning right away.",
  payment: "Your payment was received and you are enrolled.",
  approved: "Good news: the instructor approved your enrollment request.",
};

exports.enrollmentConfirmedEmail = ({ name, courseName, instructorName, reason = "free" }) =>
  renderEmail({
    subject: `You're enrolled in ${courseName}`,
    preheader: `${ENROLLMENT_REASONS[reason] || ENROLLMENT_REASONS.free} ${courseName}`,
    heading: reason === "approved" ? "Your enrollment was approved" : "You're enrolled",
    greetingName: displayName(name),
    intro: [ENROLLMENT_REASONS[reason] || ENROLLMENT_REASONS.free],
    details: [
      { label: "Course", value: courseName, isEmphasized: true },
      { label: "Instructor", value: instructorName },
    ],
    cta: { label: "Start learning", url: appLink("/dashboard/enrolled-courses") },
    outro: ["You can find this course any time under Enrolled Courses in your dashboard."],
    footerReason: "You received this email because you enrolled in a course.",
  });

exports.enrollmentRequestInstructorEmail = ({ instructorName, studentName, studentEmail, courseName, courseId, requestedAt = new Date() }) =>
  renderEmail({
    subject: `New enrollment request for ${courseName}`,
    preheader: `${studentName || "A student"} asked to join ${courseName}.`,
    heading: "New enrollment request",
    greetingName: displayName(instructorName),
    intro: [[{ strong: studentName || "A student" }, " asked to enroll in your course. Review the request to approve or reject it."]],
    details: [
      { label: "Course", value: courseName, isEmphasized: true },
      { label: "Student", value: studentName },
      { label: "Email", value: studentEmail },
      { label: "Requested", value: formatDateTime(requestedAt) },
    ],
    cta: { label: "Review request", url: appLink(`/dashboard/course/${courseId}/requests`) },
    footerReason: "You received this email because you are the instructor of this course.",
  });

exports.enrollmentRequestStudentEmail = ({ name, courseName, instructorName }) =>
  renderEmail({
    subject: `Enrollment request sent: ${courseName}`,
    preheader: `Your request to join ${courseName} is waiting for the instructor.`,
    heading: "Your request was sent",
    greetingName: displayName(name),
    intro: ["This course needs instructor approval. We sent your request and will email you as soon as the instructor responds."],
    details: [
      { label: "Course", value: courseName, isEmphasized: true },
      { label: "Instructor", value: instructorName },
      { label: "Status", value: "Pending approval" },
    ],
    cta: { label: "View my requests", url: appLink("/dashboard/enrollments/pending") },
    footerReason: "You received this email because you requested to enroll in a course.",
  });

exports.enrollmentRejectedEmail = ({ name, courseName, note }) =>
  renderEmail({
    subject: `Update on your request for ${courseName}`,
    preheader: `Your enrollment request for ${courseName} was not approved.`,
    heading: "Enrollment request not approved",
    greetingName: displayName(name),
    intro: [["Unfortunately, the instructor did not approve your request to enroll in ", { strong: courseName }, "."]],
    quote: typeof note === "string" && note.trim() ? `Note from the instructor: ${note.trim()}` : undefined,
    cta: { label: "Browse other courses", url: appLink("/") },
    outro: ["You can send a new request from the course page at any time, for example when a new intake opens."],
    footerReason: "You received this email because you requested to enroll in a course.",
  });

exports.paymentReceiptEmail = ({ name, items = [], orderId, paymentId, paidAt = new Date() }) => {
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  return renderEmail({
    subject: `Payment receipt: ${formatPrice(total)}`,
    preheader: `We received your payment of ${formatPrice(total)}.`,
    heading: "Payment received",
    greetingName: displayName(name),
    intro: ["Thank you for your payment. Here is your receipt. Keep it for your records."],
    details: [
      ...items.map((item) => ({ label: item.courseName, value: formatPrice(item.price) })),
      { label: "Total paid", value: formatPrice(total), isEmphasized: true },
      { label: "Order ID", value: orderId },
      { label: "Payment ID", value: paymentId },
      { label: "Date", value: formatDateTime(paidAt) },
    ],
    cta: { label: "Go to my courses", url: appLink("/dashboard/enrolled-courses") },
    footerReason: "You received this receipt because you made a payment.",
  });
};

exports.contactMessageEmail = ({ fullName, email, phone, message, receivedAt = new Date() }) =>
  renderEmail({
    subject: `New contact message from ${fullName}`,
    preheader: `${fullName} sent a message through the contact form.`,
    heading: "New contact form message",
    greetingName: `${brandName()} team`,
    intro: ["Someone sent a message through the website contact form. Reply to this email to answer them directly."],
    details: [
      { label: "Name", value: fullName, isEmphasized: true },
      { label: "Email", value: email },
      { label: "Phone", value: phone },
      { label: "Received", value: formatDateTime(receivedAt) },
    ],
    quote: message,
    footerReason: "Sent from the contact form on the website.",
  });

exports.instructorApprovedEmail = ({ name }) =>
  renderEmail({
    subject: `Your ${brandName()} instructor account is approved`,
    preheader: "You can now create courses and classrooms.",
    heading: "You're approved to teach",
    greetingName: displayName(name),
    intro: ["An administrator approved your instructor account. Course and classroom tools are now unlocked."],
    cta: { label: "Create your first course", url: appLink("/dashboard/add-course") },
    footerReason: "You received this email because your account role changed.",
  });
