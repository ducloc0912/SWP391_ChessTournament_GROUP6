import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// allowedRoles là mảng các quyền được phép, ví dụ: ['Admin', 'Staff']
const PrivateRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  // 1. Chưa đăng nhập -> Đá về Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check Role (Nếu route yêu cầu role cụ thể)
  // Nếu allowedRoles được truyền vào và role hiện tại không nằm trong đó
  if (
    allowedRoles &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(role?.toLowerCase())
  ) {
    // Đá về trang 403 hoặc Home
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Hợp lệ -> Render nội dung
  return <Outlet />;
};

export default PrivateRoute;
