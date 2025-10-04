import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import OpenRoute from "@/features/auth/ui/OpenRoute";
import ProtectedRoute from "@/features/auth/ui/ProtectedRoute";
import MainLayout from "@/app/layouts/MainLayout";
import UserLayout from "@/app/layouts/UserLayout";
import AuthLayout from "@/app/layouts/AuthLayout";
import CourseLayout from "@/app/layouts/CourseLayout";
import ClassLayout from "@/app/layouts/ClassLayout";

import { ACCOUNT_TYPE } from "@/utils/constants";
import StudentDashboard from "../../pages/user/StudentDashboard";
import Loading from "@/shared/components/navigation/Loading";

const SignIn = lazy(() => import("@/pages/auth/SignIn"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const UpdatePassword = lazy(() => import("@/pages/auth/UpdatePassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));

const Home = lazy(() => import("@/pages/main/Home"));
const Contact = lazy(() => import("@/pages/main/Contact"));
const About = lazy(() => import("@/pages/main/About"));
const Catalog = lazy(() => import("@/pages/main/Catalog"));
const CourseDetails = lazy(() => import("@/pages/main/CourseDetails"));
const Cart = lazy(() => import("@/pages/main/Cart"));

const Dashboard = lazy(() => import("@/pages/user/Dashboard"));
const MyProfile = lazy(() => import("@/pages/user/MyProfile"));
const Settings = lazy(() => import("@/pages/user/Settings"));
const PublicProfile = lazy(() => import("@/pages/user/PublicProfile"));
const InstructorDashboard = lazy(() => import("@/pages/user/InstructorDashboard"));
const EnrolledCourses = lazy(() => import("@/pages/user/EnrolledCourses"));

const ManageUsers = lazy(() => import("@/pages/admin/ManageUsers"));
const ManageCategories = lazy(() => import("@/pages/admin/ManageCategories"));

const EditCourse = lazy(() => import("@/pages/course/EditCourse"));
const AddCourse = lazy(() => import("@/pages/course/AddCourse"));
const InstructorCourses = lazy(() => import("@/pages/course/InstructorCourses"));
const ViewCourse = lazy(() => import("@/pages/course/ViewCourse"));

const EnrollmentRequests = lazy(() => import("@/pages/user/EnrollmentRequests"));

const PageNotFound = lazy(() => import("@/pages/common/PageNotFound"));
const PendingEnrollments = lazy(() => import("@/pages/user/PendingEnrollments"));

const InstructorClassrooms = lazy(() => import("@/pages/classroom/InstructorClassrooms"));
const StudentClassrooms = lazy(() => import("@/pages/classroom/StudentClassrooms"));
const ClassroomOverview = lazy(() => import("@/pages/classroom/ClassroomOverview"));
const ClassroomClasswork = lazy(() => import("@/pages/classroom/ClassroomClasswork"));
const ManageAssignment = lazy(() => import("@/pages/classroom/ManageAssignment"));
const ManageQuiz = lazy(() => import("@/pages/classroom/ManageQuiz"));

export default function AppRoutes() {
    const { user, loading: profileLoading } = useSelector((state) => state.profile);

    const RedirectToRole = () => {
        if (profileLoading || !user) return <Loading />;

        if (user.accountType === ACCOUNT_TYPE.ADMIN) {
            return <Navigate to="/dashboard/admin-controls/users" replace />;
        }
        if (user.accountType === ACCOUNT_TYPE.STUDENT) {
            return <Navigate to="/dashboard/student" replace />;
        }
        if (user.accountType === ACCOUNT_TYPE.INSTRUCTOR) {
            return <Navigate to="/dashboard/instructor" replace />;
        }
        return <Navigate to="/dashboard/student" replace />;
    };

    return (
        <Routes>
            {/* Auth */}
            <Route element={<AuthLayout />}>
                <Route path="/signup" element={<OpenRoute><SignUp /></OpenRoute>} />
                <Route path="/login" element={<OpenRoute><SignIn /></OpenRoute>} />
                <Route path="/forgot-password" element={<OpenRoute><ForgotPassword /></OpenRoute>} />
                <Route path="/verify-email" element={<OpenRoute><VerifyEmail /></OpenRoute>} />
                <Route path="/update-password/:id" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
            </Route>

            {/* MainLayout */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/catalog/:catalogId" element={<Catalog />} />
                <Route path="/courses/:courseId" element={<CourseDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/profile/public/:id" element={<PublicProfile />} />
            </Route>

            {/* UserLayout */}
            <Route element={<UserLayout />}>
                <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                    <Route index element={<RedirectToRole />} />

                    <Route path="my-profile" element={<MyProfile />} />
                    <Route path="settings" element={<Settings />} />

                    {user?.accountType === ACCOUNT_TYPE.ADMIN && (
                        <>
                            <Route path="admin-controls/users" element={<ManageUsers />} />
                            <Route path="admin-controls/categories" element={<ManageCategories />} />
                        </>
                    )}

                    {user?.accountType === ACCOUNT_TYPE.STUDENT && (
                        <>
                            <Route path="student" element={<StudentDashboard />} />
                            <Route path="enrolled-courses" element={<EnrolledCourses />} />
                            <Route path="enrollments/pending" element={<PendingEnrollments />} />
                            <Route path="my-classrooms" element={<StudentClassrooms />} />
                        </>
                    )}

                    {user?.accountType === ACCOUNT_TYPE.INSTRUCTOR && (
                        <>
                            <Route path="instructor" element={<InstructorDashboard />} />
                            <Route path="add-course" element={<AddCourse />} />
                            <Route path="my-courses" element={<InstructorCourses />} />
                            <Route path="edit-course/:courseId" element={<EditCourse />} />
                            <Route path="course/:courseId/requests" element={<EnrollmentRequests />} />
                            <Route path="classrooms" element={<InstructorClassrooms />} />
                        </>
                    )}
                </Route>
            </Route>

            {/* CourseLayout */}
            <Route path="/view-course/*" element={<ProtectedRoute><CourseLayout /></ProtectedRoute>}>
                <Route path=":courseId/section/:sectionId/sub-section/:subSectionId" element={<ViewCourse />} />
            </Route>

            {/* ClassLayout */}
            <Route path="/classroom/*" element={<ProtectedRoute><ClassLayout /></ProtectedRoute>}>
                <Route path=":classroomId/overview" element={<ClassroomOverview />} />
                <Route path=":classroomId/classwork" element={<ClassroomClasswork />} />
                <Route path=":classroomId/classwork/manage-assignment/:topicId" element={<ManageAssignment />} />
                <Route path=":classroomId/classwork/assignment/:assignmentId/edit" element={<ManageAssignment />} />
                <Route path=":classroomId/classwork/manage-quiz/:topicId" element={<ManageQuiz />} />
                <Route path=":classroomId/classwork/quiz/:quizId/edit" element={<ManageQuiz />} />
            </Route>


            {/* Errors */}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
}
