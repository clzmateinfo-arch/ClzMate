# Database Schema for ClzMate

## 1. Introduction

### 1.1 Purpose

This document provides a detailed description of the MongoDB database schema used by the ClzMate application. It is intended for developers to understand the data structures, relationships, and conventions used for data persistence.

### 1.2 Technology

-   **Database**: **MongoDB**, a NoSQL database that stores data in flexible, JSON-like documents.
-   **ODM**: **Mongoose**, which provides a schema-based modeling environment for MongoDB, enforcing data structure and providing a clear interface for database interactions.

### 1.3 Conventions

-   **`_id`**: Each document has a unique `_id` of type `ObjectId`, which serves as its primary key.
-   **References**: Relationships between collections are maintained using `ObjectId` references. For example, the `instructor` field in a `courses` document stores the `_id` of a document in the `users` collection.
-   **Timestamps**: Many schemas automatically include `createdAt` and `updatedAt` fields to track the lifecycle of a document.

## 2. Core Collections

### 2.1 `users`

This collection stores the primary record for every individual who can log in to the platform.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | The unique identifier for the user. |
| `preferredName` | String | The user's display name. |
| `firstName`, `lastName` | String | The user's legal first and last name. |
| `email` | String | The user's email address, used for login. **Must be unique.** |
| `password` | String | The user's password, stored as a secure `bcrypt` hash. |
| `accountType` | String | Defines the user's role. Enum: `["Admin", "Instructor", "Student"]`. |
| `approved` | Boolean | (Admin-controlled) Whether the user is approved to use the platform. |
| `additionalDetails` | ObjectId | A reference to this user's corresponding document in the `profiles` collection. |
| `courses` | [ObjectId] | An array of `_id`s referencing the courses the user is enrolled in. |
| `image` | String | A URL pointing to the user's profile picture (hosted on Cloudinary). |
| `courseProgress` | [ObjectId] | An array of `_id`s referencing documents in the `courseprogresses` collection. |

**Example `users` Document:**
```json
{
  "_id": "60c72b2f9b1d8c001f8e4d2a",
  "preferredName": "Jane I.",
  "email": "jane.instructor@example.com",
  "password": "bcrypt_hash_of_password",
  "accountType": "Instructor",
  "approved": true,
  "additionalDetails": "60c72b2f9b1d8c001f8e4d2b",
  "courses": [],
  "image": "https://res.cloudinary.com/demo/image/upload/v1623665711/profile_jane.jpg"
}
```

### 2.2 `profiles`

This collection stores supplementary, non-essential information about a user.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | The unique identifier for the profile. |
| `gender` | String | The user's self-identified gender. |
| `dateOfBirth` | String | The user's date of birth. |
| `about` | String | A short biography or description written by the user. |
| `contactNumber` | String | The user's phone number. |

### 2.3 `courses`

This collection contains all the information about a specific course.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | The unique identifier for the course. |
| `courseName` | String | The public name of the course. |
| `courseDescription` | String | A detailed description of the course content and objectives. |
| `instructor` | ObjectId | A reference to the `_id` of the instructor in the `users` collection. |
| `courseContent` | [ObjectId] | An array of `_id`s referencing the `sections` that make up this course. |
| `price` | Number | The cost of the course. `0` for free courses. |
| `thumbnail` | String | A URL to the course's cover image (hosted on Cloudinary). |
| `category` | ObjectId | A reference to the `_id` of the course's category in the `categories` collection. |
| `studentsEnrolled` | [ObjectId] | An array of `_id`s referencing the `users` who are enrolled in this course. |
| `status` | String | The publication status of the course. Enum: `["Draft", "Published"]`. |

## 3. Classroom-Related Collections

### 3.1 `classrooms`

Stores the top-level information for a virtual classroom.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | The unique identifier for the classroom. |
| `title` | String | The name of the classroom. |
| `owner` | ObjectId | A reference to the `_id` of the instructor who owns the classroom. |
| `inviteCode` | String | A unique, randomly generated code for students to join. |
| `members` | [Sub-document] | An array of objects, each containing a user `_id` and their `role` in the class. |
| `topics` | [ObjectId] | An array of `_id`s referencing the `topics` within this classroom. |

### 3.2 `topics`

Represents a module or unit within a classroom.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | The unique identifier for the topic. |
| `classroom` | ObjectId | A reference back to the parent `classrooms` document. |
| `title` | String | The name of the topic (e.g., "Week 1: Introduction"). |
| `items` | [Sub-document] | An array of materials, assignments, or quizzes associated with this topic. |

### 3.3 `assignments`

Contains the details for a specific assignment.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | The unique identifier for the assignment. |
| `topic` | ObjectId | A reference back to the parent `topics` document. |
| `title` | String | The title of the assignment. |
| `instructions` | String | Detailed instructions for the assignment. |
| `dueDate` | Date | The deadline for submissions. |
| `points` | Number | The maximum possible score for the assignment. |

### 3.4 `submissions`

Stores a student's work for a given assignment.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | The unique identifier for the submission. |
| `assignment` | ObjectId | A reference to the `assignments` document this submission is for. |
| `student` | ObjectId | A reference to the `users` document of the student who submitted. |
| `content` | String | The text content of the submission. |
| `attachments` | [Sub-document] | An array of files submitted by the student. |
| `submittedAt` | Date | The timestamp of when the submission was made. |
| `grade` | Number | The grade assigned by the instructor. |
| `feedback` | String | Feedback provided by the instructor. |