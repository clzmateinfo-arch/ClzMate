import { Outlet } from "react-router-dom";
import ScrollToTop from "@/shared/components/navigation/ScrollToTop";
import BackToTop from "@/shared/components/navigation/BackToTop";
import UserSidebar from "@/widgets/Navbar/UserSidebar";

export default function UserLayout() {
    return (
        <div className="w-screen min-h-screen  flex flex-col">
            <UserSidebar />
            <ScrollToTop />
            <main className="flex-1">
                <Outlet />
            </main>
            <BackToTop />
        </div>
    );
}
