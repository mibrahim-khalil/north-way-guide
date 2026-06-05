import { Router } from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import Hotel from "../models/Hotel.js";
import HotelBooking from "../models/HotelBooking.js";

import Guide from "../models/Guide.js";
import GuideBooking from "../models/GuideBooking.js";

const router = Router();

function toMidnightUTC(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== "string") return null;
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function diffNights(checkIn, checkOut) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function diffDays(start, end) {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function rangesOverlap(aFrom, aTo, bFrom, bTo) {
  return aFrom < bTo && aTo > bFrom;
}

function resolveRoom(hotel, roomId = "", roomIndex = -1) {
  const rooms = hotel?.rooms || [];
  let room = null;
  let resolvedRoomIndex = -1;

  if (roomId) {
    resolvedRoomIndex = rooms.findIndex((r) => String(r.id || "") === String(roomId));
    if (resolvedRoomIndex >= 0) room = rooms[resolvedRoomIndex];
  }

  if (!room && Number.isFinite(Number(roomIndex)) && Number(roomIndex) >= 0) {
    resolvedRoomIndex = Number(roomIndex);
    room = rooms[resolvedRoomIndex] || null;
  }

  if (!room) return { room: null, resolvedRoomIndex: -1, roomKey: "" };

  const roomKey = room?.id ? String(room.id) : `idx-${resolvedRoomIndex}`;
  return { room, resolvedRoomIndex, roomKey };
}

/**
 * POST /api/bookings/hotel
 */
router.post("/hotel", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;

  const {
    hotelId,
    roomId = "",
    roomIndex = -1,
    checkInDate,
    checkOutDate,
    guests = 1,
    fullName = "",
    phone = "",
    notes = "",
  } = req.body || {};

  if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({ message: "Invalid hotelId" });
  }

  const inDate = toMidnightUTC(checkInDate);
  const outDate = toMidnightUTC(checkOutDate);

  if (!inDate || !outDate) {
    return res.status(400).json({ message: "Invalid check-in or check-out date" });
  }

  const todayUtc = startOfTodayUtc();
  if (inDate.getTime() < todayUtc.getTime()) {
    return res.status(400).json({ message: "Check-in cannot be in the past" });
  }

  const nights = diffNights(inDate, outDate);
  if (nights < 1) {
    return res.status(400).json({ message: "Check-out must be after check-in" });
  }

  const hotel = await Hotel.findById(hotelId);
  if (!hotel || hotel.isActive === false) {
    return res.status(400).json({ message: "Hotel is not available" });
  }

  const g = Math.max(1, Number(guests || 1));

  const { room, resolvedRoomIndex, roomKey } = resolveRoom(hotel, String(roomId || ""), Number(roomIndex));
  if (!room) return res.status(400).json({ message: "Room not found" });

  const capacity = Number(room.capacity || 2);
  if (g > capacity) {
    return res.status(400).json({ message: `Guests exceed room capacity (${capacity})` });
  }

  const pricePerNight = Number(room.pricePerNight || 0);
  if (pricePerNight <= 0) {
    return res.status(400).json({ message: "Room price is invalid" });
  }

  const blockedHit = (room.unavailableRanges || []).find((r) => {
    if (!r?.from || !r?.to) return false;
    return rangesOverlap(inDate, outDate, new Date(r.from), new Date(r.to));
  });

  if (blockedHit) {
    return res.status(409).json({
      message: `Room is not available for selected dates (blocked by owner). ${blockedHit.note || ""}`.trim(),
    });
  }

  const conflict = await HotelBooking.findOne({
    hotelId: hotel._id,
    status: { $ne: "CANCELLED" },
    checkInDate: { $lt: outDate },
    checkOutDate: { $gt: inDate },
    $or: [{ "room.roomId": roomKey }, { "room.roomIndex": resolvedRoomIndex }],
  }).select("_id status checkInDate checkOutDate");

  if (conflict) {
    return res.status(409).json({ message: "Room is already booked for selected dates." });
  }

  const total = pricePerNight * nights;

  const booking = await HotelBooking.create({
    userId,
    hotelId: hotel._id,
    hotelOwnerUserId: hotel.ownerUserId || null,

    room: {
      roomId: roomKey,
      roomIndex: resolvedRoomIndex,
      roomName: room.name,
      capacity,
      pricePerNight,
    },

    checkInDate: inDate,
    checkOutDate: outDate,
    guests: g,

    nights,
    total,

    contact: {
      fullName: String(fullName || ""),
      phone: String(phone || ""),
    },

    note: String(notes || ""),
    status: "PLACED",
    payment: { status: "UNPAID" },
  });

  res.status(201).json({ item: booking });
});

/**
 * POST /api/bookings/guide
 * body: { guideId, startDate, endDate, travelers, meetingCity, meetingPoint, fullName, phone, notes }
 */
router.post("/guide", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;

  const {
    guideId,
    startDate,
    endDate,
    travelers = 1,
    meetingCity = "",
    meetingPoint = "",
    fullName = "",
    phone = "",
    notes = "",
  } = req.body || {};

  if (!guideId || !mongoose.Types.ObjectId.isValid(guideId)) {
    return res.status(400).json({ message: "Invalid guideId" });
  }

  const s = toMidnightUTC(String(startDate || ""));
  const e = toMidnightUTC(String(endDate || ""));

  if (!s || !e) return res.status(400).json({ message: "Invalid startDate or endDate" });

  const todayUtc = startOfTodayUtc();
  if (s.getTime() < todayUtc.getTime()) {
    return res.status(400).json({ message: "Start date cannot be in the past" });
  }

  const days = diffDays(s, e);
  if (days < 1) return res.status(400).json({ message: "End date must be after start date" });

  const guide = await Guide.findById(guideId);
  if (!guide || guide.isActive === false) {
    return res.status(400).json({ message: "Guide is not available" });
  }

  if (String(guide.ownerUserId || "") === String(userId)) {
    return res.status(400).json({ message: "You cannot book your own guide." });
  }

  const pricePerDay = Number(guide.pricePerDay || 0);
  if (pricePerDay <= 0) return res.status(400).json({ message: "Guide price is invalid" });

  // blocked by owner ranges
  const blockedHit = (guide.unavailableRanges || []).find((r) => {
    if (!r?.from || !r?.to) return false;
    return rangesOverlap(s, e, new Date(r.from), new Date(r.to));
  });

  if (blockedHit) {
    return res.status(409).json({
      message: `Guide is not available for selected dates (blocked by owner). ${blockedHit.note || ""}`.trim(),
    });
  }

  // already booked overlap
  const conflict = await GuideBooking.findOne({
    guideId: guide._id,
    status: { $ne: "CANCELLED" },
    startDate: { $lt: e },
    endDate: { $gt: s },
  }).select("_id");

  if (conflict) {
    return res.status(409).json({ message: "Guide is already booked for selected dates." });
  }

  const t = Math.max(1, Number(travelers || 1));
  const total = pricePerDay * days;

  const booking = await GuideBooking.create({
    userId,
    guideId: guide._id,
    guideOwnerUserId: guide.ownerUserId || null,

    startDate: s,
    endDate: e,
    days,

    travelers: t,

    meetingCity: String(meetingCity || guide.baseCity || ""),
    meetingPoint: String(meetingPoint || ""),

    contact: {
      fullName: String(fullName || ""),
      phone: String(phone || ""),
    },

    note: String(notes || ""),
    pricePerDay,
    total,

    status: "PLACED",
    payment: { status: "UNPAID" },
  });

  return res.status(201).json({ item: booking });
});

export default router;