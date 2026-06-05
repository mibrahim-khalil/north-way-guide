import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import ChatSession from "../models/Chat.js";

import Spot from "../models/Spot.js";
import Hotel from "../models/Hotel.js";
import Guide from "../models/Guide.js";
import LocalProduct from "../models/LocalProduct.js";

import Fuse from "fuse.js";
import { geminiText } from "../utils/gemini.js";

const router = Router();

function autoTitleFromMessage(message) {
  const clean = String(message || "").replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  const max = 40;
  return clean.length > max ? clean.slice(0, max).trim() + "…" : clean;
}


function isGreeting(message) {
  const msg = String(message || "").trim().toLowerCase();


  if (["hi", "hii", "hiii", "hello", "hey", "hlo", "hy", "yo", "oi"].includes(msg)) return true;


  if (msg.includes("assalam") || msg.includes("asalam") || msg.includes("aoa") || msg.includes("salam"))
    return true;

  if (msg.includes("good morning") || msg.includes("good evening") || msg.includes("good afternoon"))
    return true;

  return false;
}

function isThanks(message) {
  const msg = String(message || "").toLowerCase();
  return msg === "thanks" || msg === "thank you" || msg.includes("thanks") || msg.includes("thank") || msg.includes("shukriya");
}

function isHelpRequest(message) {
  const msg = String(message || "").toLowerCase();
  return (
    msg.includes("what can you do") ||
    msg.includes("help") ||
    msg.includes("menu") ||
    msg.includes("features") ||
    msg.includes("services") ||
    msg.includes("options") ||
    msg.includes("all features") ||
    msg.includes("all services") ||
    msg.includes("show features") ||
    msg.includes("show menu")
  );
}


const GB_PLACES = [
  "Skardu",
  "Hunza",
  "Gilgit",
  "Nagar",
  "Ghizer",
  "Astore",
  "Diamer",
  "Ghanche",
  "Khaplu",
  "Shigar",
  "Karimabad",
  "Naltar",
  "Fairy Meadows",
  "Deosai",
];

const placeFuse = new Fuse(GB_PLACES.map((p) => ({ name: p })), {
  keys: ["name"],
  threshold: 0.4,
});

function detectPlace(message) {
  const text = String(message || "").toLowerCase();

  for (const p of GB_PLACES) {
    if (text.includes(p.toLowerCase())) return p;
  }

  const result = placeFuse.search(text);
  if (result?.[0]?.item?.name) return result[0].item.name;

  return null;
}


function detectIntent(message) {
  const msg = String(message || "").toLowerCase();

  if (isGreeting(msg)) return "GREETING";
  if (isThanks(msg)) return "THANKS";
  if (isHelpRequest(msg)) return "HELP";

  if (
    msg.includes("history") ||
    msg.includes("culture") ||
    msg.includes("tradition") ||
    msg.includes("festival") ||
    msg.includes("food") ||
    msg.includes("language") ||
    msg.includes("heritage")
  ) return "HISTORY_CULTURE";

  if (
    msg.includes("best time") ||
    msg.includes("best season") ||
    msg.includes("when to visit") ||
    (msg.includes("visit") && msg.includes("time")) ||
    (msg.includes("good") && msg.includes("visit") && msg.includes("time"))
  ) return "BEST_TIME";

  if (msg.includes("weather") || msg.includes("temperature") || msg.includes("forecast")) return "WEATHER";

  if (msg.includes("hotel") || msg.includes("stay") || msg.includes("resort")) return "HOTELS";

  if (msg.includes("guide") || msg.includes("local guide")) return "GUIDES";

  if (msg.includes("spot") || msg.includes("tourist spot") || msg.includes("places to visit")) return "SPOTS";

  if (msg.includes("product") || msg.includes("shop") || msg.includes("buy") || msg.includes("local product"))
    return "PRODUCTS";

  if (msg.includes("transport") || msg.includes("fare") || msg.includes("bus") || msg.includes("car") || msg.includes("jeep"))
    return "TRANSPORT";

  if (msg.includes("trip plan") || msg.includes("itinerary") || msg.includes("trip planner") || msg.includes("plan my trip"))
    return "TRIP_PLANNER";

  return "GENERAL";
}

function looksInDomain(message) {
  const msg = String(message || "").toLowerCase();

  if (isGreeting(msg) || isThanks(msg) || isHelpRequest(msg)) return true;
  if (detectPlace(msg)) return true;

  const keywords = [
    "gilgit",
    "baltistan",
    "gb",
    "tour",
    "travel",
    "visit",
    "trek",
    "mountain",
    "lake",
    "valley",
    "hotel",
    "resort",
    "guide",
    "spot",
    "places",
    "transport",
    "fare",
    "trip",
    "itinerary",
    "planner",
    "weather",
    "forecast",
    "product",
    "culture",
    "history",
    "tradition",
    "festival",
    "food",
  ];

  return keywords.some((k) => msg.includes(k));
}


const ROUTES = {
  spotsList: "/tourist-spots",
  spotDetails: (id) => `/tourist-spots/${id}`,

  hotelsList: "/hotels",
  hotelDetails: (id) => `/hotels/${id}`,

  guidesList: "/guides",
  guideDetails: (id) => `/guides/${id}`,

  productsList: "/local-products",
  productDetails: (id) => `/local-products/${id}`,

  transport: "/transport",
  tripPlanner: "/trip-planner",
  weather: "/weather",
};

function featureCards() {
  return [
    { type: "action", title: "Tourist Spots", subtitle: "Explore places to visit", to: ROUTES.spotsList },
    { type: "action", title: "Hotels", subtitle: "Find stays", to: ROUTES.hotelsList },
    { type: "action", title: "Guides", subtitle: "Hire a local guide", to: ROUTES.guidesList },
    { type: "action", title: "Local Products", subtitle: "Explore local products", to: ROUTES.productsList },
    { type: "action", title: "Transport", subtitle: "Compare fares & routes", to: ROUTES.transport },
    { type: "action", title: "AI Trip Planner", subtitle: "Plan your GB trip", to: ROUTES.tripPlanner },
    { type: "action", title: "Weather", subtitle: "Forecast & temperature", to: ROUTES.weather },
  ];
}


async function getDbContext({ intent, place }) {
  const ctx = { place: place || "", spots: [], hotels: [], guides: [], products: [] };

  if (["SPOTS", "BEST_TIME", "GENERAL", "HISTORY_CULTURE", "WEATHER"].includes(intent)) {
    const q = place ? { location: new RegExp(place, "i") } : {};
    const spots = await Spot.find(q).sort({ createdAt: -1 }).limit(4).select("title location images");
    ctx.spots = spots.map((s) => ({
      id: s._id,
      type: "spot",
      title: s.title,
      subtitle: s.location || "",
      image: Array.isArray(s.images) ? s.images[0] : "",
      to: ROUTES.spotDetails(String(s._id)),
    }));
  }

  if (intent === "HOTELS") {
    const q = place ? { city: new RegExp(place, "i") } : {};
    const hotels = await Hotel.find(q)
      .sort({ rating: -1, createdAt: -1 })
      .limit(4)
      .select("name city images priceFrom rating");
    ctx.hotels = hotels.map((h) => ({
      id: h._id,
      type: "hotel",
      title: h.name,
      subtitle: h.city || "",
      image: Array.isArray(h.images) ? h.images[0] : "",
      meta: h.priceFrom ? `From PKR ${h.priceFrom}/night` : "",
      to: ROUTES.hotelDetails(String(h._id)),
    }));
  }

  if (intent === "GUIDES") {
    const q = place ? { baseCity: new RegExp(place, "i") } : {};
    const guides = await Guide.find(q).sort({ createdAt: -1 }).limit(4).select("name baseCity images pricePerDay");
    ctx.guides = guides.map((g) => ({
      id: g._id,
      type: "guide",
      title: g.name,
      subtitle: g.baseCity || "",
      image: Array.isArray(g.images) ? g.images[0] : "",
      meta: g.pricePerDay ? `PKR ${g.pricePerDay}/day` : "",
      to: ROUTES.guideDetails(String(g._id)),
    }));
  }

  if (intent === "PRODUCTS") {
    const q = place ? { locationName: new RegExp(place, "i") } : {};
    const products = await LocalProduct.find(q)
      .sort({ createdAt: -1 })
      .limit(4)
      .select("name category images price locationName");
    ctx.products = products.map((p) => ({
      id: p._id,
      type: "product",
      title: p.name,
      subtitle: p.category || "",
      image: Array.isArray(p.images) ? p.images[0] : "",
      meta: p.price ? `PKR ${p.price}` : "",
      to: ROUTES.productDetails(String(p._id)),
    }));
  }

  return ctx;
}

function buildCards({ intent, ctx }) {
  const browse = (title, subtitle, to) => ({ type: "action", title, subtitle, to });

  if (intent === "HELP") return featureCards();

  if (intent === "HOTELS") return ctx.hotels.length ? ctx.hotels : [browse("Browse Hotels", "See all hotels on NorthWay", ROUTES.hotelsList)];
  if (intent === "GUIDES") return ctx.guides.length ? ctx.guides : [browse("Browse Guides", "See verified guides", ROUTES.guidesList)];
  if (intent === "PRODUCTS") return ctx.products.length ? ctx.products : [browse("Browse Local Products", "Explore local products", ROUTES.productsList)];

  if (intent === "WEATHER") {
    const cards = [
      { type: "action", title: "Weather", subtitle: "Forecast & temperature", to: ROUTES.weather },
      ...ctx.spots.slice(0, 3),
    ];
    return cards;
  }

  if (intent === "TRANSPORT") return [browse("Transport & Fare Comparison", "Compare fares & routes", ROUTES.transport)];
  if (intent === "TRIP_PLANNER") return [browse("AI Trip Planner", "Generate a GB itinerary", ROUTES.tripPlanner)];

  if (intent === "SPOTS") return ctx.spots.length ? ctx.spots : [browse("Explore Tourist Spots", "Browse places in Gilgit Baltistan", ROUTES.spotsList)];

  if (["BEST_TIME", "HISTORY_CULTURE", "GENERAL"].includes(intent)) {
    return ctx.spots.length ? ctx.spots : [browse("Explore Tourist Spots", "Browse places in Gilgit Baltistan", ROUTES.spotsList)];
  }

  return [];
}


function makePrompt({ userMessage, intent, place, ctx }) {
  const systemRules = `
You are "NorthWay AI Guide".

Strict rules:
- Only answer about Gilgit Baltistan (travel, seasons, history, culture, food, safety) and NorthWay website features (tourist spots, hotels, guides, local products, transport, trip planner).
- If user asks outside this domain, reply exactly:
  "Sorry, I can only help with Gilgit Baltistan and NorthWay travel features."
- Keep it short: 2 to 6 sentences maximum.
- Plain text only. No markdown.
- Do NOT invent hotel/spot/guide/product names. Only use DATABASE RESULTS if recommending.
`;

  const bestTimeHint = `
Best-time hint:
Most Gilgit Baltistan travel is best from April to October. Peak is June to September. Winter (Dec–Feb) is very cold and some routes may be difficult.
`;

  const dbBlock = `
DATABASE RESULTS (real items from NorthWay):
Place: ${place || "none"}

Spots:
${ctx.spots?.map((s) => `- ${s.title} (${s.subtitle || ""})`).join("\n") || "- none"}

Hotels:
${ctx.hotels?.map((h) => `- ${h.title} (${h.subtitle || ""})`).join("\n") || "- none"}

Guides:
${ctx.guides?.map((g) => `- ${g.title} (${g.subtitle || ""})`).join("\n") || "- none"}

Products:
${ctx.products?.map((p) => `- ${p.title} (${p.subtitle || ""})`).join("\n") || "- none"}
`;

  let styleHint = "Answer clearly and briefly.";
  if (intent === "HISTORY_CULTURE") styleHint = "Give a straightforward short answer with key facts only.";
  if (intent === "BEST_TIME") styleHint = "Mention months/season in short form.";

  return `${systemRules}\n${intent === "BEST_TIME" ? bestTimeHint : ""}\n${dbBlock}\nUser: ${userMessage}\n${styleHint}`;
}


router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { message, sessionId } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message required" });
    }

    let session = null;
    if (sessionId) session = await ChatSession.findOne({ _id: sessionId, userId });

    if (!session) {
      session = await ChatSession.create({
        userId,
        title: autoTitleFromMessage(message),
        messages: [],
      });
    }

    if (!session.title || !session.title.trim()) session.title = autoTitleFromMessage(message);

    session.messages.push({ role: "user", content: message });

    const intent = detectIntent(message);
    const place = detectPlace(message);

    if (intent === "GREETING") {
      const replyText =
        "Hello! I’m your NorthWay AI Guide. Ask me about Gilgit Baltistan to make your trip unforgettable.";
      session.messages.push({ role: "assistant", content: replyText });
      await session.save();

      return res.json({
        reply: replyText,
        sessionId: session._id,
        title: session.title,
        detected: { intent, place },
        cards: [], 
      });
    }

    if (intent === "HELP") {
      const replyText =
        "Here are the main NorthWay features. Choose one to continue.";
      session.messages.push({ role: "assistant", content: replyText });
      await session.save();

      return res.json({
        reply: replyText,
        sessionId: session._id,
        title: session.title,
        detected: { intent, place },
        cards: featureCards(), 
      });
    }

    if (intent === "THANKS") {
      const replyText = "You’re welcome. Tell me which place in Gilgit Baltistan you want to explore.";
      session.messages.push({ role: "assistant", content: replyText });
      await session.save();

      return res.json({
        reply: replyText,
        sessionId: session._id,
        title: session.title,
        detected: { intent, place },
        cards: [],
      });
    }

    if (!looksInDomain(message)) {
      const replyText = "Sorry, I can only help with Gilgit Baltistan and NorthWay travel features.";
      session.messages.push({ role: "assistant", content: replyText });
      await session.save();

      return res.json({
        reply: replyText,
        sessionId: session._id,
        title: session.title,
        detected: { intent: "OUT_OF_DOMAIN", place: null },
        cards: [],
      });
    }

    const ctx = await getDbContext({ intent, place });
    const prompt = makePrompt({ userMessage: message, intent, place, ctx });
    const replyText = await geminiText(prompt);

    session.messages.push({ role: "assistant", content: replyText });
    await session.save();

    const cards = buildCards({ intent, ctx });

    return res.json({
      reply: replyText,
      sessionId: session._id,
      title: session.title,
      detected: { intent, place },
      cards, 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chat error" });
  }
});


router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const sessions = await ChatSession.find({ userId })
      .sort({ updatedAt: -1 })
      .select("_id title updatedAt");

    res.json({ sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch sessions error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.auth.userId,
    });

    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch session error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const sessionId = req.params.id;

    const result = await ChatSession.deleteOne({ _id: sessionId, userId });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Session not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete session error" });
  }
});

export default router;