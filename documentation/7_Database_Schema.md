
# Database Schema

## 1. Introduction

This document describes the database schema for the ClzMate MVP. The schema is designed to store all the data for the application in a structured and efficient manner.

## 2. Database

The application uses **MongoDB**, a NoSQL database, to store its data. The schema is defined using **Mongoose**, an ODM library for Node.js.

## 3. Collections

### 3.1 `users`

Stores information about the users of the application.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the user. |
| `preferredName` | String | The user's preferred name. |
| `firstName` | String | The user's first name. |
| `lastName` | String | The user's last name. |
| `email` | String | The user's email address (unique). |
| `password` | String | The user's hashed password. |
| `accountType` | String | The user's account type (`Admin`, `Instructor`, or `Student`). |
| `active` | Boolean | Whether the user's account is active. |
| `approved` | Boolean | Whether the user's account is approved. |
| `additionalDetails` | ObjectId | A reference to the user's profile in the `profiles` collection. |
| `courses` | Array | An array of ObjectIds referencing the courses the user is enrolled in. |
| `image` | String | The URL of the user's profile image. |
| `token` | String | The user's JWT. |
| `courseProgress` | Array | An array of ObjectIds referencing the user's course progress. |

### 3.2 `courses`

Stores information about the courses offered on the platform.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the course. |
| `courseName` | String | The name of the course. |
| `courseDescription` | String | A description of the course. |
| `instructor` | ObjectId | A reference to the instructor of the course in the `users` collection. |
| `whatYouWillLearn` | String | A summary of what students will learn in the course. |
| `courseContent` | Array | An array of ObjectIds referencing the sections of the course. |
| `ratingAndReviews` | Array | An array of ObjectIds referencing the ratings and reviews of the course. |
| `price` | Number | The price of the course. |
| `thumbnail` | String | The URL of the course's thumbnail image. |
| `category` | ObjectId | A reference to the category of the course in the `categories` collection. |
| `studentsEnrolled` | Array | An array of ObjectIds referencing the students enrolled in the course. |

### 3.3 `classrooms`

Stores information about the classrooms created by instructors.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the classroom. |
| `title` | String | The title of the classroom. |
| `description` | String | A description of the classroom. |
| `owner` | ObjectId | A reference to the owner of the classroom in the `users` collection. |
| `inviteCode` | String | The invite code for the classroom. |
| `members` | Array | An array of objects representing the members of the classroom. |

### 3.4 `assignments`

Stores information about the assignments created in classrooms.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the assignment. |
| `topic` | ObjectId | A reference to the topic of the assignment in the `topics` collection. |
| `title` | String | The title of the assignment. |
| `instructions` | String | The instructions for the assignment. |
| `dueDate` | Date | The due date of the assignment. |
| `points` | Number | The maximum points for the assignment. |
| `attachments` | Array | An array of objects representing the attachments for the assignment. |

### 3.5 `quizzes`

Stores information about the quizzes created in classrooms.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the quiz. |
| `topic` | ObjectId | A reference to the topic of the quiz in the `topics` collection. |
| `title` | String | The title of the quiz. |
| `description` | String | A description of the quiz. |
| `timeLimit` | Number | The time limit for the quiz in minutes. |
| `shuffle` | Boolean | Whether the questions in the quiz should be shuffled. |
| `screens` | Array | An array of objects representing the questions in the quiz. |

### 3.6 `submissions`

Stores information about the submissions for assignments.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the submission. |
| `assignment` | ObjectId | A reference to the assignment in the `assignments` collection. |
| `student` | ObjectId | A reference to the student who made the submission in the `users` collection. |
| `content` | String | The content of the submission. |
| `attachments` | Array | An array of objects representing the attachments for the submission. |
| `submittedAt` | Date | The date and time the submission was made. |
| `grade` | Number | The grade for the submission. |
| `feedback` | String | The feedback for the submission. |
