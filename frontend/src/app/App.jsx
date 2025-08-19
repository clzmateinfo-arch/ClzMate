import React, { Suspense } from "react";
import Navbar from "@/widgets/Navbar/Navbar";
import AppRoutes from "@/app/routes/router";
import ScrollToTop from "@/shared/components/navigation/ScrollToTop";
import BackToTop from "@/shared/components/navigation/BackToTop";

export default function App() {
    return (
        <div className="w-screen min-h-screen bg-richblack-900 flex flex-col">
            <Navbar />
            <ScrollToTop />
            <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
                <AppRoutes />
            </Suspense>
            <BackToTop />
        </div>
    );
}
