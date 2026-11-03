import { lazy, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import OpenRoute from "@/features/auth/ui/OpenRoute";
import ProtectedRoute from "@/features/auth/ui/ProtectedRoute";
import RoleRoute from "@/features/auth/ui/RoleRoute";
import MainLayout from "@/app/layouts/MainLayout";
import UserLayout from "@/app/layouts/UserLayout";
import AuthLayout from "@/app/layouts/AuthLayout";
import CourseLayout from "@/app/layouts/CourseLayout";
import ClassLayout from "@/app/layouts/ClassLayout";

import { ACCOUNT_TYPE } from "@/utils/constants";
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
const StudentDashboard = lazy(() => import("@/pages/user/StudentDashboard"));
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
const ManageLinkCourse = lazy(() => import("@/pages/classroom/ManageLinkCourse"));
const ViewClassroom = lazy(() => import("@/pages/classroom/ViewClassroom"));
const AssignmentSubmissions = lazy(() => import("@/pages/classroom/AssignmentSubmissions"));
const QuizPlayer = lazy(() => import("@/features/classroom/ui/Quiz/QuizPlayer"));

function RedirectToRole() {
    const { user, loading: profileLoading } = useSelector((s) => s.profile);
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setTimedOut(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    if (timedOut) return <Navigate to="/" replace />;
    if (profileLoading || !user) return <Loading />;

    if (user.accountType === ACCOUNT_TYPE.ADMIN)
        return <Navigate to="/dashboard/admin-controls/users" replace />;
    if (user.accountType === ACCOUNT_TYPE.INSTRUCTOR)
        return <Navigate to="/dashboard/instructor" replace />;
    return <Navigate to="/dashboard/student" replace />;
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<AuthLayout />}>
                <Route path="/signup" element={<OpenRoute><SignUp /></OpenRoute>} />
                <Route path="/login" element={<OpenRoute><SignIn /></OpenRoute>} />
                <Route path="/forgot-password" element={<OpenRoute><ForgotPassword /></OpenRoute>} />
                <Route path="/verify-email" element={<OpenRoute><VerifyEmail /></OpenRoute>} />
                <Route path="/update-password/:id" element={<OpenRoute><UpdatePassword /></OpenRoute>} />
            </Route>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/catalog/:catalogId" element={<Catalog />} />
                <Route path="/courses/:courseId" element={<CourseDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/profile/public/:id" element={<PublicProfile />} />
            </Route>
            <Route element={<UserLayout />}>
                <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                    <Route index element={<RedirectToRole />} />

                    <Route path="my-profile" element={<MyProfile />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="admin-controls/users" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.ADMIN]}><ManageUsers /></RoleRoute>} />
                    <Route path="admin-controls/categories" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.ADMIN]}><ManageCategories /></RoleRoute>} />
                    <Route path="student" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.STUDENT]}><StudentDashboard /></RoleRoute>} />
                    <Route path="enrolled-courses" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.STUDENT]}><EnrolledCourses /></RoleRoute>} />
                    <Route path="enrollments/pending" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.STUDENT]}><PendingEnrollments /></RoleRoute>} />
                    <Route path="my-classrooms" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.STUDENT]}><StudentClassrooms /></RoleRoute>} />
                    <Route path="instructor" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><InstructorDashboard /></RoleRoute>} />
                    <Route path="add-course" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><AddCourse /></RoleRoute>} />
                    <Route path="my-courses" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><InstructorCourses /></RoleRoute>} />
                    <Route path="edit-course/:courseId" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><EditCourse /></RoleRoute>} />
                    <Route path="course/:courseId/requests" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><EnrollmentRequests /></RoleRoute>} />
                    <Route path="classrooms" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><InstructorClassrooms /></RoleRoute>} />
                </Route>
            </Route>
            <Route path="/view-course/*" element={<ProtectedRoute><CourseLayout /></ProtectedRoute>}>
                <Route path=":courseId/section/:sectionId/sub-section/:subSectionId" element={<ViewCourse />} />
            </Route>
            <Route path="/classroom/*" element={<ProtectedRoute><ClassLayout /></ProtectedRoute>}>
                <Route path=":classroomId/overview" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR, ACCOUNT_TYPE.STUDENT]}><ClassroomOverview /></RoleRoute>} />
                <Route path=":classroomId/classwork" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><ClassroomClasswork /></RoleRoute>} />
                <Route path=":classroomId/classwork/manage-assignment/:topicId" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><ManageAssignment /></RoleRoute>} />
                <Route path=":classroomId/classwork/assignment/:assignmentId/edit" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><ManageAssignment /></RoleRoute>} />
                <Route path=":classroomId/classwork/assignment/:assignmentId/submissions" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><AssignmentSubmissions /></RoleRoute>} />
                <Route path=":classroomId/classwork/manage-quiz/:topicId" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><ManageQuiz /></RoleRoute>} />
                <Route path=":classroomId/classwork/quiz/:quizId/edit" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><ManageQuiz /></RoleRoute>} />
                <Route path=":classroomId/classwork/manage-link-course/:topicId" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><ManageLinkCourse /></RoleRoute>} />
                <Route path=":classroomId/classwork/link-course/:linkId/edit" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR]}><ManageLinkCourse /></RoleRoute>} />
                <Route path=":classroomId/view" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.STUDENT]}><ViewClassroom /></RoleRoute>} />
                <Route path=":classroomId/quizz/:quizId/play" element={<RoleRoute allowedRoles={[ACCOUNT_TYPE.INSTRUCTOR, ACCOUNT_TYPE.STUDENT]}><QuizPlayer /></RoleRoute>} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
}
