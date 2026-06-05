import { useEffect, useMemo, useState } from "react";
import "./TransportFormModal.css";

const emptyRoute = {
  id: "",

  // Provider / directory fields (NEW)
  providerName: "",
  contactPhone: "",
  whatsapp: "",
  bookingUrl: "",
  officeCity: "",
  officeAddress: "",
  officeMapsUrl: "",

  // route fields
  from: "",
  to: "",
  type: "Local", // Local | Private | Flight
  fare: 0,
  availability: "Daily",
  status: "Active",
  notes: "",
};

export default function TransportFormModal({ open, onClose, initialRoute, onSave }) {
  const isEdit = Boolean(initialRoute?.id);
  const [route, setRoute] = useState(emptyRoute);

  useEffect(() => {
    if (!open) return;
    setRoute(initialRoute ? { ...emptyRoute, ...initialRoute } : emptyRoute);
  }, [open, initialRoute]);

  const title = useMemo(
    () => (isEdit ? "Edit Transport Route" : "Add Transport Route"),
    [isEdit]
  );

  if (!open) return null;

  const onChange = (k) => (e) => setRoute((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();

    if (!route.providerName?.trim() || !route.from?.trim() || !route.to?.trim()) {
      return alert("Provider Name, From, and To are required.");
    }

    // If Flight: fare is optional; bookingUrl is strongly recommended
    if (route.type === "Flight" && !String(route.bookingUrl || "").trim()) {
      const ok = confirm("This is a Flight route but Booking URL is empty. Continue anyway?");
      if (!ok) return;
    }

    const payload = {
      ...route,
      fare: route.type === "Flight" ? 0 : Number(route.fare || 0),
    };

    await onSave?.(payload);
  };

  const isFlight = route.type === "Flight";

  return (
    <>
      <div className="tmOverlay" onClick={onClose} />
      <div className="tmModal" role="dialog" aria-modal="true">
        <div className="tmTop">
          <div>
            <div className="tmTitle">{title}</div>
            <div className="tmSub">Transport Directory (Admin • DB)</div>
          </div>
          <button className="tmClose" onClick={onClose}>✕</button>
        </div>

        <form className="tmForm" onSubmit={submit}>
          <div className="tmGrid">
            {isEdit && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Route ID (MongoDB)</label>
                <input className="tmInput" value={route.id} disabled />
              </div>
            )}

            {/* ✅ Provider */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Provider / Company Name *</label>
              <input
                className="tmInput"
                value={route.providerName}
                onChange={onChange("providerName")}
                placeholder="e.g. NATCO, Faisal Movers, PIA"
              />
            </div>

            <div>
              <label>Status</label>
              <select className="tmInput" value={route.status} onChange={onChange("status")}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div>
              <label>Type</label>
              <select className="tmInput" value={route.type} onChange={onChange("type")}>
                <option>Local</option>
                <option>Private</option>
                <option>Flight</option>
              </select>
            </div>

            <div>
              <label>From *</label>
              <input className="tmInput" value={route.from} onChange={onChange("from")} />
            </div>

            <div>
              <label>To *</label>
              <input className="tmInput" value={route.to} onChange={onChange("to")} />
            </div>

            <div>
              <label>Fare (PKR)</label>
              <input
                className="tmInput"
                type="number"
                min="0"
                value={route.fare}
                onChange={onChange("fare")}
                disabled={isFlight}
                placeholder={isFlight ? "Not used for Flight" : "e.g. 1200"}
              />
              {isFlight ? (
                <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginTop: 6 }}>
                  For flights, leave fare empty and add Booking URL.
                </div>
              ) : null}
            </div>

            <div>
              <label>Availability</label>
              <select className="tmInput" value={route.availability} onChange={onChange("availability")}>
                <option>Daily</option>
                <option>On Demand</option>
                <option>Seasonal</option>
                <option>Limited</option>
              </select>
            </div>

            {/* Contacts */}
            <div>
              <label>Contact Phone</label>
              <input
                className="tmInput"
                value={route.contactPhone}
                onChange={onChange("contactPhone")}
                placeholder="e.g. 05811xxxxxx / 03xxxxxxxxx"
              />
            </div>

            <div>
              <label>WhatsApp</label>
              <input
                className="tmInput"
                value={route.whatsapp}
                onChange={onChange("whatsapp")}
                placeholder="e.g. 03xxxxxxxxx"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Booking URL</label>
              <input
                className="tmInput"
                value={route.bookingUrl}
                onChange={onChange("bookingUrl")}
                placeholder="https://..."
              />
              <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginTop: 6 }}>
                Use this for airline booking pages or company ticket pages.
              </div>
            </div>

            {/* Office */}
            <div>
              <label>Office City</label>
              <input
                className="tmInput"
                value={route.officeCity}
                onChange={onChange("officeCity")}
                placeholder="e.g. Gilgit"
              />
            </div>

            <div>
              <label>Office Maps URL</label>
              <input
                className="tmInput"
                value={route.officeMapsUrl}
                onChange={onChange("officeMapsUrl")}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Office Address</label>
              <input
                className="tmInput"
                value={route.officeAddress}
                onChange={onChange("officeAddress")}
                placeholder="Street / Terminal / Area..."
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Notes</label>
              <textarea
                className="tmInput"
                rows="3"
                value={route.notes}
                onChange={onChange("notes")}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className="tmActions">
            <button type="button" className="aBtn" onClick={onClose}>Cancel</button>
            <button type="submit" className="aBtn primary">
              {isEdit ? "Save Changes" : "Create Route"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}