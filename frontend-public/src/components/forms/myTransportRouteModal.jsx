import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import "./MyHotelEditModal.css"; 

const empty = {
  _id: "",
  providerName: "",
  contactPhone: "",
  whatsapp: "",
  bookingUrl: "",

  from: "",
  to: "",
  type: "Local",
  fare: 0,
  availability: "Daily",
  notes: "",

  officeCity: "",
  officeMapsUrl: "",
  officeAddress: "",
};

export default function MyTransportRouteModal({ open, onClose, initial, onSave }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [open, initial]);

  const title = useMemo(() => (isEdit ? "Edit My Transport Route" : "Add Transport Route"), [isEdit]);

  if (!open) return null;

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();

    if (!form.providerName?.trim() || !form.from?.trim() || !form.to?.trim()) {
      return alert("Provider Name, From, and To are required.");
    }

    const payload = {
      ...form,
      fare: form.type === "Flight" ? 0 : Number(form.fare || 0),
    };

    setBusy(true);
    try {
      await onSave?.(payload);
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  const isFlight = form.type === "Flight";

  return createPortal(
    <>
      <div className="mhOverlay" onClick={onClose} />
      <div className="mhModal" role="dialog" aria-modal="true">
        <div className="mhTop">
          <div>
            <div className="mhTitle">{title}</div>
            <div className="mhSub">Provider info + route + office. Same style as Hotel modal.</div>
          </div>
          <button className="mhClose" onClick={onClose} type="button">✕</button>
        </div>

        <form className="mhForm" onSubmit={submit}>
          <div className="mhGrid">
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Provider Name *</label>
              <input className="mhInput" value={form.providerName} onChange={onChange("providerName")} />
            </div>

            <div>
              <label>Contact Phone</label>
              <input className="mhInput" value={form.contactPhone} onChange={onChange("contactPhone")} />
            </div>

            <div>
              <label>WhatsApp</label>
              <input className="mhInput" value={form.whatsapp} onChange={onChange("whatsapp")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Booking URL</label>
              <input className="mhInput" value={form.bookingUrl} onChange={onChange("bookingUrl")} placeholder="https://..." />
              {isFlight ? <div className="mhHint">For Flight: fare is not used. Use booking URL.</div> : null}
            </div>

            <div>
              <label>From *</label>
              <input className="mhInput" value={form.from} onChange={onChange("from")} />
            </div>

            <div>
              <label>To *</label>
              <input className="mhInput" value={form.to} onChange={onChange("to")} />
            </div>

            <div>
              <label>Type</label>
              <select className="mhInput" value={form.type} onChange={onChange("type")}>
                <option>Local</option>
                <option>Private</option>
                <option>Flight</option>
              </select>
            </div>

            <div>
              <label>Availability</label>
              <select className="mhInput" value={form.availability} onChange={onChange("availability")}>
                <option>Daily</option>
                <option>On Demand</option>
                <option>Seasonal</option>
                <option>Limited</option>
              </select>
            </div>

            <div>
              <label>Fare (PKR)</label>
              <input
                className="mhInput"
                type="number"
                min="0"
                value={form.fare}
                onChange={onChange("fare")}
                disabled={isFlight}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Notes</label>
              <input className="mhInput" value={form.notes} onChange={onChange("notes")} placeholder="Optional" />
            </div>

            <div>
              <label>Office City</label>
              <input className="mhInput" value={form.officeCity} onChange={onChange("officeCity")} />
            </div>

            <div>
              <label>Office Maps URL</label>
              <input className="mhInput" value={form.officeMapsUrl} onChange={onChange("officeMapsUrl")} placeholder="https://maps.google.com/..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Office Address</label>
              <input className="mhInput" value={form.officeAddress} onChange={onChange("officeAddress")} />
            </div>
          </div>

          <div className="mhActions">
            <button type="button" className="aBtn" onClick={onClose}>Cancel</button>
            <button type="submit" className="aBtn primary" disabled={busy}>
              {busy ? "Saving..." : (isEdit ? "Save" : "Create")}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}