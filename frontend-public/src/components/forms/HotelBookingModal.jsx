import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./HotelBookingModal.css";

function ymdLocal(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysYmd(ymd, days) {
  if (!ymd) return "";
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

function nightsBetween(a, b) {
  if (!a || !b) return 0;
  const inD = new Date(`${a}T00:00:00.000Z`);
  const outD = new Date(`${b}T00:00:00.000Z`);
  const ms = outD.getTime() - inD.getTime();
  const n = Math.floor(ms / (1000 * 60 * 60 * 24));
  return Number.isFinite(n) ? n : 0;
}

const PAY_METHODS = [
  { code: "BANK_TRANSFER", label: "Bank Transfer" },
  { code: "EASYPAISA", label: "Easypaisa" },
  { code: "JAZZCASH", label: "JazzCash" },
  { code: "NAYAPAY", label: "NayaPay" },
];

export default function HotelBookingModal({ open, onClose, hotel }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const todayMin = useMemo(() => ymdLocal(new Date()), []);

  const rooms = hotel?.rooms || [];

  const roomOptions = useMemo(() => {
    return rooms.map((r, idx) => ({
      key: r.id ? String(r.id) : `idx-${idx}`,
      room: r,
      roomIndex: idx,
      roomId: r.id ? String(r.id) : "",
    }));
  }, [rooms]);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: 2,
    roomKey: "",
    notes: "",
    methodCode: "BANK_TRANSFER",
  });

  const [busy, setBusy] = useState(false);

  // availability state
  const [avail, setAvail] = useState({ loading: false, available: null, reason: "", note: "" });

  useEffect(() => {
    if (!open || !hotel) return;

    setForm((prev) => ({
      ...prev,
      guests: prev.guests || 2,
      roomKey: roomOptions[0]?.key || "",
      notes: "",
      checkIn: "",
      checkOut: "",
      methodCode: "BANK_TRANSFER",
    }));

    setAvail({ loading: false, available: null, reason: "", note: "" });
  }, [open, hotel, roomOptions]);

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((p) => ({
      ...p,
      [key]: key === "guests" ? Math.max(1, Number(value || 1)) : value,
    }));
  };

  const selectedWrap = useMemo(
    () => roomOptions.find((x) => x.key === form.roomKey) || null,
    [roomOptions, form.roomKey]
  );
  const selected = selectedWrap?.room || null;

  // auto-fix checkout if checkin changes
  useEffect(() => {
    if (!open) return;
    if (!form.checkIn) return;

    // prevent past check-in (UI level)
    if (form.checkIn < todayMin) {
      setForm((p) => ({ ...p, checkIn: todayMin }));
      return;
    }

    if (form.checkOut && form.checkOut <= form.checkIn) {
      setForm((p) => ({ ...p, checkOut: addDaysYmd(form.checkIn, 1) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.checkIn, open, todayMin]);

  const nights = useMemo(() => nightsBetween(form.checkIn, form.checkOut), [form.checkIn, form.checkOut]);

  const total = useMemo(() => {
    const p = Number(selected?.pricePerNight || 0);
    return nights > 0 ? p * nights : 0;
  }, [selected, nights]);

  // Check availability when dates/room changes
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!open || !hotel) return;

      // reset if incomplete
      if (!form.checkIn || !form.checkOut || !selectedWrap) {
        setAvail({ loading: false, available: null, reason: "", note: "" });
        return;
      }

      if (form.checkIn < todayMin) {
        setAvail({ loading: false, available: false, reason: "PAST_DATE", note: "" });
        return;
      }

      if (nights < 1) {
        setAvail({ loading: false, available: null, reason: "", note: "" });
        return;
      }

      setAvail({ loading: true, available: null, reason: "", note: "" });

      try {
        const hotelId = hotel._id || hotel.id;

        const res = await api.get(`/hotels/${hotelId}/availability`, {
          params: {
            roomId: selectedWrap.roomId || "",
            roomIndex: selectedWrap.roomIndex ?? -1,
            checkInDate: form.checkIn,
            checkOutDate: form.checkOut,
          },
        });

        if (!alive) return;
        setAvail({
          loading: false,
          available: Boolean(res.data?.available),
          reason: String(res.data?.reason || ""),
          note: String(res.data?.note || ""),
        });
      } catch (e) {
        if (!alive) return;
        setAvail({ loading: false, available: null, reason: "ERROR", note: "" });
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [open, hotel, form.checkIn, form.checkOut, form.roomKey, nights, selectedWrap, todayMin]);

  if (!open || !hotel) return null;

  const canSubmit =
    !busy &&
    !!user &&
    !!form.fullName &&
    !!form.phone &&
    !!form.checkIn &&
    !!form.checkOut &&
    !!form.roomKey &&
    nights >= 1 &&
    form.checkIn >= todayMin &&
    (avail.available === null || avail.available === true); // allow submit if check not run yet, but block if false

  const availabilityLine = (() => {
    if (avail.loading) return { text: "Checking availability...", color: "var(--muted)" };
    if (avail.available === true) return { text: "Available for selected dates", color: "rgb(16,185,129)" };
    if (avail.available === false) {
      if (avail.reason === "BLOCKED_BY_OWNER") return { text: `Not available (blocked). ${avail.note || ""}`.trim(), color: "#ef4444" };
      if (avail.reason === "ALREADY_BOOKED") return { text: "Not available (already booked)", color: "#ef4444" };
      if (avail.reason === "PAST_DATE") return { text: "Check-in cannot be in the past", color: "#ef4444" };
      return { text: "Not available", color: "#ef4444" };
    }
    return { text: "Select room and dates to check availability", color: "var(--muted)" };
  })();

  const submit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast("Please login to place a booking.", 2500);
      onClose?.();
      navigate("/login");
      return;
    }

    if (!form.fullName || !form.phone || !form.checkIn || !form.checkOut || !form.roomKey) {
      toast("Please fill all required fields.", 2500);
      return;
    }

    if (form.checkIn < todayMin) {
      toast("Check-in cannot be in the past.", 2500);
      return;
    }

    if (nights < 1) {
      toast("Check-out must be after check-in.", 2500);
      return;
    }

    if (avail.available === false) {
      toast("Selected room is not available for these dates.", 2500);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        hotelId: hotel._id || hotel.id,
        roomId: selectedWrap?.roomId || "",
        roomIndex: selectedWrap?.roomIndex ?? -1,
        checkInDate: form.checkIn,
        checkOutDate: form.checkOut,
        guests: Number(form.guests || 1),
        fullName: form.fullName,
        phone: form.phone,
        notes: form.notes,
      };

      const res = await api.post("/bookings/hotel", payload);
      const booking = res.data?.item;

      toast("Booking placed. Please submit payment proof.", 3000);
      onClose?.();
      navigate(`/submit-payment?type=HOTEL_BOOKING&id=${booking._id}&method=${form.methodCode}`);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to place booking", 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="hbOverlay" onClick={busy ? undefined : onClose} />
      <div className="hbModal" role="dialog" aria-modal="true">
        <div className="hbTop">
          <div>
            <div className="hbTitle">Book Room</div>
            <div className="hbSub">
              {hotel.name} • {hotel.city}
            </div>
          </div>
          <button className="hbClose" onClick={busy ? undefined : onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {roomOptions.length === 0 ? (
          <div className="hbForm">
            <p className="p">No room categories available for this hotel yet.</p>
            <div className="hbActions">
              <button type="button" className="btn primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form className="hbForm" onSubmit={submit}>
            <div className="hbGrid">
              <div>
                <label>Full Name *</label>
                <input className="input" value={form.fullName} onChange={onChange("fullName")} />
              </div>

              <div>
                <label>Phone Number *</label>
                <input className="input" value={form.phone} onChange={onChange("phone")} placeholder="03xx-xxxxxxx" />
              </div>

              <div>
                <label>Check-in Date *</label>
                <input className="input" type="date" min={todayMin} value={form.checkIn} onChange={onChange("checkIn")} />
              </div>

              <div>
                <label>Check-out Date *</label>
                <input
                  className="input"
                  type="date"
                  min={form.checkIn || todayMin}
                  value={form.checkOut}
                  onChange={onChange("checkOut")}
                />
              </div>

              <div>
                <label>Guests *</label>
                <input className="input" type="number" min="1" value={form.guests} onChange={onChange("guests")} />
              </div>

              <div>
                <label>Room Category *</label>
                <select className="input" value={form.roomKey} onChange={onChange("roomKey")}>
                  {roomOptions.map(({ key, room }) => (
                    <option key={key} value={key}>
                      {room.name} — PKR {room.pricePerNight}/night (Cap {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div className="p" style={{ fontSize: 12, margin: "6px 0 0", fontWeight: 900, color: availabilityLine.color }}>
                  {availabilityLine.text}
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label>Payment Method *</label>
                <select className="input" value={form.methodCode} onChange={onChange("methodCode")}>
                  {PAY_METHODS.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="p" style={{ fontSize: 12, marginTop: 6 }}>
                  After booking, you will upload proof and wait for admin verification.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Notes (optional)</label>
              <textarea className="input" rows="3" value={form.notes} onChange={onChange("notes")} placeholder="Any special request..." />
            </div>

            <div className="hbSummary">
              <div className="p" style={{ fontSize: 13 }}>
                Selected: <b>{selected?.name || "—"}</b>
              </div>
              <div className="p" style={{ fontSize: 13 }}>
                Nights: <b>{nights || "—"}</b>
              </div>
              <div className="p" style={{ fontSize: 13 }}>
                Total: <b>PKR {Number(total || 0).toLocaleString("en-PK")}</b>
              </div>
            </div>

            <div className="hbActions">
              <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={!canSubmit}>
                {busy ? "Placing..." : "Place Booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}