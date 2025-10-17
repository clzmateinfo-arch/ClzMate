# API Specification for ClzMate

## 1. Introduction

This document provides a detailed specification for the ClzMate RESTful API. It is intended for developers building clients or integrations that interact with the ClzMate platform.

### 1.1 Base URL

All API endpoints are prefixed with the following base URL:
`/api/v1`

### 1.2 Authentication

Most endpoints require authentication. Authenticated requests must include an `Authorization` header containing a JSON Web Token (JWT) provided upon login.

**Format**: `Authorization: Bearer <your_jwt>`

### 1.3 Role-Based Access

-   **(S)** - Accessible by Students.
-   **(I)** - Accessible by Instructors.
-   **(A)** - Accessible by Admins.
-   **(Public)** - No authentication required.

## 2. API Endpoints

---

### 2.1 Authentication (`/auth`)

#### **POST `/auth/signup`**
Registers a new user.
-   **Request Body**:
    ```json
    {
      "preferredName": "John D.",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "password": "a-strong-password",
      "confirmPassword": "a-strong-password",
      "accountType": "Student",
      "otp": "123456"
    }
    ```
-   **Success Response (201)**:
    ```json
    {
      "success": true,
      "message": "User registered and verified successfully",
      "email": "john.doe@example.com"
    }
    ```

#### **POST `/auth/login`**
Authenticates a user and returns a JWT.
-   **Request Body**:
    ```json
    {
      "email": "john.doe@example.com",
      "password": "a-strong-password"
    }
    ```
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "user": { "...user object..." },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "message": "User logged in successfully"
    }
    ```

---

### 2.2 Courses (`/course`)

#### **GET `/course/getAllCourses` (Public)**
Retrieves a paginated and filterable list of all published courses.
-   **Query Parameters**: `?page=1&limit=10&search=React`
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": {
        "courses": [ "...array of course objects..." ],
        "total": 15,
        "page": 1,
        "limit": 10,
        "totalPages": 2
      }
    }
    ```

#### **POST `/course/createCourse` (I)**
Creates a new course. Requires `multipart/form-data` for the thumbnail image.
-   **Request Body (form-data)**: `courseName`, `courseDescription`, `price`, `category`, `thumbnailImage` (file), etc.
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": { "...new course object..." },
      "message": "New Course created successfully"
    }
    ```

---

### 2.3 Classrooms (`/classroom`)

#### **POST `/classroom/create` (I)**
Creates a new classroom.
-   **Request Body**:
    ```json
    {
      "title": "Introduction to Web Development",
      "description": "A beginner's course on HTML, CSS, and JavaScript."
    }
    ```
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": { "...new classroom object with inviteCode..." }
    }
    ```

#### **POST `/classroom/join` (S, I)**
Allows a user to join a classroom using an invite code.
-   **Request Body**:
    ```json
    {
      "inviteCode": "a1b2c3d4"
    }
    ```
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": { "...classroom object..." }
    }
    ```

#### **GET `/classroom/:classroomId/overview` (S, I)**
Retrieves an overview of a classroom, including recent announcements and upcoming assignments.
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": {
        "classroom": { "...classroom details..." },
        "announcements": [ "...announcements..." ],
        "upcomingAssignments": [ "...assignments..." ],
        "counts": { "members": 15, "topics": 5, "assignments": 10 }
      }
    }
    ```

---

### 2.4 Payments (`/payments`)

#### **POST `/payments/capturePayment` (S)**
Initiates the payment process for one or more courses.
-   **Request Body**:
    ```json
    {
      "coursesId": ["course_id_1", "course_id_2"]
    }
    ```
-   **Success Response (200)**: Returns payment gateway order details.

#### **POST `/payments/verifyPayment` (S)**
Verifies the payment after completion on the payment gateway.
-   **Request Body**: Contains payment gateway specific details like `razorpay_order_id`, `razorpay_payment_id`, etc.
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "message": "Payment Verified"
    }
    ```

---

### 2.5 Profile (`/profile`)

#### **PUT `/profile/updateProfile` (S, I, A)**
Updates the profile of the currently authenticated user.
-   **Request Body**:
    ```json
    {
      "firstName": "Johnathan",
      "additionalDetails": {
        "about": "I am a passionate learner."
      }
    }
    ```
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "updatedUserDetails": { "...updated user object..." },
      "message": "Profile updated successfully"
    }
    ```

#### **GET `/profile/getEnrolledCourses` (S)**
Retrieves the list of courses the student is enrolled in, along with their progress.
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": {
        "courses": [
          {
            "_id": "course_id",
            "courseName": "Full Stack Web Development",
            "progressPercentage": 75,
            "...other course details..."
          }
        ],
        "total": 1
      }
    }
    ```

---

### 2.6 Admin (`/admin`)

#### **POST `/admin/getAllUsers` (A)**
Retrieves a paginated list of all users on the platform.
-   **Request Body**:
    ```json
    {
      "q": "john",
      "page": 1,
      "limit": 20
    }
    ```
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": {
        "users": [ "...array of user objects..." ],
        "total": 5,
        "page": 1,
        "limit": 20
      }
    }
    ```