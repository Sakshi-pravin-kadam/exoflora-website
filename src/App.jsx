import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import CategoryPage from "./CategoryPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/category/:categorySlug"
        element={<CategoryPage />}
      />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;