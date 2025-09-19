// src/layouts/AuthLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="w-screen min-h-screen  flex flex-col">
            <Outlet />
        </div>
    );
}
