import { Outlet } from "react-router-dom";
import ClassSidebar from "../../widgets/Navbar/ClassSidebar";
import ScrollToTop from "@/shared/components/navigation/ScrollToTop";
import BackToTop from "@/shared/components/navigation/BackToTop";

export default function ClassLayout() {
  return (
    <div className="w-screen min-h-screen  flex flex-col">
      <ClassSidebar />
      <ScrollToTop />
      <main className="flex-1">
        <Outlet />
      </main>
      <BackToTop />
    </div>
  );
}
