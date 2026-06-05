import { Router } from "express";
import mongoose from "mongoose";
import Hotel from "../models/Hotel.js";
import HotelBooking from "../models/HotelBooking.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = Router();

function toMidnightUTC(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== "string") return null;
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
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

  const key = room?.id ? String(room.id) : `idx-${resolvedRoomIndex}`;
  return { room, resolvedRoomIndex, roomKey: key };
}

// public list
import Review from "../models/Review.js";

router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find({ isActive: true }).sort({ createdAt: -1 });

    const hotelsWithRatings = await Promise.all(
      hotels.map(async (hotel) => {
        const reviews = await Review.find({
          targetType: "HOTEL",
          targetId: hotel._id,
          status: "APPROVED",
        });

        const ratingCount = reviews.length;

        const ratingAvg =
          ratingCount > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
            : 0;

        return {
          ...hotel.toObject(),
          ratingAvg,
          ratingCount,
        };
      })
    );

    res.json({ items: hotelsWithRatings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/availability", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const { roomId = "", roomIndex = -1, checkInDate = "", checkOutDate = "" } = req.query;

  const inDate = toMidnightUTC(String(checkInDate || ""));
  const outDate = toMidnightUTC(String(checkOutDate || ""));
  if (!inDate || !outDate) return res.status(400).json({ message: "Invalid check-in or check-out date" });
  if (outDate <= inDate) return res.status(400).json({ message: "Check-out must be after check-in" });

  const hotel = await Hotel.findById(id);
  if (!hotel || hotel.isActive === false) return res.status(404).json({ message: "Hotel not found" });

  const { room, resolvedRoomIndex, roomKey } = resolveRoom(hotel, String(roomId || ""), Number(roomIndex));
  if (!room) return res.status(400).json({ message: "Room not found" });

  const blockedHit = (room.unavailableRanges || []).find((r) => {
    if (!r?.from || !r?.to) return false;
    return rangesOverlap(inDate, outDate, new Date(r.from), new Date(r.to));
  });

  if (blockedHit) {
    return res.json({
      available: false,
      reason: "BLOCKED_BY_OWNER",
      note: blockedHit.note || "",
      roomKey,
      roomIndex: resolvedRoomIndex,
    });
  }

  const conflict = await HotelBooking.findOne({
    hotelId: hotel._id,
    status: { $ne: "CANCELLED" },
    checkInDate: { $lt: outDate },
    checkOutDate: { $gt: inDate },
    $or: [{ "room.roomId": roomKey }, { "room.roomIndex": resolvedRoomIndex }],
  }).select("_id checkInDate checkOutDate status");

  if (conflict) {
    return res.json({
      available: false,
      reason: "ALREADY_BOOKED",
      roomKey,
      roomIndex: resolvedRoomIndex,
    });
  }

  return res.json({ available: true, roomKey, roomIndex: resolvedRoomIndex });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  
  const item = await Hotel.findById(id);
  if (!item || item.isActive === false) return res.status(404).json({ message: "Not found" });

  res.json({ item });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const body = req.body || {};
  if (!body.ownerUserId) body.ownerUserId = req.auth.userId;

  const created = await Hotel.create(body);
  res.status(201).json({ item: created });
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const updated = await Hotel.findByIdAndUpdate(id, req.body, { returnDocument: "after", runValidators: true });
  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json({ item: updated });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const deleted = await Hotel.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Not found" });

  res.json({ ok: true });
});

export default router;