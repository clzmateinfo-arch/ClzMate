import { Outlet } from "react-router-dom";
import LeftViewerNav from "@/features/courseViewer/LeftViewerNav";

export default function CourseViewerLayout() {
    return (
        <div className="min-h-screen w-screen bg-slate-900 text-white">
            <div className="fixed left-0 top-0 z-50">
                <LeftViewerNav />
            </div>
            <main className="ml-20"> {/* leave space for left nav */}
                <Outlet />
            </main>
        </div>
    );
}
