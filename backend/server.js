import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./src/routes/auth.routes.js";
import spotsRoutes from "./src/routes/spots.routes.js";
import transportRoutes from "./src/routes/transport.routes.js";
import applicationsRoutes from "./src/routes/applications.routes.js";
import adminApplicationsRoutes from "./src/routes/adminApplications.routes.js";
import hotelsRoutes from "./src/routes/hotels.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import myHotelsRoutes from "./src/routes/myHotels.routes.js";
import uploadsRoutes from "./src/routes/uploads.routes.js";
import applicationsGuideRoutes from "./src/routes/applicationsGuide.routes.js";
import guidesRoutes from "./src/routes/guides.routes.js";
import myGuidesRoutes from "./src/routes/myGuides.routes.js";
import myTransportRoutes from "./src/routes/myTransport.routes.js";
import productsRoutes from "./src/routes/products.routes.js";
import myProductsRoutes from "./src/routes/myProducts.routes.js";
import adminProductsRoutes from "./src/routes/adminProducts.routes.js";
import applicationsVendorRoutes from "./src/routes/applicationsVendor.routes.js";
import adminVendorsRoutes from "./src/routes/adminVendors.routes.js";
import ordersRoutes from "./src/routes/orders.routes.js";
import myOrdersRoutes from "./src/routes/myOrders.routes.js";
import adminOrdersRoutes from "./src/routes/adminOrders.routes.js";
import myVendorOrdersRoutes from "./src/routes/myVendorOrders.routes.js";
import reviewsRoutes from "./src/routes/reviews.routes.js";
import adminReviewsRoutes from "./src/routes/adminReviews.routes.js";
import adminAccountRoutes from "./src/routes/adminAccount.routes.js";

import hotelBookingsRoutes from "./src/routes/hotelBookings.routes.js";
import myHotelBookingsRoutes from "./src/routes/myHotelBookings.routes.js";
import adminHotelBookingsRoutes from "./src/routes/adminHotelBookings.routes.js";
import myHotelBookingsOwnerRoutes from "./src/routes/myHotelBookingsOwner.routes.js";

import paymentsRoutes from "./src/routes/payments.routes.js";
import adminPaymentsRoutes from "./src/routes/adminPayments.routes.js";

import roadsRoutes from "./src/routes/roads.routes.js";
import tripPlannerRoutes from "./src/routes/tripPlanner.routes.js";


import weatherRoutes from "./src/routes/weather.routes.js";
import adminWeatherPlacesRoutes from "./src/routes/adminWeatherPlaces.routes.js";


import myGuideBookingsRoutes from "./src/routes/myGuideBookings.routes.js";
import myGuideBookingsOwnerRoutes from "./src/routes/myGuideBookingsOwner.routes.js";

import homeRoutes from "./src/routes/home.routes.js";

import chatRoutes from "./src/routes/chat.routes.js";

import eventsRoutes from "./src/routes/events.routes.js";
import adminEventsRoutes from "./src/routes/adminEvents.routes.js";

import reportsRoutes from "./src/routes/reports.routes.js";
import adminReportsRoutes from "./src/routes/adminReports.routes.js";



const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  process.env.PUBLIC_ORIGIN,
  process.env.ADMIN_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/spots", spotsRoutes);
app.use("/api/transport", transportRoutes);

app.use("/api/applications", applicationsRoutes);
app.use("/api/applications", applicationsGuideRoutes);
app.use("/api/applications", applicationsVendorRoutes);

app.use("/api/admin", adminApplicationsRoutes);
app.use("/api/admin", adminVendorsRoutes);
app.use("/api/admin/account", adminAccountRoutes);

app.use("/api/hotels", hotelsRoutes);
app.use("/api/guides", guidesRoutes);
app.use("/api/products", productsRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/my/hotels", myHotelsRoutes);
app.use("/api/my/guides", myGuidesRoutes);
app.use("/api/my/transport", myTransportRoutes);
app.use("/api/my/products", myProductsRoutes);

app.use("/api/admin/products", adminProductsRoutes);

app.use("/api/uploads", uploadsRoutes);

app.use("/api/orders", ordersRoutes);
app.use("/api/my/orders", myOrdersRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/my/vendor/orders", myVendorOrdersRoutes);

app.use("/api/reviews", reviewsRoutes);
app.use("/api/admin/reviews", adminReviewsRoutes);

app.use("/api/bookings", hotelBookingsRoutes);

app.use("/api/my/bookings/hotel", myHotelBookingsRoutes);
app.use("/api/my/bookings/guide", myGuideBookingsRoutes);

app.use("/api/admin/hotel-bookings", adminHotelBookingsRoutes);

app.use("/api/my/hotel-bookings", myHotelBookingsOwnerRoutes);
app.use("/api/my/guide-bookings", myGuideBookingsOwnerRoutes);

app.use("/api/payments", paymentsRoutes);
app.use("/api/admin/payments", adminPaymentsRoutes);

app.use("/api/roads", roadsRoutes);
app.use("/api/trip-planner", tripPlannerRoutes);

app.use("/api/weather", weatherRoutes);
app.use("/api/admin/weather-places", adminWeatherPlacesRoutes);

app.use("/api/home", homeRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/events", eventsRoutes);
app.use("/api/admin/events", adminEventsRoutes);

app.use("/api/reports", reportsRoutes);
app.use("/api/admin/reports", adminReportsRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });