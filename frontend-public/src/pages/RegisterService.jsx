import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { uploadImage } from "../utils/uploadImage";

const serviceOptions = [
  { label: "Hotel Partner", value: "HOTEL" },
  { label: "Tour Guide", value: "GUIDE" },
  { label: "Transport Provider", value: "TRANSPORT" },
  { label: "Vendor / Shop", value: "PRODUCT_VENDOR" },
];

export default function RegisterService() {
  const nav = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  // ✅ Restrict page to SELLER only
  useEffect(() => {
    if (loading) return;

    if (!user) {
      toast("Please login to continue", 2000);
      nav("/login", { replace: true, state: { from: "/register-service" } });
      return;
    }

    // Treat old accounts (no accountType) as SELLER to not break existing providers
    const accountType = String(user?.accountType || "SELLER").toUpperCase();
    const isSeller = accountType === "SELLER";

    if (!isSeller) {
      toast("Only sellers can register services.", 2500);
      nav("/profile", { replace: true });
    }
  }, [user, loading, nav, toast]);

  const [serviceType, setServiceType] = useState("HOTEL");
  const [submitting, setSubmitting] = useState(false);

  const isHotel = serviceType === "HOTEL";
  const isGuide = serviceType === "GUIDE";
  const isTransport = serviceType === "TRANSPORT";
  const isVendor = serviceType === "PRODUCT_VENDOR";

  // -------------------------
  // Hotel Register Form
  // -------------------------
  const [hotel, setHotel] = useState({
    name: "",
    city: "",
    address: "",
    mapsUrl: "",
    amenities: "",
    imageUrl: "",
    description: "",
    rooms: [],
  });

  const [roomDraft, setRoomDraft] = useState({
    id: "",
    name: "",
    pricePerNight: "",
    capacity: 2,
  });

  const computedPriceFrom = useMemo(() => {
    const rooms = hotel.rooms || [];
    if (!rooms.length) return 0;
    return Math.min(...rooms.map((r) => Number(r.pricePerNight || 0)));
  }, [hotel.rooms]);

  const addRoom = () => {
    if (!roomDraft.name) return toast("Room name is required", 2000);
    const price = Number(roomDraft.pricePerNight || 0);
    if (price <= 0) return toast("Room price must be > 0", 2000);

    const cap = Math.max(1, Number(roomDraft.capacity || 1));
    const id = (roomDraft.id || roomDraft.name).toLowerCase().trim().replace(/\s+/g, "-");

    if ((hotel.rooms || []).some((r) => r.id === id)) {
      return toast("Room id already exists. Change it.", 2000);
    }

    setHotel((p) => ({
      ...p,
      rooms: [...(p.rooms || []), { id, name: roomDraft.name, pricePerNight: price, capacity: cap }],
    }));

    setRoomDraft({ id: "", name: "", pricePerNight: "", capacity: 2 });
  };

  const removeRoom = (rid) => {
    setHotel((p) => ({ ...p, rooms: (p.rooms || []).filter((r) => r.id !== rid) }));
  };

  const hotelPayload = useMemo(() => {
    if (!isHotel) return {};
    return {
      name: hotel.name,
      city: hotel.city,
      address: hotel.address,
      mapsUrl: hotel.mapsUrl,
      description: hotel.description,
      amenities: hotel.amenities
        ? hotel.amenities
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      images: hotel.imageUrl ? [hotel.imageUrl] : [],
      rooms: hotel.rooms || [],
      pricePerNight: computedPriceFrom,
    };
  }, [hotel, isHotel, computedPriceFrom]);

  // -------------------------
  // Guide registration
  // -------------------------
  const [guide, setGuide] = useState({
    name: "",
    baseCity: "",
    phone: "",
    pricePerDay: "",
    languagesText: "",
    specialtiesText: "",
    bio: "",
    imageUrl: "",
  });

  const [guideDocs, setGuideDocs] = useState(null);

  const guidePayload = useMemo(() => {
    if (!isGuide) return {};
    return {
      name: guide.name,
      baseCity: guide.baseCity,
      phone: guide.phone,
      pricePerDay: Number(guide.pricePerDay || 0),
      bio: guide.bio,
      languages: guide.languagesText
        ? guide.languagesText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      specialties: guide.specialtiesText
        ? guide.specialtiesText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      images: guide.imageUrl ? [guide.imageUrl] : [],
    };
  }, [guide, isGuide]);

  // -------------------------
  // Transport registration
  // -------------------------
  const [tp, setTp] = useState({
    providerName: "",
    contactPhone: "",
    whatsapp: "",
    bookingUrl: "",
    officeCity: "",
    officeAddress: "",
    officeMapsUrl: "",
    routes: [],
  });

  const [routeDraft, setRouteDraft] = useState({
    from: "",
    to: "",
    type: "Local",
    fare: "",
    availability: "Daily",
    notes: "",
  });

  const addRoute = () => {
    if (!routeDraft.from || !routeDraft.to) return toast("Route From and To are required", 2000);

    const next = {
      from: routeDraft.from.trim(),
      to: routeDraft.to.trim(),
      type: routeDraft.type,
      fare: routeDraft.type === "Flight" ? 0 : Number(routeDraft.fare || 0),
      availability: routeDraft.availability,
      notes: routeDraft.notes || "",
    };

    const exists = (tp.routes || []).some((r) => r.from === next.from && r.to === next.to && r.type === next.type);
    if (exists) return toast("This route already exists in your list.", 2000);

    setTp((p) => ({ ...p, routes: [...(p.routes || []), next] }));
    setRouteDraft({ from: "", to: "", type: "Local", fare: "", availability: "Daily", notes: "" });
  };

  const removeRoute = (idx) => {
    setTp((p) => ({ ...p, routes: (p.routes || []).filter((_, i) => i !== idx) }));
  };

  const transportPayload = useMemo(() => {
    if (!isTransport) return {};
    return {
      providerName: tp.providerName,
      contactPhone: tp.contactPhone,
      whatsapp: tp.whatsapp,
      bookingUrl: tp.bookingUrl,
      officeCity: tp.officeCity,
      officeAddress: tp.officeAddress,
      officeMapsUrl: tp.officeMapsUrl,
      routes: tp.routes || [],
    };
  }, [tp, isTransport]);

  // -------------------------
  // Vendor registration (✅ added googleMapUrl)
  // -------------------------
  const [vendor, setVendor] = useState({
    shopName: "",
    city: "",
    phone: "",
    address: "",
    googleMapUrl: "", // ✅ NEW
  });

  const [vendorApp, setVendorApp] = useState(null);
  const [loadingVendorApp, setLoadingVendorApp] = useState(false);

  const fetchMyVendorApp = async () => {
    if (!user) return;
    setLoadingVendorApp(true);
    try {
      const res = await api.get("/applications/vendor/me");
      setVendorApp(res.data?.item || null);
    } catch (err) {
      if (err?.response?.status === 404) setVendorApp(null);
      else toast(err?.response?.data?.message || "Failed to load vendor application status", 2500);
    } finally {
      setLoadingVendorApp(false);
    }
  };

  useEffect(() => {
    if (!isVendor) return;
    if (!user) {
      setVendorApp(null);
      return;
    }
    fetchMyVendorApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVendor, user?.id]);

  // -------------------------
  // Submit
  // -------------------------
  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!user) {
      toast("Please login to continue", 2000);
      nav("/login", { state: { from: "/register-service" } });
      return;
    }

    const accountType = String(user?.accountType || "SELLER").toUpperCase();
    if (accountType !== "SELLER") {
      toast("Only sellers can register services.", 2500);
      nav("/profile");
      return;
    }

    setSubmitting(true);
    try {
      if (isHotel) {
        if (!hotelPayload.name || !hotelPayload.city) {
          toast("Hotel name and city are required", 2000);
          return;
        }
        if (!Array.isArray(hotelPayload.rooms) || hotelPayload.rooms.length < 1) {
          toast("Add at least 1 room category", 2000);
          return;
        }

        await api.post("/applications", { serviceType: "HOTEL", payload: hotelPayload });
        toast("Hotel application submitted. Waiting for admin approval.", 2500);
        nav("/profile");
        return;
      }

      if (isGuide) {
        if (!guidePayload.name || !guidePayload.baseCity) {
          toast("Guide name and base city are required", 2000);
          return;
        }

        if (!guideDocs || guideDocs.length < 1) {
          toast("Upload at least 1 government document (NIC/Passport/License).", 2500);
          return;
        }

        const fd = new FormData();
        fd.append("payload", JSON.stringify(guidePayload));
        Array.from(guideDocs).forEach((file) => fd.append("documents", file));

        await api.post("/applications/guide", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast("Guide application submitted. Waiting for admin approval.", 2500);
        nav("/profile");
        return;
      }

      if (isTransport) {
        if (!transportPayload.providerName) {
          toast("Provider/Company name is required", 2000);
          return;
        }
        if (!Array.isArray(transportPayload.routes) || transportPayload.routes.length < 1) {
          toast("Add at least 1 route", 2000);
          return;
        }

        await api.post("/applications", { serviceType: "TRANSPORT", payload: transportPayload });
        toast("Transport application submitted. Waiting for admin approval.", 2500);
        nav("/profile");
        return;
      }

      if (isVendor) {
        if (!vendor.shopName || !vendor.city) {
          toast("Shop name and city are required", 2000);
          return;
        }

        await api.post("/applications/vendor", {
          payload: {
            shopName: vendor.shopName,
            city: vendor.city,
            phone: vendor.phone,
            address: vendor.address,
            googleMapUrl: vendor.googleMapUrl, // ✅ NEW
          },
          documents: [],
        });

        toast("Vendor application submitted. Waiting for admin approval.", 2500);
        await fetchMyVendorApp();
        return;
      }

      toast("This service type is coming soon.", 2000);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to submit application", 2500);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="cardBody">
        <h2 style={{ margin: "0 0 6px" }}>Register a Service</h2>
        <p className="p">Submit your service for admin verification and listing.</p>

        <hr className="sep" />

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label>Service Type *</label>
            <select className="input" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              {serviceOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* VENDOR */}
          {isVendor && (
            <div className="card" style={{ boxShadow: "none" }}>
              <div className="cardBody">
                <h3 style={{ margin: "0 0 10px" }}>Vendor / Shop Details</h3>

                <div className="grid cols-2">
                  <div>
                    <label>Shop Name *</label>
                    <input
                      className="input"
                      value={vendor.shopName}
                      onChange={(e) => setVendor((p) => ({ ...p, shopName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label>City / District *</label>
                    <input
                      className="input"
                      value={vendor.city}
                      onChange={(e) => setVendor((p) => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid cols-2">
                  <div>
                    <label>Phone</label>
                    <input
                      className="input"
                      value={vendor.phone}
                      onChange={(e) => setVendor((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="03xx-xxxxxxx"
                    />
                  </div>
                  <div>
                    <label>Address</label>
                    <input
                      className="input"
                      value={vendor.address}
                      onChange={(e) => setVendor((p) => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label>Google Maps URL (Shop location)</label>
                  <input
                    className="input"
                    value={vendor.googleMapUrl}
                    onChange={(e) => setVendor((p) => ({ ...p, googleMapUrl: e.target.value }))}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <b>My Application Status:</b>
                    {loadingVendorApp ? (
                      <span className="badge">Loading...</span>
                    ) : vendorApp?.status ? (
                      <span className="badge">{vendorApp.status}</span>
                    ) : (
                      <span className="badge">Not submitted yet</span>
                    )}

                    <button type="button" className="btn" onClick={fetchMyVendorApp} disabled={!user}>
                      Refresh
                    </button>
                  </div>

                  {vendorApp?.adminNote ? (
                    <p className="p" style={{ marginTop: 8 }}>
                      <b>Admin Note:</b> {vendorApp.adminNote}
                    </p>
                  ) : null}

                  <p className="p" style={{ fontSize: 12, marginTop: 8 }}>
                    After approval, you will see “My Products” and “My Vendor Orders” in your profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* HOTEL */}
          {isHotel && (
            <>
              <div className="grid cols-2">
                <div>
                  <label>Hotel Name *</label>
                  <input className="input" value={hotel.name} onChange={(e) => setHotel((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label>City / District *</label>
                  <input className="input" value={hotel.city} onChange={(e) => setHotel((p) => ({ ...p, city: e.target.value }))} />
                </div>
              </div>

              <div>
                <label>Address</label>
                <input className="input" value={hotel.address} onChange={(e) => setHotel((p) => ({ ...p, address: e.target.value }))} />
              </div>

              <div>
                <label>Google Maps URL</label>
                <input className="input" value={hotel.mapsUrl} onChange={(e) => setHotel((p) => ({ ...p, mapsUrl: e.target.value }))} placeholder="https://maps.google.com/..." />
              </div>

              <div>
                <label>Amenities (comma separated)</label>
                <input className="input" value={hotel.amenities} onChange={(e) => setHotel((p) => ({ ...p, amenities: e.target.value }))} placeholder="WiFi, Parking, Breakfast..." />
              </div>

              <div>
                <label>Image URL</label>
                <input className="input" value={hotel.imageUrl} onChange={(e) => setHotel((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://... or /uploads/xxx.jpg" />
              </div>

              <div>
                <label>Or Upload Image</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadImage(file);
                      setHotel((p) => ({ ...p, imageUrl: url }));
                      toast("Image uploaded", 1500);
                    } catch (err) {
                      toast(err?.response?.data?.message || "Upload failed", 2500);
                    }
                  }}
                />
                {hotel.imageUrl ? (
                  <img
                    src={hotel.imageUrl}
                    alt="preview"
                    style={{
                      marginTop: 8,
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid rgba(15,23,42,0.08)",
                    }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : null}
              </div>

              <div>
                <label>Description</label>
                <textarea className="input" rows="4" value={hotel.description} onChange={(e) => setHotel((p) => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardBody">
                  <h3 style={{ margin: "0 0 8px" }}>Room Categories (required)</h3>

                  <div className="grid cols-2" style={{ marginTop: 10 }}>
                    <div>
                      <label>Room ID (optional)</label>
                      <input className="input" value={roomDraft.id} onChange={(e) => setRoomDraft((p) => ({ ...p, id: e.target.value }))} />
                    </div>

                    <div>
                      <label>Room Name *</label>
                      <input className="input" value={roomDraft.name} onChange={(e) => setRoomDraft((p) => ({ ...p, name: e.target.value }))} />
                    </div>

                    <div>
                      <label>Price / Night (PKR) *</label>
                      <input className="input" type="number" min="0" value={roomDraft.pricePerNight} onChange={(e) => setRoomDraft((p) => ({ ...p, pricePerNight: e.target.value }))} />
                    </div>

                    <div>
                      <label>Capacity</label>
                      <input className="input" type="number" min="1" value={roomDraft.capacity} onChange={(e) => setRoomDraft((p) => ({ ...p, capacity: e.target.value }))} />
                    </div>
                  </div>

                  <button type="button" className="btn" style={{ marginTop: 10 }} onClick={addRoom}>
                    Add Room
                  </button>

                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    {(hotel.rooms || []).length === 0 ? (
                      <div className="p">No rooms added yet.</div>
                    ) : (
                      hotel.rooms.map((r) => (
                        <div key={r.id} className="card" style={{ boxShadow: "none" }}>
                          <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <div>
                              <b>{r.name}</b>
                              <div className="p" style={{ fontSize: 13 }}>
                                id: {r.id} • PKR {r.pricePerNight}/night • cap {r.capacity}
                              </div>
                            </div>
                            <button type="button" className="btn" onClick={() => removeRoom(r.id)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p" style={{ fontSize: 13, marginTop: 10 }}>
                    Starting from: <b>PKR {computedPriceFrom || 0}</b>/night
                  </div>
                </div>
              </div>
            </>
          )}

          {/* GUIDE */}
          {isGuide && (
            <>
              <div className="grid cols-2">
                <div>
                  <label>Full Name *</label>
                  <input className="input" value={guide.name} onChange={(e) => setGuide((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label>Base City / District *</label>
                  <input className="input" value={guide.baseCity} onChange={(e) => setGuide((p) => ({ ...p, baseCity: e.target.value }))} />
                </div>
              </div>

              <div className="grid cols-2">
                <div>
                  <label>Phone</label>
                  <input className="input" value={guide.phone} onChange={(e) => setGuide((p) => ({ ...p, phone: e.target.value }))} placeholder="03xx-xxxxxxx" />
                </div>
                <div>
                  <label>Price Per Day (PKR)</label>
                  <input className="input" type="number" min="0" value={guide.pricePerDay} onChange={(e) => setGuide((p) => ({ ...p, pricePerDay: e.target.value }))} />
                </div>
              </div>

              <div>
                <label>Languages (comma separated)</label>
                <input className="input" value={guide.languagesText} onChange={(e) => setGuide((p) => ({ ...p, languagesText: e.target.value }))} placeholder="English, Urdu, Shina..." />
              </div>

              <div>
                <label>Specialties (comma separated)</label>
                <input className="input" value={guide.specialtiesText} onChange={(e) => setGuide((p) => ({ ...p, specialtiesText: e.target.value }))} placeholder="Hiking, Culture, Photography..." />
              </div>

              <div>
                <label>Guide Photo URL (optional)</label>
                <input className="input" value={guide.imageUrl} onChange={(e) => setGuide((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://... or /uploads/xxx.jpg" />
              </div>

              <div>
                <label>Or Upload Photo</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadImage(file);
                      setGuide((p) => ({ ...p, imageUrl: url }));
                      toast("Photo uploaded", 1500);
                    } catch (err) {
                      toast(err?.response?.data?.message || "Upload failed", 2500);
                    }
                  }}
                />
                {guide.imageUrl ? (
                  <img
                    src={guide.imageUrl}
                    alt="preview"
                    style={{
                      marginTop: 8,
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid rgba(15,23,42,0.08)",
                    }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : null}
              </div>

              <div>
                <label>Bio / Experience</label>
                <textarea className="input" rows="4" value={guide.bio} onChange={(e) => setGuide((p) => ({ ...p, bio: e.target.value }))} />
              </div>

              <div>
                <label>Government Documents (NIC / Passport / Driving License) *</label>
                <input className="input" type="file" multiple accept="image/*,application/pdf" onChange={(e) => setGuideDocs(e.target.files)} />
                <p className="p" style={{ fontSize: 12, marginTop: 8 }}>
                  These documents are private and only visible to Admin for verification.
                </p>
              </div>
            </>
          )}

          {/* TRANSPORT */}
          {isTransport && (
            <>
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardBody">
                  <h3 style={{ margin: "0 0 10px" }}>Provider Details</h3>

                  <div className="grid cols-2">
                    <div>
                      <label>Provider / Company Name *</label>
                      <input className="input" value={tp.providerName} onChange={(e) => setTp((p) => ({ ...p, providerName: e.target.value }))} placeholder="NATCO / Faisal Movers / PIA / Rent a Car..." />
                    </div>

                    <div>
                      <label>Contact Phone</label>
                      <input className="input" value={tp.contactPhone} onChange={(e) => setTp((p) => ({ ...p, contactPhone: e.target.value }))} placeholder="03xx-xxxxxxx" />
                    </div>

                    <div>
                      <label>WhatsApp</label>
                      <input className="input" value={tp.whatsapp} onChange={(e) => setTp((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="03xx-xxxxxxx" />
                    </div>

                    <div>
                      <label>Booking URL (Flights/Online booking)</label>
                      <input className="input" value={tp.bookingUrl} onChange={(e) => setTp((p) => ({ ...p, bookingUrl: e.target.value }))} placeholder="https://..." />
                    </div>

                    <div>
                      <label>Office City</label>
                      <input className="input" value={tp.officeCity} onChange={(e) => setTp((p) => ({ ...p, officeCity: e.target.value }))} placeholder="Gilgit / Skardu..." />
                    </div>

                    <div>
                      <label>Office Maps URL</label>
                      <input className="input" value={tp.officeMapsUrl} onChange={(e) => setTp((p) => ({ ...p, officeMapsUrl: e.target.value }))} placeholder="https://maps.google.com/..." />
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label>Office Address</label>
                    <input className="input" value={tp.officeAddress} onChange={(e) => setTp((p) => ({ ...p, officeAddress: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardBody">
                  <h3 style={{ margin: "0 0 10px" }}>Routes (add multiple)</h3>

                  <div className="grid cols-2">
                    <div>
                      <label>From *</label>
                      <input className="input" value={routeDraft.from} onChange={(e) => setRouteDraft((p) => ({ ...p, from: e.target.value }))} />
                    </div>

                    <div>
                      <label>To *</label>
                      <input className="input" value={routeDraft.to} onChange={(e) => setRouteDraft((p) => ({ ...p, to: e.target.value }))} />
                    </div>

                    <div>
                      <label>Type</label>
                      <select className="input" value={routeDraft.type} onChange={(e) => setRouteDraft((p) => ({ ...p, type: e.target.value }))}>
                        <option>Local</option>
                        <option>Private</option>
                        <option>Flight</option>
                      </select>
                    </div>

                    <div>
                      <label>Fare (PKR)</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={routeDraft.fare}
                        onChange={(e) => setRouteDraft((p) => ({ ...p, fare: e.target.value }))}
                        disabled={routeDraft.type === "Flight"}
                        placeholder={routeDraft.type === "Flight" ? "Use booking URL" : "e.g. 1200"}
                      />
                    </div>

                    <div>
                      <label>Availability</label>
                      <select className="input" value={routeDraft.availability} onChange={(e) => setRouteDraft((p) => ({ ...p, availability: e.target.value }))}>
                        <option>Daily</option>
                        <option>On Demand</option>
                        <option>Seasonal</option>
                        <option>Limited</option>
                      </select>
                    </div>

                    <div>
                      <label>Notes</label>
                      <input className="input" value={routeDraft.notes} onChange={(e) => setRouteDraft((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                    </div>
                  </div>

                  <button type="button" className="btn" style={{ marginTop: 10 }} onClick={addRoute}>
                    Add Route
                  </button>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {(tp.routes || []).length === 0 ? (
                      <div className="p">No routes added yet.</div>
                    ) : (
                      tp.routes.map((r, idx) => (
                        <div key={`${r.from}-${r.to}-${r.type}-${idx}`} className="card" style={{ boxShadow: "none" }}>
                          <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <div>
                              <b>{r.from} → {r.to}</b>
                              <div className="p" style={{ fontSize: 13 }}>
                                {r.type} • {r.type === "Flight" ? "Check website" : `PKR ${Number(r.fare || 0)}`} • {r.availability}
                              </div>
                              {r.notes ? <div className="p" style={{ fontSize: 12 }}>Notes: {r.notes}</div> : null}
                            </div>
                            <button type="button" className="btn" onClick={() => removeRoute(idx)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <p className="p" style={{ fontSize: 12, marginTop: 10 }}>
                    After admin approval, your routes will appear publicly and you can update fares later.
                  </p>
                </div>
              </div>
            </>
          )}

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}