import { useEffect, useMemo, useState } from "react";
import "./HotelFormModal.css";

const emptyHotel = {
  id: "", 
  name: "",
  city: "",
  rating: 0,
  priceFrom: 0,
  status: "Approved", 
  imageUrl: "",
  address: "",
  mapsUrl: "",
  description: "",
  amenitiesText: "",
  rooms: [],
};

export default function HotelFormModal({ open, onClose, initialHotel, onSave }) {
  const isEdit = Boolean(initialHotel?.id);

  const [hotel, setHotel] = useState(emptyHotel);
  const [room, setRoom] = useState({ id: "", name: "", pricePerNight: 0, capacity: 2 });

  useEffect(() => {
    if (!open) return;

    if (initialHotel) {
      const firstImg = initialHotel.images?.[0] || initialHotel.imageUrl || "";
      setHotel({
        ...emptyHotel,
        ...initialHotel,
        imageUrl: firstImg,
        amenitiesText: (initialHotel.amenities || []).join(", "),
      });
    } else {
      setHotel(emptyHotel);
    }

    setRoom({ id: "", name: "", pricePerNight: 0, capacity: 2 });
  }, [open, initialHotel]);

  const title = useMemo(() => (isEdit ? "Edit Hotel" : "Add Hotel"), [isEdit]);

  if (!open) return null;

  const onChange = (k) => (e) => setHotel((p) => ({ ...p, [k]: e.target.value }));

  const addRoom = () => {
    if (!room.name) return alert("Room name is required.");
    const price = Number(room.pricePerNight || 0);
    const capacity = Number(room.capacity || 1);

    setHotel((p) => ({
      ...p,
      rooms: [...(p.rooms || []), { ...room, pricePerNight: price, capacity }],
    }));
    setRoom({ id: "", name: "", pricePerNight: 0, capacity: 2 });
  };

  const removeRoom = (id) => {
    setHotel((p) => ({ ...p, rooms: (p.rooms || []).filter((r) => r.id !== id) }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!hotel.name || !hotel.city) {
      return alert("Hotel Name and City are required.");
    }

    const payload = {
      ...hotel,
      rating: Number(hotel.rating || 0),
      priceFrom: Number(hotel.priceFrom || 0),
      images: hotel.imageUrl ? [hotel.imageUrl] : [],
      amenities: String(hotel.amenitiesText || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };

    await onSave?.(payload);
  };

  return (
    <>
      <div className="hmOverlay" onClick={onClose} />
      <div className="hmModal" role="dialog" aria-modal="true">
        <div className="hmTop">
          <div>
            <div className="hmTitle">{title}</div>
            <div className="hmSub">MongoDB Atlas Connected</div>
          </div>
          <button className="hmClose" onClick={onClose}>✕</button>
        </div>

        <form className="hmForm" onSubmit={submit}>
          <div className="hmGrid">
            {isEdit && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Hotel ID (MongoDB)</label>
                <input className="hmInput" value={hotel.id} disabled />
              </div>
            )}

            <div>
              <label>Status</label>
              <select className="hmInput" value={hotel.status} onChange={onChange("status")}>
                <option>Approved</option>
                <option>Hidden</option>
              </select>
            </div>

            <div>
              <label>Name *</label>
              <input className="hmInput" value={hotel.name} onChange={onChange("name")} />
            </div>

            <div>
              <label>City / District *</label>
              <input className="hmInput" value={hotel.city} onChange={onChange("city")} />
            </div>

            <div>
              <label>Rating</label>
              <input className="hmInput" type="number" step="0.1" min="0" max="5" value={hotel.rating} onChange={onChange("rating")} />
            </div>

            <div>
              <label>Price From (PKR)</label>
              <input className="hmInput" type="number" min="0" value={hotel.priceFrom} onChange={onChange("priceFrom")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Image URL</label>
              <input className="hmInput" value={hotel.imageUrl} onChange={onChange("imageUrl")} placeholder="https://..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Address</label>
              <input className="hmInput" value={hotel.address} onChange={onChange("address")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Google Maps URL</label>
              <input className="hmInput" value={hotel.mapsUrl} onChange={onChange("mapsUrl")} placeholder="https://www.google.com/maps/..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea className="hmInput" rows="3" value={hotel.description} onChange={onChange("description")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Amenities (comma separated)</label>
              <input className="hmInput" value={hotel.amenitiesText} onChange={onChange("amenitiesText")} placeholder="Wi‑Fi, Breakfast, Parking" />
            </div>
          </div>

          <div className="hmRooms">
            <div className="hmRoomsTop">
              <div className="hmRoomsTitle">Room Categories</div>
              <div className="hmRoomsHint">Optional</div>
            </div>

            <div className="hmRoomAdd">
              <input className="hmInput" placeholder="Room id (optional)" value={room.id} onChange={(e) => setRoom((p) => ({ ...p, id: e.target.value }))} />
              <input className="hmInput" placeholder="Room name*" value={room.name} onChange={(e) => setRoom((p) => ({ ...p, name: e.target.value }))} />
              <input className="hmInput" type="number" placeholder="Price/night" value={room.pricePerNight} onChange={(e) => setRoom((p) => ({ ...p, pricePerNight: e.target.value }))} />
              <input className="hmInput" type="number" placeholder="Capacity" value={room.capacity} onChange={(e) => setRoom((p) => ({ ...p, capacity: e.target.value }))} />
              <button type="button" className="aBtn" onClick={addRoom}>Add</button>
            </div>

            <div className="hmRoomList">
              {(hotel.rooms || []).length === 0 ? (
                <div className="adminMuted">No rooms added yet.</div>
              ) : (
                (hotel.rooms || []).map((r) => (
                  <div key={r.id || r.name} className="hmRoomItem">
                    <div>
                      <div className="hmRoomName">{r.name}</div>
                      <div className="hmRoomMeta">
                        id: <b>{r.id || "—"}</b> • PKR <b>{r.pricePerNight}</b>/night • cap <b>{r.capacity}</b>
                      </div>
                    </div>
                    <button type="button" className="aBtn danger" onClick={() => removeRoom(r.id)}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="hmActions">
            <button type="button" className="aBtn" onClick={onClose}>Cancel</button>
            <button type="submit" className="aBtn primary">{isEdit ? "Save Changes" : "Create Hotel"}</button>
          </div>
        </form>
      </div>
    </>
  );
}