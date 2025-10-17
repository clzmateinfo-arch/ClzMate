# Software Requirements Specification (SRS) for ClzMate

## 1. Introduction

### 1.1 Purpose

This document provides a comprehensive overview of the functional and non-functional requirements for the ClzMate Minimum Viable Product (MVP). Its purpose is to serve as a foundational guide for all stakeholders, including developers, designers, testers, and project managers, ensuring a shared understanding of the system's intended capabilities and constraints.

### 1.2 Scope

ClzMate is an online learning and classroom management platform. This MVP focuses on delivering the core functionalities that enable instructors to create and manage educational content (courses and classrooms) and for students to consume that content, enroll in courses, and participate in classroom activities.

### 1.3 Glossary

| Term | Definition |
| :--- | :--- |
| **MVP** | **Minimum Viable Product**: A version of a product with just enough features to be usable by early customers who can then provide feedback for future product development. |
| **User Roles** | The system defines three primary user roles: **Student** (consumes content), **Instructor** (creates and manages content), and **Admin** (oversees the entire platform). |
| **OTP** | **One-Time Password**: A temporary, secure code sent to a user's email to verify their identity, typically during signup or password reset. |
| **Course** | A structured collection of educational content, including videos, documents, and quizzes, created by an Instructor. |
| **Classroom** | A virtual environment where an Instructor can manage a group of students and conduct activities like assignments and announcements. |

## 2. Functional Requirements

These requirements describe the specific behaviors and functions of the system, framed as user stories.

### 2.1 User Management and Authentication

| ID | User Story | Acceptance Criteria & Scenarios |
| :--- | :--- | :--- |
| 2.1.1 | As a new user, I want to sign up for an account. | **Criteria:**<br>- The system must provide a sign-up form collecting name, email, password, and account type (Student/Instructor).<br>- All fields must be validated (e.g., email format, password strength).<br>- The system must send a unique OTP to the user's email for verification.<br>- The user account is created but remains in an unverified state until the OTP is confirmed.<br>**Scenario:** A prospective student fills out the form, receives an email with an OTP, enters it on the verification screen, and their account is successfully created and verified. |
| 2.1.2 | As a registered user, I want to log in to my account. | **Criteria:**<br>- The system must provide a login form for email and password.<br>- It must authenticate credentials against the database.<br>- Upon success, the user is redirected to their respective dashboard (Student, Instructor, or Admin).<br>**Scenario:** An instructor enters their correct email and password and is taken to their dashboard where they can see their created courses. |
| 2.1.3 | As a logged-in user, I want to change my password. | **Criteria:**<br>- The user must access a "Change Password" form within their profile settings.<br>- The form requires the current password and a new password (with confirmation).<br>- The system validates the old password before updating to the new one.<br>**Scenario:** A student, wanting to update their password for security reasons, successfully changes it after providing their old password. |
| 2.1.4 | As a user who forgot my password, I want to reset it. | **Criteria:**<br>- A "Forgot Password" link on the login page prompts the user for their email.<br>- The system sends a unique, time-sensitive password reset link to the registered email.<br>- The link leads to a form where the user can set a new password without needing the old one.<br>**Scenario:** A user who cannot remember their password requests a reset link and successfully sets a new password via their email. |
| 2.1.5 | As an Admin, I want to manage all users. | **Criteria:**<br>- The Admin dashboard must feature a user management table with search and filter capabilities.<br>- The table must display key user details (Name, Email, Role, Status).<br>- The Admin can view, edit, and delete user profiles. |

### 2.2 Course Management

| ID | User Story | Acceptance Criteria & Scenarios |
| :--- | :--- | :--- |
| 2.2.1 | As an Instructor, I want to create and manage a course. | **Criteria:**<br>- Provide a multi-step form to create a course with a name, description, price, category, tags, and a thumbnail image.<br>- Allow the creation of hierarchical content: **Sections** (e.g., "Module 1") which contain **Subsections** (e.g., "Introduction to Topic A").<br>- Each subsection can contain video content, text, and downloadable materials.<br>- Instructors can edit, delete, and reorder sections and subsections. |
| 2.2.2 | As a user, I want to browse and view courses. | **Criteria:**<br>- A public catalog page must display all "Published" courses.<br>- Users can search for courses by name or description.<br>- Users can filter courses by category, price (free/paid), and skill level.<br>- Clicking a course shows a detailed view with its full curriculum, instructor bio, and student reviews. |
| 2.2.3 | As a Student, I want to enroll in a course. | **Criteria:**<br>- A student can enroll in a free course with a single click.<br>- For paid courses, the student is directed to a payment gateway to complete the purchase.<br>- Upon successful enrollment, the course appears on the student's dashboard. |
| 2.2.4 | As a Student, I want to track my course progress. | **Criteria:**<br>- The system must automatically track which subsections a student has completed.<br>- A progress bar on the student's dashboard and within the course view visually represents their completion percentage. |

### 2.3 Classroom Management

| ID | User Story | Acceptance Criteria & Scenarios |
| :--- | :--- | :--- |
| 2.3.1 | As an Instructor, I want to create and manage a classroom. | **Criteria:**<br>- Instructors can create a classroom, giving it a unique title and description.<br>- The system automatically generates a unique, shareable invite code for each classroom.<br>- The instructor dashboard lists all created classrooms. |
| 2.3.2 | As a Student, I want to join a classroom. | **Criteria:**<br>- A student can use an invite code to join the corresponding classroom.<br>- Once joined, the classroom appears on the student's dashboard. |
| 2.3.3 | As an Instructor, I want to post announcements. | **Criteria:**<br>- Instructors can create, edit, and delete announcements within a classroom.<br>- Announcements are visible to all members of the classroom on the classroom's main page. |
| 2.3.4 | As an Instructor, I want to manage assignments. | **Criteria:**<br>- Instructors can create assignments with a title, instructions, due date, and optional file attachments.<br>- Students can submit their work (text and files) before the due date.<br>- Instructors can view all submissions for an assignment and assign grades. |
| 2.3.5 | As an Instructor, I want to manage quizzes. | **Criteria:**<br>- Instructors can create quizzes with various question types (e.g., multiple-choice).<br>- Students can take quizzes, and the system automatically grades them and provides a score. |

## 3. Non-Functional Requirements

These requirements define the quality attributes and operational standards of the system.

| ID | Requirement | Description & Justification |
| :--- | :--- | :--- |
| 3.1 | **Performance** | All pages should load within 3 seconds on a standard internet connection. API responses should be returned in under 500ms for typical requests. This ensures a smooth and non-frustrating user experience. |
| 3.2 | **Scalability** | The system's architecture must support a 50% increase in concurrent users over a 6-month period without major re-architecting. This is crucial for accommodating business growth. |
| 3.3 | **Security** | All user passwords must be hashed and salted. The application must be protected against common web vulnerabilities like SQL Injection and Cross-Site Scripting (XSS). All payment transactions must be handled securely via the Razorpay integration, ensuring no sensitive financial data is stored on our servers. |
| 3.4 | **Usability** | The user interface must be intuitive and easy to navigate for users with basic computer literacy. Key actions should be easily discoverable. The design should be responsive, providing a consistent experience on desktops, tablets, and mobile devices. |
| 3.5 | **Reliability** | The system must have an uptime of at least 99.5%. Regular database backups must be performed to prevent data loss in case of a system failure. |