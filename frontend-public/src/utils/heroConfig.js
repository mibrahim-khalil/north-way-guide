export const heroByRoute = (path) => {
  const base = {
    interval: 2600,
    ctaPrimary: { label: "Trip Planner", to: "/trip-planner" },
    ctaSecondary: { label: "Explore Spots", to: "/tourist-spots" },
  };

  const homeImgs = [
    "https://images.pexels.com/photos/35302567/pexels-photo-35302567.jpeg",
    "https://images.pexels.com/photos/35302563/pexels-photo-35302563.jpeg",
    "https://images.pexels.com/photos/15916727/pexels-photo-15916727.jpeg",
    "https://images.pexels.com/photos/35302567/pexels-photo-35302567.jpeg",
    "https://images.pexels.com/photos/19442073/pexels-photo-19442073.jpeg",
  ];

  const tripImgs = [
    "https://images.pexels.com/photos/20567552/pexels-photo-20567552.jpeg",
    "https://images.pexels.com/photos/14696300/pexels-photo-14696300.jpeg",
    "https://images.pexels.com/photos/13562249/pexels-photo-13562249.jpeg",
    "https://images.pexels.com/photos/713058/pexels-photo-713058.jpeg",
    "https://images.pexels.com/photos/19442078/pexels-photo-19442078.jpeg",
  ];

  const hotelImgs = [
    "https://images.pexels.com/photos/6348640/pexels-photo-6348640.jpeg",
    "https://images.pexels.com/photos/19442074/pexels-photo-19442074.jpeg",
    "https://images.pexels.com/photos/13567192/pexels-photo-13567192.jpeg",
    "https://images.pexels.com/photos/35302567/pexels-photo-35302567.jpeg",
    "https://images.pexels.com/photos/6348640/pexels-photo-6348640.jpeg",

  ];

  const spotsImgs = [
    "https://images.pexels.com/photos/17851168/pexels-photo-17851168.jpeg",
    "https://images.pexels.com/photos/11655576/pexels-photo-11655576.jpeg",
    "https://images.pexels.com/photos/19442073/pexels-photo-19442073.jpeg",
    "https://images.pexels.com/photos/15556462/pexels-photo-15556462.jpeg",
    "https://images.pexels.com/photos/34607725/pexels-photo-34607725.jpeg",
  ];

  const transportImgs = [
    "https://images.pexels.com/photos/1031008/pexels-photo-1031008.jpeg",
    "https://images.pexels.com/photos/17324034/pexels-photo-17324034.jpeg",
    "https://images.pexels.com/photos/11655564/pexels-photo-11655564.jpeg",
    "https://images.pexels.com/photos/14351862/pexels-photo-14351862.jpeg",
  ];

  const productImgs = [
    "https://images.pexels.com/photos/11135641/pexels-photo-11135641.jpeg",
    "https://images.pexels.com/photos/36870365/pexels-photo-36870365.jpeg",
    "https://images.pexels.com/photos/33803616/pexels-photo-33803616.jpeg",
  ];

  const aboutImgs = [
    "https://images.pexels.com/photos/13567192/pexels-photo-13567192.jpeg"
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
      badges: ["Decision Tree (Later)", "Road + Air", "Day-by-Day Plan"],
      images: tripImgs,
    };
  }

  if (path.startsWith("/hotels")) {
    return {
      ...base,
      title: "Hotels in Gilgit-Baltistan",
      subtitle:
        "Explore recommended hotels with ratings & reviews.",
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
      subtitle:
        "Compare local and private transport options by pickup & drop.",
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