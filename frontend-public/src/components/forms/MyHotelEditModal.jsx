import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";
import "./MyHotelEditModal.css";

const empty = {
  id: "",
  name: "",
  city: "",
  address: "",
  mapsUrl: "",
  description: "",
  amenitiesText: "",
  imageUrl: "",
  rooms: [],
  priceFrom: 0,
};

function ymdFromDateLike(x) {
  if (!x) return "";
  try {
    return new Date(x).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function toUtcDate(ymd) {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function MyHotelEditModal({ open, onClose, hotel, onSaved }) {
  const isEdit = Boolean(hotel?._id || hotel?.id);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const [roomDraft, setRoomDraft] = useState({
    id: "",
    name: "",
    pricePerNight: "",
    capacity: 2,
  });

  // blocked range draft per roomId
  const [blockDraft, setBlockDraft] = useState({}); // { [roomId]: { from:"YYYY-MM-DD", to:"YYYY-MM-DD", note:"" } }

  useEffect(() => {
    if (!open) return;
    if (!hotel) {
      setForm(empty);
      return;
    }

    const id = hotel.id || hotel._id;
    const firstImg = hotel.image || (hotel.images && hotel.images[0]) || "";

    const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
    const normalizedRooms = rooms.map((r, idx) => ({
      id: r.id || `idx-${idx}`,
      name: r.name || "",
      pricePerNight: Number(r.pricePerNight || 0),
      capacity: Number(r.capacity || 2),
      unavailableRanges: Array.isArray(r.unavailableRanges) ? r.unavailableRanges : [],
    }));

    setForm({
      id,
      name: hotel.name || "",
      city: hotel.city || "",
      address: hotel.address || "",
      mapsUrl: hotel.mapsUrl || "",
      description: hotel.description || "",
      amenitiesText: Array.isArray(hotel.amenities) ? hotel.amenities.join(", ") : "",
      imageUrl: firstImg,
      rooms: normalizedRooms,
      priceFrom: Number(hotel.priceFrom || 0),
    });

    setRoomDraft({ id: "", name: "", pricePerNight: "", capacity: 2 });
    setBlockDraft({});
  }, [open, hotel]);

  const computedPriceFrom = useMemo(() => {
    const rooms = form.rooms || [];
    if (!rooms.length) return Number(form.priceFrom || 0);
    return Math.min(...rooms.map((r) => Number(r.pricePerNight || 0)));
  }, [form.rooms, form.priceFrom]);

  if (!open) return null;

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const addRoom = () => {
    if (!roomDraft.name) return alert("Room name is required");
    const price = Number(roomDraft.pricePerNight || 0);
    if (price <= 0) return alert("Room price must be > 0");
    const cap = Math.max(1, Number(roomDraft.capacity || 1));

    const id = (roomDraft.id || roomDraft.name).toLowerCase().trim().replace(/\s+/g, "-");
    if ((form.rooms || []).some((r) => r.id === id)) return alert("Room id already exists");

    setForm((p) => ({
      ...p,
      rooms: [...(p.rooms || []), { id, name: roomDraft.name, pricePerNight: price, capacity: cap, unavailableRanges: [] }],
    }));

    setRoomDraft({ id: "", name: "", pricePerNight: "", capacity: 2 });
  };

  const removeRoom = (rid) => {
    setForm((p) => ({ ...p, rooms: (p.rooms || []).filter((r) => r.id !== rid) }));
  };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await api.post("/uploads/image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setForm((p) => ({ ...p, imageUrl: res.data.url }));
  };

  const updateBlockDraft = (roomId, key, value) => {
    setBlockDraft((p) => ({
      ...p,
      [roomId]: { ...(p[roomId] || { from: "", to: "", note: "" }), [key]: value },
    }));
  };

  const addBlockedRange = (roomId) => {
    const d = blockDraft[roomId] || { from: "", to: "", note: "" };
    if (!d.from || !d.to) return alert("Blocked From and To dates are required.");

    const fromD = toUtcDate(d.from);
    const toD = toUtcDate(d.to);
    if (!fromD || !toD) return alert("Invalid blocked dates.");
    if (toD <= fromD) return alert("Blocked To must be after Blocked From.");

    setForm((p) => ({
      ...p,
      rooms: (p.rooms || []).map((r) => {
        if (r.id !== roomId) return r;
        const next = {
          from: fromD.toISOString(),
          to: toD.toISOString(),
          note: String(d.note || ""),
        };
        return { ...r, unavailableRanges: [...(r.unavailableRanges || []), next] };
      }),
    }));

    setBlockDraft((p) => ({ ...p, [roomId]: { from: "", to: "", note: "" } }));
  };

  const removeBlockedRange = (roomId, idx) => {
    setForm((p) => ({
      ...p,
      rooms: (p.rooms || []).map((r) => {
        if (r.id !== roomId) return r;
        return { ...r, unavailableRanges: (r.unavailableRanges || []).filter((_, i) => i !== idx) };
      }),
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!isEdit) return;

    if (!form.name || !form.city) return alert("Hotel name and city are required");
    if (!Array.isArray(form.rooms) || form.rooms.length < 1) return alert("At least 1 room is required");

    setBusy(true);
    try {
      const payload = {
        name: form.name,
        city: form.city,
        address: form.address,
        mapsUrl: form.mapsUrl,
        description: form.description,
        amenities: String(form.amenitiesText || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        images: form.imageUrl ? [form.imageUrl] : [],
        rooms: form.rooms,
        priceFrom: computedPriceFrom,
      };

      await api.put(`/my/hotels/${form.id}`, payload);
      onSaved?.();
      onClose?.();
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <>
      <div className="mhOverlay" onClick={onClose} />
      <div className="mhModal" role="dialog" aria-modal="true">
        <div className="mhTop">
          <div>
            <div className="mhTitle">Edit My Hotel</div>
            <div className="mhSub">Tip: Manage room availability (blocked dates) below.</div>
          </div>
          <button className="mhClose" onClick={onClose}>✕</button>
        </div>

        <form className="mhForm" onSubmit={save}>
          <div className="mhGrid">
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Hotel ID</label>
              <input className="mhInput" value={form.id} disabled />
            </div>

            <div>
              <label>Name *</label>
              <input className="mhInput" value={form.name} onChange={onChange("name")} />
            </div>

            <div>
              <label>City *</label>
              <input className="mhInput" value={form.city} onChange={onChange("city")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Address</label>
              <input className="mhInput" value={form.address} onChange={onChange("address")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Google Maps URL</label>
              <input className="mhInput" value={form.mapsUrl} onChange={onChange("mapsUrl")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea className="mhInput" rows="3" value={form.description} onChange={onChange("description")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Amenities (comma separated)</label>
              <input className="mhInput" value={form.amenitiesText} onChange={onChange("amenitiesText")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Image (Upload)</label>
              <input
                className="mhInput"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
              />
              <div className="mhHint">Or paste Image URL below</div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Image URL (fallback)</label>
              <input className="mhInput" value={form.imageUrl} onChange={onChange("imageUrl")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Room Categories (required)</label>

              <div className="mhRoomGrid">
                <input
                  className="mhInput"
                  placeholder="Room id (optional)"
                  value={roomDraft.id}
                  onChange={(e) => setRoomDraft((p) => ({ ...p, id: e.target.value }))}
                />
                <input
                  className="mhInput"
                  placeholder="Room name *"
                  value={roomDraft.name}
                  onChange={(e) => setRoomDraft((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  className="mhInput"
                  type="number"
                  placeholder="Price/night *"
                  value={roomDraft.pricePerNight}
                  onChange={(e) => setRoomDraft((p) => ({ ...p, pricePerNight: e.target.value }))}
                />
                <input
                  className="mhInput"
                  type="number"
                  placeholder="Capacity"
                  value={roomDraft.capacity}
                  onChange={(e) => setRoomDraft((p) => ({ ...p, capacity: e.target.value }))}
                />
              </div>

              <button type="button" className="aBtn" style={{ marginTop: 10 }} onClick={addRoom}>
                Add Room
              </button>

              <div className="mhRoomList">
                {(form.rooms || []).map((r) => (
                  <div key={r.id} className="mhRoomRow" style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 900 }}>
                        {r.name} — PKR {r.pricePerNight}/night — cap {r.capacity} — <span style={{ opacity: 0.7 }}>id: {r.id}</span>
                      </div>

                      <button type="button" className="aBtn danger" onClick={() => removeRoom(r.id)}>
                        Remove Room
                      </button>
                    </div>

                    {/* Blocked dates manager */}
                    <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.65)" }}>
                      <div style={{ fontWeight: 1000, marginBottom: 8 }}>Blocked Dates (this room will not be bookable)</div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.6fr auto", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 900 }}>From (check-in)</label>
                          <input
                            className="mhInput"
                            type="date"
                            value={(blockDraft[r.id]?.from || "")}
                            onChange={(e) => updateBlockDraft(r.id, "from", e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 900 }}>To (check-out)</label>
                          <input
                            className="mhInput"
                            type="date"
                            value={(blockDraft[r.id]?.to || "")}
                            onChange={(e) => updateBlockDraft(r.id, "to", e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 900 }}>Note (optional)</label>
                          <input
                            className="mhInput"
                            value={(blockDraft[r.id]?.note || "")}
                            onChange={(e) => updateBlockDraft(r.id, "note", e.target.value)}
                            placeholder="Maintenance / Fully booked / Renovation..."
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "end" }}>
                          <button type="button" className="aBtn" onClick={() => addBlockedRange(r.id)}>
                            Add
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {(r.unavailableRanges || []).length === 0 ? (
                          <div className="adminMuted">No blocked ranges.</div>
                        ) : (
                          (r.unavailableRanges || []).map((x, idx) => (
                            <div key={x._id || idx} style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                              <div className="adminMuted" style={{ fontWeight: 900 }}>
                                {ymdFromDateLike(x.from)} → {ymdFromDateLike(x.to)}
                                {x.note ? ` • ${x.note}` : ""}
                              </div>
                              <button type="button" className="aBtn danger" onClick={() => removeBlockedRange(r.id, idx)}>
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {(form.rooms || []).length === 0 && <div className="adminMuted">No rooms yet.</div>}
              </div>

              <div className="mhHint" style={{ marginTop: 8 }}>
                Starting from: <b>PKR {computedPriceFrom || 0}</b>/night
              </div>
            </div>
          </div>

          <div className="mhActions">
            <button type="button" className="aBtn" onClick={onClose}>Cancel</button>
            <button type="submit" className="aBtn primary" disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}