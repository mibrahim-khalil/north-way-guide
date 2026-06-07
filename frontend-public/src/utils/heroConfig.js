export const heroByRoute = (path) => {
  const base = {
    interval: 5000,
    ctaPrimary: { label: "Trip Planner", to: "/trip-planner" },
    ctaSecondary: { label: "Explore Spots", to: "/tourist-spots" },
  };

  const tripImgs = [
    "/images/skardu.png",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=80",
  ];

  const hotelImgs = [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2400&q=80",
  ];

  const spotsImgs = [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=80",
  ];

  const transportImgs = [
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80",
  ];

  const productImgs = [
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1621939514649-280e2a0bda3f?auto=format&fit=crop&w=2400&q=80",
  ];

  const aboutImgs = [
    "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2400&q=80",
  ];

  if (path === "/") {
    return {
      ...base,
      title: "North Way Guide",
      subtitle:
        "A unified digital tourism system for Gilgit-Baltistan: plan trips, explore spots, compare transport, and discover verified local services.",
      badges: ["Gilgit-Baltistan", "Smart Planning", "Verified Services"],
      images: homeImgs,
    };
  }

  if (path.startsWith("/trip-planner")) {
    return {
      ...base,
      title: "AI Trip Planner",
      subtitle:
        "Enter your budget, days, travelers, and start location to preview an itinerary flow.",
      badges: ["Road + Air", "Day-by-Day Plan", "Smart Suggestions"],
      images: tripImgs,
    };
  }

  if (path.startsWith("/hotels")) {
    return {
      ...base,
      title: "Hotels in Gilgit-Baltistan",
      subtitle: "Explore recommended hotels with ratings & reviews.",
      badges: ["Ratings", "Verified Listings", "Stay Smart"],
      images: hotelImgs,
    };
  }

  if (path.startsWith("/tourist-spots")) {
    return {
      ...base,
      title: "Tourist Spots Directory",
      subtitle:
        "Discover iconic valleys, lakes, forts, and viewpoints with rich information and location details.",
      badges: ["Culture", "Nature", "Maps"],
      images: spotsImgs,
    };
  }

  if (path.startsWith("/transport")) {
    return {
      ...base,
      title: "Transport Fare Comparison",
      subtitle: "Compare local and private transport options by pickup & drop.",
      badges: ["Pickup/Drop", "Fare Estimate", "Availability"],
      images: transportImgs,
    };
  }

  if (path.startsWith("/local-products")) {
    return {
      ...base,
      title: "Local Products & Handicrafts",
      subtitle:
        "Traditional foods, herbal products, and authentic handicrafts from Gilgit-Baltistan.",
      badges: ["Shilajit", "Dry Fruits", "Handmade"],
      images: productImgs,
    };
  }

  if (path.startsWith("/about")) {
    return {
      ...base,
      title: "About North Way Guide",
      subtitle:
        "Our mission is to promote tourism and empower local businesses through a trusted digital platform.",
      badges: ["Mission", "Vision", "Team"],
      images: aboutImgs,
    };
  }

  return {
    ...base,
    title: "North Way Guide",
    subtitle: "Explore Gilgit-Baltistan with smart planning and verified services.",
    badges: ["Explore", "Plan", "Travel"],
    images: homeImgs,
  };
};