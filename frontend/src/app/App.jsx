import React, { Suspense } from "react";
import Navbar from "@/components/common/Navbar";
import AppRoutes from "./router";
import ScrollToTop from "@/components/common/ScrollToTop";
import BackToTop from "@/components/common/BackToTop";

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
