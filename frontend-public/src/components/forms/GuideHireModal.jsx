import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./GuideHireModal.css";

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

function daysBetween(a, b) {
  if (!a || !b) return 0;
  const s = new Date(`${a}T00:00:00.000Z`);
  const e = new Date(`${b}T00:00:00.000Z`);
  const ms = e.getTime() - s.getTime();
  const n = Math.floor(ms / (1000 * 60 * 60 * 24));
  return Number.isFinite(n) ? n : 0;
}

const PAY_METHODS = [
  { code: "BANK_TRANSFER", label: "Bank Transfer" },
  { code: "EASYPAISA", label: "Easypaisa" },
  { code: "JAZZCASH", label: "JazzCash" },
  { code: "NAYAPAY", label: "NayaPay" },
];

export default function GuideHireModal({ open, onClose, guide }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const todayMin = useMemo(() => ymdLocal(new Date()), []);

  const defaultAreas = useMemo(() => {
    const common = ["Hunza", "Skardu", "Gilgit", "Astore", "Ghizer", "Shigar", "Khaplu"];
    const set = new Set([guide?.area, ...common].filter(Boolean));
    return Array.from(set);
  }, [guide?.area]);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    meetingCity: "",
    meetingPoint: "",
    notes: "",
    methodCode: "BANK_TRANSFER",
  });

  const [busy, setBusy] = useState(false);
  const [avail, setAvail] = useState({ loading: false, available: null, reason: "", note: "" });

  useEffect(() => {
    if (!open || !guide) return;

    setForm({
      fullName: "",
      phone: "",
      startDate: "",
      endDate: "",
      travelers: 1,
      meetingCity: guide?.area || "",
      meetingPoint: "",
      notes: "",
      methodCode: "BANK_TRANSFER",
    });

    setAvail({ loading: false, available: null, reason: "", note: "" });
  }, [open, guide]);

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((p) => ({
      ...p,
      [key]: key === "travelers" ? Math.max(1, Number(value || 1)) : value,
    }));
  };

  // auto-fix endDate if startDate changes
  useEffect(() => {
    if (!open) return;
    if (!form.startDate) return;

    if (form.startDate < todayMin) {
      setForm((p) => ({ ...p, startDate: todayMin }));
      return;
    }

    if (form.endDate && form.endDate <= form.startDate) {
      setForm((p) => ({ ...p, endDate: addDaysYmd(form.startDate, 1) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.startDate, open, todayMin]);

  const days = useMemo(() => daysBetween(form.startDate, form.endDate), [form.startDate, form.endDate]);

  const total = useMemo(() => {
    const p = Number(guide?.pricePerDay || 0);
    return days > 0 ? p * days : 0;
  }, [guide?.pricePerDay, days]);

  // availability check
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!open || !guide) return;

      if (!form.startDate || !form.endDate) {
        setAvail({ loading: false, available: null, reason: "", note: "" });
        return;
      }

      if (form.startDate < todayMin) {
        setAvail({ loading: false, available: false, reason: "PAST_DATE", note: "" });
        return;
      }

      if (days < 1) {
        setAvail({ loading: false, available: null, reason: "", note: "" });
        return;
      }

      setAvail({ loading: true, available: null, reason: "", note: "" });

      try {
        const res = await api.get(`/guides/${guide.id}/availability`, {
          params: { startDate: form.startDate, endDate: form.endDate },
        });

        if (!alive) return;

        setAvail({
          loading: false,
          available: Boolean(res.data?.available),
          reason: String(res.data?.reason || ""),
          note: String(res.data?.note || ""),
        });
      } catch {
        if (!alive) return;
        setAvail({ loading: false, available: null, reason: "ERROR", note: "" });
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [open, guide, form.startDate, form.endDate, days, todayMin]);

  if (!open || !guide) return null;

  const availabilityLine = (() => {
    if (avail.loading) return { text: "Checking availability...", color: "var(--muted)" };
    if (avail.available === true) return { text: "Available for selected dates", color: "rgb(16,185,129)" };
    if (avail.available === false) {
      if (avail.reason === "BLOCKED_BY_OWNER") return { text: `Not available (blocked). ${avail.note || ""}`.trim(), color: "#ef4444" };
      if (avail.reason === "ALREADY_BOOKED") return { text: "Not available (already booked)", color: "#ef4444" };
      if (avail.reason === "PAST_DATE") return { text: "Start date cannot be in the past", color: "#ef4444" };
      return { text: "Not available", color: "#ef4444" };
    }
    return { text: "Select dates to check availability", color: "var(--muted)" };
  })();

  const canSubmit =
    !busy &&
    !!user &&
    !!form.fullName &&
    !!form.phone &&
    !!form.startDate &&
    !!form.endDate &&
    form.startDate >= todayMin &&
    days >= 1 &&
    (avail.available === null || avail.available === true);

  const submit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast("Please login to hire a guide.", 2500);
      onClose?.();
      navigate("/login");
      return;
    }

    if (!form.fullName || !form.phone || !form.startDate || !form.endDate) {
      toast("Please fill all required fields.", 2500);
      return;
    }

    if (form.startDate < todayMin) {
      toast("Start date cannot be in the past.", 2500);
      return;
    }

    if (days < 1) {
      toast("End date must be after start date.", 2500);
      return;
    }

    if (avail.available === false) {
      toast("Guide is not available for these dates.", 2500);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        guideId: guide.id,
        startDate: form.startDate,
        endDate: form.endDate,
        travelers: Number(form.travelers || 1),
        meetingCity: form.meetingCity,
        meetingPoint: form.meetingPoint,
        fullName: form.fullName,
        phone: form.phone,
        notes: form.notes,
      };

      const res = await api.post("/bookings/guide", payload);
      const booking = res.data?.item;

      toast("Booking placed. Please submit payment proof.", 3000);
      onClose?.();
      navigate(`/submit-payment?type=GUIDE_BOOKING&id=${booking._id}&method=${form.methodCode}`);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to hire guide", 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="ghOverlay" onClick={busy ? undefined : onClose} />
      <div className="ghModal" role="dialog" aria-modal="true">
        <div className="ghTop">
          <div>
            <div className="ghTitle">Hire a Guide</div>
            <div className="ghSub">
              {guide.name} • ★ {guide.rating} • {guide.rate}
            </div>
          </div>
          <button className="ghClose" onClick={busy ? undefined : onClose} aria-label="Close">✕</button>
        </div>

        <form className="ghForm" onSubmit={submit}>
          <div className="ghGrid">
            <div>
              <label>Full Name *</label>
              <input className="input" value={form.fullName} onChange={onChange("fullName")} />
            </div>

            <div>
              <label>Phone Number *</label>
              <input className="input" value={form.phone} onChange={onChange("phone")} placeholder="03xx-xxxxxxx" />
            </div>

            <div>
              <label>Start Date *</label>
              <input className="input" type="date" min={todayMin} value={form.startDate} onChange={onChange("startDate")} />
            </div>

            <div>
              <label>End Date *</label>
              <input
                className="input"
                type="date"
                min={form.startDate || todayMin}
                value={form.endDate}
                onChange={onChange("endDate")}
              />
            </div>

            <div>
              <label>Travelers *</label>
              <input className="input" type="number" min="1" value={form.travelers} onChange={onChange("travelers")} />
            </div>

            <div>
              <label>Meeting City *</label>
              <select className="input" value={form.meetingCity} onChange={onChange("meetingCity")}>
                {defaultAreas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div className="p" style={{ fontSize: 12, margin: "6px 0 0", fontWeight: 900, color: availabilityLine.color }}>
                {availabilityLine.text}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Meeting Point (optional)</label>
              <input className="input" value={form.meetingPoint} onChange={onChange("meetingPoint")} placeholder="Hotel / Airport / Location..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Payment Method *</label>
              <select className="input" value={form.methodCode} onChange={onChange("methodCode")}>
                {PAY_METHODS.map((m) => (
                  <option key={m.code} value={m.code}>{m.label}</option>
                ))}
              </select>
              <p className="p" style={{ fontSize: 12, marginTop: 6 }}>
                After booking, you will upload proof and wait for verification.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Notes (optional)</label>
            <textarea className="input" rows="3" value={form.notes} onChange={onChange("notes")} placeholder="Any requirements or plan..." />
          </div>

          <div className="ghSummary">
            <div className="p" style={{ fontSize: 13 }}>
              Days: <b>{days || "—"}</b>
            </div>
            <div className="p" style={{ fontSize: 13 }}>
              Total: <b>PKR {Number(total || 0).toLocaleString("en-PK")}</b>
            </div>
          </div>

          <div className="ghActions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="btn primary" disabled={!canSubmit}>
              {busy ? "Placing..." : "Place Booking"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}