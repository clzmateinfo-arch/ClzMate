
# API Specification

## 1. Introduction

This document provides a specification for the RESTful API of the ClzMate MVP.

## 2. Authentication

All API endpoints that require authentication expect a JSON Web Token (JWT) to be included in the `Authorization` header of the request.

`Authorization: Bearer <your_jwt>`

## 3. API Endpoints

### 3.1 User Authentication

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | Register a new user. |
| `POST` | `/api/v1/auth/login` | Log in a user. |
| `POST` | `/api/v1/auth/sendotp` | Send an OTP to the user's email for verification. |
| `POST` | `/api/v1/auth/changepassword` | Change the password of a logged-in user. |
| `POST` | `/api/v1/auth/reset-password-token` | Send a password reset token to the user's email. |
| `POST` | `/api/v1/auth/reset-password` | Reset the user's password using a reset token. |

### 3.2 Courses

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/course/createCourse` | Create a new course. |
| `GET` | `/api/v1/course/getAllCourses` | Get a list of all courses. |
| `POST` | `/api/v1/course/getCourseDetails` | Get the details of a specific course. |
| `POST` | `/api/v1/course/editCourse` | Edit an existing course. |
| `DELETE` | `/api/v1/course/deleteCourse` | Delete a course. |
| `GET` | `/api/v1/course/getInstructorCourses` | Get a list of courses for the logged-in instructor. |

### 3.3 Classrooms

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/classroom/create` | Create a new classroom. |
| `GET` | `/api/v1/classroom/my` | Get a list of classrooms for the logged-in user. |
| `GET` | `/api/v1/classroom/:id` | Get the details of a specific classroom. |
| `POST` | `/api/v1/classroom/join` | Join a classroom using an invite code. |
| `POST` | `/api/v1/classroom/:classroomId/announcements` | Create an announcement in a classroom. |
| `POST` | `/api/v1/classroom/:topicId/assignments` | Create an assignment in a classroom. |
| `POST` | `/api/v1/classroom/:topicId/quizzes` | Create a quiz in a classroom. |

### 3.4 Payments

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/payments/capturePayment` | Capture a payment for a course enrollment. |
| `POST` | `/api/v1/payments/verifyPayment` | Verify a payment. |

### 3.5 Profile

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `PUT` | `/api/v1/profile/updateProfile` | Update the profile of the logged-in user. |
| `GET` | `/api/v1/profile/getUserDetails` | Get the details of the logged-in user. |
| `GET` | `/api/v1/profile/getEnrolledCourses` | Get a list of enrolled courses for the logged-in user. |
| `PUT` | `/api/v1/profile/updateUserProfileImage` | Update the profile image of the logged-in user. |
| `GET` | `/api/v1/profile/instructorDashboard` | Get the instructor dashboard data. |

### 3.6 Admin

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/admin/getAllUsers` | Get a list of all users. |
| `POST` | `/api/v1/admin/updateUser` | Update a user's account. |
| `POST` | `/api/v1/admin/deleteUser` | Delete a user's account. |
