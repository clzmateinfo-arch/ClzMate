import { Outlet } from "react-router-dom";
import CourseSidebar from "../../widgets/Navbar/CourseSidebar";
import ScrollToTop from "@/shared/components/navigation/ScrollToTop";
import BackToTop from "@/shared/components/navigation/BackToTop";

export default function CourseLayout() {
  return (
    <div className="w-screen min-h-screen  flex flex-col">
      <CourseSidebar />
      <ScrollToTop />
      <main className="flex-1">
        <Outlet />
      </main>
      <BackToTop />
    </div>
  );
}
