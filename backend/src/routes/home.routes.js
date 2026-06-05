import { Router } from "express";

import Hotel from "../models/Hotel.js";
import Guide from "../models/Guide.js";
import Spot from "../models/Spot.js";
import LocalProduct from "../models/LocalProduct.js";
import Review from "../models/Review.js";

const router = Router();

function round1(x) {
  const n = Number(x || 0);
  return Math.round(n * 10) / 10;
}

async function topByReviews({ targetType, limit, fetchDocs, baseFilter = {} }) {
  const stats = await Review.aggregate([
    { $match: { targetType, status: "APPROVED" } },
    { $group: { _id: "$targetId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    { $sort: { avg: -1, count: -1 } },
    { $limit: limit },
  ]);

  const ids = stats.map((s) => s._id);
  const docs = await fetchDocs(ids, baseFilter);

  const byId = new Map(docs.map((d) => [String(d._id), d]));
  const ordered = stats
    .map((s) => {
      const d = byId.get(String(s._id));
      if (!d) return null;
      return {
        ...d.toObject(),
        ratingAvg: round1(s.avg),
        ratingCount: Number(s.count || 0),
      };
    })
    .filter(Boolean);

  return { ordered, usedIds: ids };
}

async function fillNewest({ model, baseFilter, excludeIds, limit }) {
  if (limit <= 0) return [];
  const items = await model
    .find({ ...baseFilter, _id: { $nin: excludeIds || [] } })
    .sort({ createdAt: -1 })
    .limit(limit);

  return items.map((d) => ({ ...d.toObject(), ratingAvg: 0, ratingCount: 0 }));
}


router.get("/highlights", async (req, res) => {
  const limit = Math.min(12, Math.max(1, Number(req.query.limit || 4)));

  const hotels = await Hotel.find({ isActive: true }).sort({ rating: -1, createdAt: -1 }).limit(limit);
  const guides = await Guide.find({ isActive: true }).sort({ rating: -1, createdAt: -1 }).limit(limit);

  const spotBase = { isActive: true };
  const spotTop = await topByReviews({
    targetType: "SPOT",
    limit,
    baseFilter: spotBase,
    fetchDocs: (ids, base) => Spot.find({ _id: { $in: ids }, ...base }),
  });
  const spotsFill = await fillNewest({
    model: Spot,
    baseFilter: spotBase,
    excludeIds: spotTop.usedIds,
    limit: limit - spotTop.ordered.length,
  });
  const spots = [...spotTop.ordered, ...spotsFill];

  const prodBase = { status: "APPROVED", isActive: true };
  const prodTop = await topByReviews({
    targetType: "PRODUCT",
    limit,
    baseFilter: prodBase,
    fetchDocs: (ids, base) => LocalProduct.find({ _id: { $in: ids }, ...base }),
  });
  const productsFill = await fillNewest({
    model: LocalProduct,
    baseFilter: prodBase,
    excludeIds: prodTop.usedIds,
    limit: limit - prodTop.ordered.length,
  });
  const products = [...prodTop.ordered, ...productsFill];

  res.json({ limit, hotels, guides, spots, products });
});

export default router;