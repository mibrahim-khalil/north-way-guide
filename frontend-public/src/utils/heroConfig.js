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
    "https://images.pexels.com/photos/15556462/pexels-photo-15556462.jpeg",
    "https://images.pexels.com/photos/19442074/pexels-photo-19442074.jpeg",
  ];

  const tripImgs = [
    "https://images.pexels.com/photos/20567552/pexels-photo-20567552.jpeg",
    "https://images.pexels.com/photos/35302567/pexels-photo-35302567.jpeg",
    "https://images.pexels.com/photos/13562249/pexels-photo-13562249.jpeg",
    "https://images.pexels.com/photos/713058/pexels-photo-713058.jpeg",
    "https://images.pexels.com/photos/19442078/pexels-photo-19442078.jpeg",
  ];

  const hotelImgs = [
    "https://images.pexels.com/photos/6348640/pexels-photo-6348640.jpeg",
    "https://images.pexels.com/photos/19442074/pexels-photo-19442074.jpeg",
    "https://images.pexels.com/photos/13567192/pexels-photo-13567192.jpeg",
    "https://images.pexels.com/photos/35302567/pexels-photo-35302567.jpeg",
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
        "Plan smarter trips across Gilgit-Baltistan. Explore top spots, book hotels, compare transport, and discover trusted local services.",
      badges: ["Explore GB", "Plan Trips", "Trusted Services"],
      images: homeImgs,
    };
  }

  if (path.startsWith("/trip-planner")) {
    return {
      ...base,
      title: "AI Trip Planner",
      subtitle:
        "Set your days, budget, travelers, and start point. Get a day‑by‑day itinerary you can edit and save.",
      badges: ["Itinerary Builder", "Budget-Aware", "Day by Day"],
      images: tripImgs,
    };
  }

  if (path.startsWith("/hotels")) {
    return {
      ...base,
      title: "Hotels",
      subtitle:
        "Browse stays across Gilgit-Baltistan with ratings, pricing, and booking requests.",
      badges: ["Top Rated", "Price Range", "Verified Stays"],
      images: hotelImgs,
    };
  }

  if (path.startsWith("/tourist-spots")) {
    return {
      ...base,
      title: "Tourist Spots",
      subtitle:
        "Discover valleys, lakes, forts, and viewpoints with photos, maps, and reviews.",
      badges: ["Maps", "Reviews", "Highlights"],
      images: spotsImgs,
    };
  }

  if (path.startsWith("/transport")) {
    return {
      ...base,
      title: "Transport",
      subtitle:
        "Compare routes and fares for local and private transport based on pickup and drop.",
      badges: ["Route Options", "Fare Compare", "Pickup → Drop"],
      images: transportImgs,
    };
  }

  if (path.startsWith("/local-products")) {
    return {
      ...base,
      title: "Local Products",
      subtitle:
        "Shop authentic Gilgit-Baltistan foods and handicrafts from verified sellers.",
      badges: ["Handicrafts", "Local Food", "Verified Sellers"],
      images: productImgs,
    };
  }

  if (path.startsWith("/about")) {
    return {
      ...base,
      title: "About",
      subtitle:
        "North Way Guide helps travelers plan confidently and supports local businesses through a trusted platform.",
      badges: ["Mission", "Platform", "Community"],
      images: aboutImgs,
    };
  }

  return {
    ...base,
    title: "Local Guides",
    subtitle:
      "Find trusted local guides in Gilgit-Baltistan. Compare ratings, specialties, and daily rates before you book.",
    badges: ["Explore", "Plan", "Travel"],
    images: homeImgs,
  };
};