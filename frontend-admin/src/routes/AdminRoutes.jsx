import { Routes, Route, Navigate } from "react-router-dom";
import RequireAdmin from "./RequireAdmin";
import AdminLayout from "../layouts/AdminLayout";

// pages
import AdminLogin from "../pages/Auth/AdminLogin";
import Dashboard from "../pages/Dashboard";
import ManageHotels from "../pages/ManageHotels";
import ServiceApplications from "../pages/ServiceApplications";
import ManageSpots from "../pages/ManageSpots";
import ManageTransport from "../pages/ManageTransport";
import ManageGuides from "../pages/ManageGuides";
import ManageVendors from "../pages/ManageVendors";
import VendorProducts from "../pages/VendorProducts";
import ManageReviews from "../pages/ManageReviews";
import ManageOrders from "../pages/ManageOrders";
import Settings from "../pages/Settings";
import ManageHotelBookings from "../pages/ManageHotelBookings";
import ManageEvents from "../pages/ManageEvents";
import ManageReports from "../pages/ManageReports";

//  correct import (page is in ../pages)
import ManageWeatherUpdates from "../pages/ManageWeatherUpdates";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* root */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* public */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* protected */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="manage-hotels" element={<ManageHotels />} />
        <Route path="applications" element={<ServiceApplications />} />
        <Route path="manage-spots" element={<ManageSpots />} />
        <Route path="manage-transport" element={<ManageTransport />} />
        <Route path="manage-guides" element={<ManageGuides />} />
        <Route path="manage-vendors" element={<ManageVendors />} />
        <Route path="manage-orders" element={<ManageOrders />} />
        <Route path="vendor-products" element={<VendorProducts />} />
        <Route path="vendors/:vendorId/products" element={<VendorProducts />} />
        <Route path="manage-reviews" element={<ManageReviews />} />
        <Route path="settings" element={<Settings />} />
        <Route path="manage-hotel-bookings" element={<ManageHotelBookings />} />
        <Route path="manage-events" element={<ManageEvents />} />
        <Route path="manage-reports" element={<ManageReports />} />

        {/* IMPORTANT: NO leading slash here */}
        <Route path="manage-weather" element={<ManageWeatherUpdates />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}