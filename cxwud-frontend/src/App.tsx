import { Navigate, Route, Routes } from "react-router-dom";
import "./components/Layout.css";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import ProductListPage from "./pages/ProductListPage";
import CartPage from "./pages/CartPage";
import ViewProductDetail from "./pages/ViewProductDetail";
import ContactPage from "./pages/ContactPage";
import DeliveryPage from "./pages/DeliveryPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import "../src/styles/toast.css";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManagement from "./pages/admin/UserManagement";
import ProductManagement from "./pages/pm/ProductManagement";
import ProductTypeManagement from "./pages/pm/ProductTypeManagement";
import OrderStatistics from "./pages/pm/OrderStatistics";

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/product/:id" element={<ViewProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout/delivery" element={<DeliveryPage />} />
          <Route path="/checkout/payment" element={<PaymentPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          <Route
            path="/checkout/confirmation"
            element={<OrderConfirmationPage />}
          />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Dashboard Routes */}
        <Route
          path="/management"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="pm/products" element={<ProductManagement />} />
          <Route path="pm/product-types" element={<ProductTypeManagement />} />
          <Route path="pm/statistics" element={<OrderStatistics />} />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </ToastProvider>
  </AuthProvider>
);

export default App;
