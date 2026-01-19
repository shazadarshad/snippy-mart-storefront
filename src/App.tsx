import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/PageTransition";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AdminAuthPage from "./pages/admin/AdminAuthPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <Navbar onCartOpen={() => setCartOpen(true)} />}
      {!isAdminRoute && <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/products" element={<PageTransition><ProductsPage /></PageTransition>} />
          <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
          <Route path="/order-success" element={<PageTransition><OrderSuccessPage /></PageTransition>} />
          <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />

          {/* Admin Routes */}
          <Route path="/admin/auth" element={<PageTransition><AdminAuthPage /></PageTransition>} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>

      {!isAdminRoute && <Footer />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
