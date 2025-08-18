import React, { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import OpenRoute from "@/components/core/Auth/OpenRoute";
import ProtectedRoute from "@/components/core/Auth/ProtectedRoute";
import { ACCOUNT_TYPE } from "@/utils/constants";

const Home = lazy(() => import("@/pages/Home"));
const Contact = lazy(() => import("@/pages/Contact"));
const About = lazy(() => import("@/pages/About"));
const Catalog = lazy(() => import("@/pages/Catalog"));
const CourseDetails = lazy(() => import("@/pages/CourseDetails"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const PageNotFound = lazy(() => import("@/pages/PageNotFound"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MyProfile = lazy(() => import("@/components/core/Dashboard/MyProfile"));
const Settings = lazy(() => import("@/components/core/Dashboard/Settings/Settings"));
const MyCourses = lazy(() => import("@/components/core/Dashboard/MyCourses"));
const EditCourse = lazy(() => import("@/components/core/Dashboard/EditCourse/EditCourse"));
const Instructor = lazy(() => import("@/components/core/Dashboard/Instructor"));
const Cart = lazy(() => import("@/components/core/Dashboard/Cart/Cart"));
const EnrolledCourses = lazy(() => import("@/components/core/Dashboard/EnrolledCourses"));
const AddCourse = lazy(() => import("@/components/core/Dashboard/AddCourse/AddCourse"));
const ViewCourse = lazy(() => import("@/pages/ViewCourse"));
const VideoDetails = lazy(() => import("@/components/core/ViewCourse/VideoDetails"));

export default function AppRoutes() {
    const { user } = useSelector((state) => state.profile);

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/catalog/:catalogName" element={<Catalog />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />

            {/* Open routes */}
            <Route
                path="/signup"
                element={
                    <OpenRoute>
                        <Signup />
                    </OpenRoute>
                }
            />
            <Route
                path="/login"
                element={
                    <OpenRoute>
                        <Login />
                    </OpenRoute>
                }
            />
            <Route
                path="/forgot-password"
                element={
                    <OpenRoute>
                        <ForgotPassword />
                    </OpenRoute>
                }
            />
            <Route
                path="/verify-email"
                element={
                    <OpenRoute>
                        <VerifyEmail />
                    </OpenRoute>
                }
            />
            <Route
                path="/update-password/:id"
                element={
                    <OpenRoute>
                        <UpdatePassword />
                    </OpenRoute>
                }
            />

            {/* Protected routes */}
            <Route
                path="/dashboard/*"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            >
                <Route path="my-profile" element={<MyProfile />} />
                <Route path="settings" element={<Settings />} />

                {user?.accountType === ACCOUNT_TYPE.STUDENT && (
                    <>
                        <Route path="cart" element={<Cart />} />
                        <Route path="enrolled-courses" element={<EnrolledCourses />} />
                    </>
                )}

                {user?.accountType === ACCOUNT_TYPE.INSTRUCTOR && (
                    <>
                        <Route path="instructor" element={<Instructor />} />
                        <Route path="add-course" element={<AddCourse />} />
                        <Route path="my-courses" element={<MyCourses />} />
                        <Route path="edit-course/:courseId" element={<EditCourse />} />
                    </>
                )}
            </Route>

            <Route
                path="/view-course/*"
                element={
                    <ProtectedRoute>
                        <ViewCourse />
                    </ProtectedRoute>
                }
            >
                {user?.accountType === ACCOUNT_TYPE.STUDENT && (
                    <Route
                        path=":courseId/section/:sectionId/sub-section/:subSectionId"
                        element={<VideoDetails />}
                    />
                )}
            </Route>

            {/* 404 */}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
}
