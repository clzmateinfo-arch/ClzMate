const BASE_URL = import.meta.env.VITE_APP_BASE_URL;

export const commanEndpoints = {
  SITE_STATS_API: BASE_URL + "/site/stats",
}

export const endpoints = {
  SENDOTP_API: BASE_URL + "/auth/sendotp",
  VERIFYOTP_API: BASE_URL + "/auth/verifyotp",
  SIGNUP_API: BASE_URL + "/auth/signup",
  LOGIN_API: BASE_URL + "/auth/login",
  RESETPASSTOKEN_API: BASE_URL + "/auth/reset-password-token",
  RESETPASSWORD_API: BASE_URL + "/auth/reset-password",
}

export const profileEndpoints = {
  GET_USER_DETAILS_API: BASE_URL + "/profile/getUserDetails",
  GET_USER_ENROLLED_COURSES_API: BASE_URL + "/profile/getEnrolledCourses",
  GET_INSTRUCTOR_DATA_API: BASE_URL + "/profile/instructorDashboard",
  GET_PUBLIC_PROFILE_API: BASE_URL + "/profile/public",
}

export const studentEndpoints = {
  COURSE_PAYMENT_API: BASE_URL + "/payment/capturePayment",
  COURSE_VERIFY_API: BASE_URL + "/payment/verifyPayment",
  SEND_PAYMENT_SUCCESS_EMAIL_API: BASE_URL + "/payment/sendPaymentSuccessEmail",
  STUDENT_DASHBOARD_API: BASE_URL + "/student/dashboard",
}

export const courseEndpoints = {
  GET_ALL_COURSE_API: BASE_URL + "/course/getAllCourses",
  COURSE_DETAILS_API: BASE_URL + "/course/getCourseDetails",
  EDIT_COURSE_API: BASE_URL + "/course/editCourse",
  COURSE_CATEGORIES_API: BASE_URL + "/course/showAllCategories",
  CREATE_COURSE_API: BASE_URL + "/course/createCourse",
  CREATE_SECTION_API: BASE_URL + "/course/addSection",
  CREATE_SUBSECTION_API: BASE_URL + "/course/addSubSection",
  UPDATE_SECTION_API: BASE_URL + "/course/updateSection",
  UPDATE_SUBSECTION_API: BASE_URL + "/course/updateSubSection",
  GET_ALL_INSTRUCTOR_COURSES_API: BASE_URL + "/course/getInstructorCourses",
  DELETE_SECTION_API: BASE_URL + "/course/deleteSection",
  DELETE_SUBSECTION_API: BASE_URL + "/course/deleteSubSection",
  DELETE_COURSE_API: BASE_URL + "/course/deleteCourse",
  GET_FULL_COURSE_DETAILS_AUTHENTICATED: BASE_URL + "/course/getFullCourseDetails",
  LECTURE_COMPLETION_API: BASE_URL + "/course/updateCourseProgress",
  CREATE_RATING_API: BASE_URL + "/course/createRating",
  GET_ASSET_URL_API: BASE_URL + "/course/getAssetUrl",
  GET_NOTES_API: BASE_URL + "/course/getNote",
  CREATE_NOTES_API: BASE_URL + "/course/saveNote",
  GET_ENROLLMENT_REQUESTS: BASE_URL + "/course/enrollmentRequests",
  RESPOND_ENROLLMENT_REQUEST: BASE_URL + "/course/enrollmentRequests",
  REQUEST_ENROLLMENT: BASE_URL + "/course/requestEnrollment",
  GET_USER_ENROLLMENT_REQUESTS: BASE_URL + "/course/enrollment-requests",
  TOGGLE_PUBLISH_API: BASE_URL + "/course/togglePublish"
}

export const ratingsEndpoints = {
  REVIEWS_DETAILS_API: BASE_URL + "/course/getReviews",
}

export const categories = {
  CATEGORIES_API: BASE_URL + "/course/showAllCategories",
}

export const catalogData = {
  CATALOGPAGEDATA_API: BASE_URL + "/course/getCategoryPageDetails",
}

export const contactusEndpoint = {
  CONTACT_US_API: BASE_URL + "/reach/contact",
}

export const settingsEndpoints = {
  UPDATE_DISPLAY_PICTURE_API: BASE_URL + "/profile/updateUserProfileImage",
  UPDATE_PROFILE_API: BASE_URL + "/profile/updateProfile",
  CHANGE_PASSWORD_API: BASE_URL + "/auth/changepassword",
  DELETE_PROFILE_API: BASE_URL + "/profile/deleteProfile",
}

export const adminEndpoints = {
  GET_USERS: BASE_URL + "/admin/getAllUsers",
  UPDATE_USER: BASE_URL + "/admin/updateUser",
  DELETE_USER: BASE_URL + "/admin/deleteUser",
  CREATE_CATEGORY: BASE_URL + "/course/createCategory",
  GET_CATEGORIES: BASE_URL + "/course/showAllCategories",
  UPDATE_CATEGORY: BASE_URL + "/course/updateCategory",
  DELETE_CATEGORY: BASE_URL + "/course/deleteCategory",
};

export const cartEndpoints = {
  CART_API: BASE_URL + "/cart",
};

export const classroomEndpoints = {
  CREATE_CLASSROOM_API: BASE_URL + "/classroom/create",
  GET_MY_CLASSROOMS_API: BASE_URL + "/classroom/my",
  JOIN_CLASSROOM_API: BASE_URL + "/classroom/join",
  GET_CLASS_OVERVIEW_API: BASE_URL + "/classroom",
  CREATE_TOPIC_API: BASE_URL + "/classroom",
  LIST_TOPICS_API: BASE_URL + "/classroom",
  MANAGE_TOPICS_API: BASE_URL + "/classroom/topics",
  ASSIGNMENTS_API: `${BASE_URL}/classroom/assignments`,
};
