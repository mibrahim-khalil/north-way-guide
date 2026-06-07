export const heroByRoute = (path) => {
  const base = {
    interval: 2600,
    ctaPrimary: { label: "Trip Planner", to: "/trip-planner" },
    ctaSecondary: { label: "Explore Spots", to: "/tourist-spots" },
  };

const homeImgs = [
  "/images/home1.png",
  "/images/home2.png",
  "/images/home3.png",
  "/images/home4.png",
  "/images/home5.png",
  "/images/image.jpg",
];

  const tripImgs = [
    "https://unsplash.com/photos/woman-on-a-cliff-overlooking-the-mountains-and-a-valley-G47UwbJ_Utw",
    "/images/skardu.png",
    "https://images.unsplash.com/photo-1646514323663-f5b6595763ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGdpbGdpdCUyMGJhbHRpc3RhbnxlbnwwfHwwfHx8MA%3D%3D",
  ];

  const hotelImgs = [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=60",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=60",
  ];

  const spotsImgs = [
    "https://media.istockphoto.com/id/2267547021/photo/majestic-mountain-peak-bathed-in-sunrise-glow-rakaposhi-is-a-mountain-within-the-karakoram.jpg?s=1024x1024&w=is&k=20&c=_z-5Gx8rSIzhRMQp61VGwqRv0NWFqImGHUNfY76LJ3w=",
    "https://media.istockphoto.com/id/2251762221/photo/k2.jpg?s=2048x2048&w=is&k=20&c=HIYIPQf9drvn6tXIZBbvuBymSqU9p1URFfsY9UrdQB4=",
  ];

  const transportImgs = [
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2000&q=60",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=60",
  ];

  const productImgs = [
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=2000&q=60",
    "https://images.unsplash.com/photo-1621939514649-280e2a0bda3f?auto=format&fit=crop&w=2000&q=60",
  ];

  const aboutImgs = [
    "https://plus.unsplash.com/premium_photo-1723485618246-afd5f5830ea1?auto=format&fit=crop&crop=entropy&w=2400&h=1028&q=80"
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