import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loading from "@/shared/components/navigation/Loading";

const RoleRoute = ({ allowedRoles, children }) => {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);

  if (token === null) return <Navigate to="/login" replace />;
  if (!user) return <Loading />;
  if (!allowedRoles.includes(user.accountType)) return <Navigate to="/dashboard" replace />;

  return children;
};

export default RoleRoute;
