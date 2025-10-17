
# Software Requirements Specification (SRS)

## 1. Introduction

This document outlines the functional and non-functional requirements for the ClzMate MVP. ClzMate is an online learning platform designed to provide features for students, instructors, and administrators.

## 2. Functional Requirements

### 2.1 User Management

| ID | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| 2.1.1 | As a new user, I want to be able to sign up for an account so that I can access the platform. | - The system shall provide a sign-up form that collects the user's name, email, password, and account type (Student or Instructor).<br>- The system shall validate the provided information.<br>- The system shall send an OTP to the user's email for verification.<br>- Upon successful OTP verification, the system shall create a new user account. |
| 2.1.2 | As a registered user, I want to be able to log in to my account so that I can access my dashboard and other features. | - The system shall provide a login form that accepts the user's email and password.<br>- The system shall authenticate the user's credentials.<br>- Upon successful authentication, the system shall grant the user access to their account. |
| 2.1.3 | As a logged-in user, I want to be able to change my password so that I can keep my account secure. | - The system shall provide a form for changing the password.<br>- The system shall require the user to enter their old password and a new password.<br>- The system shall validate the old password before updating it to the new one. |
| 2.1.4 | As a user who has forgotten my password, I want to be able to reset it so that I can regain access to my account. | - The system shall provide a "Forgot Password" feature.<br>- The system shall send a password reset link to the user's email.<br>- The user shall be able to set a new password by clicking the link. |
| 2.1.5 | As an administrator, I want to be able to view a list of all users so that I can manage user accounts. | - The system shall provide a user management interface for administrators.<br>- The interface shall display a list of all registered users with their details. |
| 2.1.6 | As an administrator, I want to be able to update a user's account information so that I can manage user roles and status. | - The system shall allow administrators to update a user's account type, and active/approved status. |
| 2.1.7 | As an administrator, I want to be able to delete a user's account so that I can remove users from the platform. | - The system shall allow administrators to delete user accounts. |

### 2.2 Course Management

| ID | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| 2.2.1 | As an instructor, I want to be able to create a new course so that I can offer it to students. | - The system shall provide a form for creating a new course.<br>- The form shall include fields for course name, description, price, category, and thumbnail image.<br>- The system shall allow instructors to add sections and subsections to the course. |
| 2.2.2 | As an instructor, I want to be able to edit an existing course so that I can update its content. | - The system shall allow instructors to edit the details of their courses.<br>- The system shall allow instructors to add, update, and delete sections and subsections. |
| 2.2.3 | As an instructor, I want to be able to view a list of all my courses so that I can manage them. | - The system shall provide a dashboard for instructors to view and manage their courses. |
| 2.2.4 | As a user, I want to be able to view a list of all available courses so that I can choose which ones to enroll in. | - The system shall display a list of all published courses.<br>- The system shall provide options for filtering and sorting the courses. |
| 2.2.5 | As a user, I want to be able to view the details of a course so that I can learn more about it. | - The system shall display the course details, including the curriculum, instructor, and reviews. |
| 2.2.6 | As a student, I want to be able to enroll in a course so that I can access its content. | - The system shall allow students to enroll in courses.<br>- For paid courses, the system shall require payment before granting access. |
| 2.2.7 | As a student, I want to be able to track my progress in a course so that I can see how much I have completed. | - The system shall track the student's progress in each course.<br>- The system shall display the progress on the student's dashboard. |

### 2.3 Classroom Management

| ID | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| 2.3.1 | As an instructor, I want to be able to create a classroom so that I can manage a group of students. | - The system shall allow instructors to create classrooms with a title and description.<br>- The system shall generate an invite code for each classroom. |
| 2.3.2 | As a student, I want to be able to join a classroom using an invite code so that I can participate in the class. | - The system shall allow students to join a classroom by entering the invite code. |
| 2.3.3 | As an instructor, I want to be able to create announcements in a classroom so that I can communicate with the students. | - The system shall allow instructors to post announcements in the classroom. |
| 2.3.4 | As an instructor, I want to be able to create assignments in a classroom so that I can assess the students' learning. | - The system shall allow instructors to create assignments with a title, description, due date, and attachments. |
| 2.3.5 | As a student, I want to be able to submit my assignments so that the instructor can grade them. | - The system shall allow students to submit their assignments with text and file attachments. |
| 2.3.6 | As an instructor, I want to be able to create quizzes in a classroom so that I can test the students' knowledge. | - The system shall allow instructors to create quizzes with multiple-choice questions. |
| 2.3.7 | As a student, I want to be able to take quizzes so that I can test my knowledge. | - The system shall allow students to take quizzes and view their scores. |

### 2.4 Payment Management

| ID | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| 2.4.1 | As a student, I want to be able to pay for a course so that I can enroll in it. | - The system shall integrate with a payment gateway (Razorpay) to process payments.<br>- The system shall securely handle the payment process. |
| 2.4.2 | As a student, I want to be able to view my payment history so that I can keep track of my purchases. | - The system shall provide a payment history page for students. |

### 2.5 Profile Management

| ID | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| 2.5.1 | As a user, I want to be able to view and update my profile so that I can keep my personal information up to date. | - The system shall provide a profile page where users can view and edit their personal information.<br>- The system shall allow users to upload a profile picture. |
| 2.5.2 | As a user, I want to be able to view my enrolled courses on my dashboard so that I can easily access them. | - The system shall display a list of enrolled courses on the user's dashboard. |

## 3. Non-Functional Requirements

| ID | Requirement | Description |
| :--- | :--- | :--- |
| 3.1 | **Performance** | The system should be able to handle a reasonable number of concurrent users without significant degradation in performance. Page load times should be within acceptable limits. |
| 3.2 | **Scalability** | The architecture of the system should be scalable to accommodate future growth in the number of users and courses. |
| 3.3 | **Security** | The system shall ensure the security of user data and financial transactions. All sensitive data should be encrypted. The system should be protected against common web vulnerabilities. |
| 3.4 | **Usability** | The user interface should be intuitive and easy to use. The system should be accessible to users with disabilities. |
| 3.5 | **Reliability** | The system should be available 24/7 with minimal downtime. The system should have a backup and recovery plan in place. |
