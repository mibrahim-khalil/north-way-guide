import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import SearchResults from "../pages/SearchResults";
import HotelDetails from "../pages/HotelDetails";
import Guides from "../pages/Guides";
import GuideDetails from "../pages/GuideDetails";
import SpotDetails from "../pages/SpotDetails";
import ProductDetails from "../pages/ProductDetails";
import Profile from "../pages/Profile";
import RegisterService from "../pages/RegisterService";
import Orders from "../pages/Orders";
import Support from "../pages/Support";
import VerifyEmail from "../pages/VerifyEmail";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import RequireSeller from "./RequireSeller";


// pages
import Home from "../pages/Home";
import About from "../pages/About";
import Hotels from "../pages/Hotels";
import TouristSpots from "../pages/TouristSpots";
import Transport from "../pages/Transport";
import LocalProducts from "../pages/LocalProducts";
import TripPlanner from "../pages/TripPlanner";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import MyProducts from "../pages/MyProducts";
import MyVendorOrders from "../pages/MyVendorOrders";
import MyBookings from "../pages/MyBookings";
import SubmitPayment from "../pages/SubmitPayment";
import Weather from "../pages/Weather";
import Events from "../pages/Events"
import EventDetails from "../pages/EventDetails";
import Terms from "../pages/Terms";



export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />

        {/* Routes */}
        <Route path="/search" element={<SearchResults />} />
        <Route path="/trip-planner" element={<TripPlanner />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guides/:id" element={<GuideDetails />} />
        <Route path="/hotels/:id" element={<HotelDetails />} />
        <Route path="/tourist-spots" element={<TouristSpots />} />
        <Route path="/tourist-spots/:id" element={<SpotDetails />} />
        <Route path="/transport" element={<Transport />} />
        <Route path="/local-products" element={<LocalProducts />} />
        <Route path="/local-products/:id" element={<ProductDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register-service" element={<RegisterService />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/support" element={<Support />} />

        <Route element={<RequireSeller />}>
          <Route path="/register-service" element={<RegisterService />} />
          <Route path="/my-products" element={<MyProducts />} />
          <Route path="/my-vendor-orders" element={<MyVendorOrders />} />
        </Route>
        
        <Route path="/submit-payment" element={<SubmitPayment />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/weather" element={<Weather />} />

        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />

        <Route path="/terms" element={<Terms />} />


      </Route>
    </Routes>
  );
}