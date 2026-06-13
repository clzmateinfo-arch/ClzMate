 
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  if (token !== null) {
    return children;
  }

  return <Navigate to="/" />;
};

export default ProtectedRoute;
