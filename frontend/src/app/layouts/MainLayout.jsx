// src/layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import ScrollToTop from "@/shared/components/navigation/ScrollToTop";
import BackToTop from "@/shared/components/navigation/BackToTop";

export default function MainLayout() {
    return (
        <div className="w-screen min-h-screen  flex flex-col">
            <Navbar />
            <ScrollToTop />
            <main className="flex-1">
                <Outlet />
            </main>
            <BackToTop />
        </div>
    );
}
