import { Router } from "express";
import LocalProduct from "../models/LocalProduct.js";
import Review from "../models/Review.js";

const router = Router();

function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sort = "newest",
    } = req.query;

    const filter = { status: "APPROVED", isActive: true };

    if (category) filter.category = category;

    if (location) {
      filter.locationName = { $regex: escapeRegex(String(location)), $options: "i" };
    }

    if (search) {
      filter.name = { $regex: escapeRegex(String(search)), $options: "i" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    const nPage = Math.max(1, parseInt(page, 10) || 1);
    const nLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (nPage - 1) * nLimit;

    let sortObj = { createdAt: -1 };
    if (sort === "priceAsc") sortObj = { price: 1 };
    if (sort === "priceDesc") sortObj = { price: -1 };

    const [products, total] = await Promise.all([
      LocalProduct.find(filter).sort(sortObj).skip(skip).limit(nLimit),
      LocalProduct.countDocuments(filter),
    ]);

    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const reviews = await Review.find({
          targetType: "PRODUCT",
          targetId: product._id,
          status: "APPROVED",
        });

        const ratingCount = reviews.length;

        const ratingAvg =
          ratingCount > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
            : 0;

        return {
          ...product.toObject(),
          ratingAvg,
          ratingCount,
        };
      })
    );

    res.json({
      items: productsWithRatings,
      page: nPage,
      limit: nLimit,
      total,
      pages: Math.ceil(total / nLimit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const product = await LocalProduct.findOne({
      _id: req.params.id,
      status: "APPROVED",
      isActive: true,
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const reviews = await Review.find({
      targetType: "PRODUCT",
      targetId: product._id,
      status: "APPROVED",
    });

    const ratingCount = reviews.length;

    const ratingAvg =
      ratingCount > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
        : 0;

    res.json({
      item: {
        ...product.toObject(),
        ratingAvg,
        ratingCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;