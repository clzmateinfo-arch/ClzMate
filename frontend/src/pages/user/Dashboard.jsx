import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import Sidebar from "@/shared/components/navigation/Sidebar";
import Loading from "@/shared/components/navigation/Loading";

const Dashboard = () => {
  const { loading: authLoading } = useSelector((state) => state.auth);
  const { loading: profileLoading } = useSelector((state) => state.profile);

  if (profileLoading || authLoading) {
    return (
      <div className="mt-10">
        <Loading />
      </div>
    );
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default Dashboard;
