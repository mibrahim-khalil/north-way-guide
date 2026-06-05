import { useMemo } from "react";

function formatPKR(n) {
  return `PKR ${Math.round(Number(n || 0)).toLocaleString("en-PK")}`;
}

function cleanPhoneToDigits(s) {
  return String(s || "").replace(/[^\d]/g, "");
}

function waLink(num) {
  const digits = cleanPhoneToDigits(num);
  if (!digits) return "";
  const normalized = digits.startsWith("0") ? `92${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export default function TransportProviderModal({ open, onClose, providerName, items = [] }) {
  const providerRoutes = useMemo(() => {
    return items.filter((x) => x.providerName === providerName);
  }, [items, providerName]);

  const p = providerRoutes[0];

  if (!open) return null;

  const whatsappUrl = waLink(p?.whatsapp);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.55)",
          zIndex: 50,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          zIndex: 60,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(920px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - 24px)",
          overflow: "auto",
          borderRadius: 18,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(15,23,42,0.10)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid rgba(15,23,42,0.08)", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 1000, fontSize: 18, color: "var(--heading)" }}>
              {providerName || "Provider"}
            </div>
            <div className="p" style={{ margin: 0 }}>
              Contact and available routes
            </div>
          </div>

          <button className="btn" onClick={onClose} type="button">Close</button>
        </div>

        <div style={{ padding: 16, display: "grid", gap: 12 }}>
          {/* Provider details */}
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardBody" style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {p?.contactPhone ? <a className="btn" href={`tel:${p.contactPhone}`}>Call</a> : null}
                {whatsappUrl ? <a className="btn primary" href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a> : null}
                {p?.bookingUrl ? <a className="btn" href={p.bookingUrl} target="_blank" rel="noreferrer">Open Booking</a> : null}
                {p?.officeMapsUrl ? <a className="btn" href={p.officeMapsUrl} target="_blank" rel="noreferrer">Office Map</a> : null}
              </div>

              <div className="p" style={{ fontSize: 13 }}>
                <b>Phone:</b> {p?.contactPhone || "—"} &nbsp;|&nbsp; <b>WhatsApp:</b> {p?.whatsapp || "—"}
              </div>
              <div className="p" style={{ fontSize: 13 }}>
                <b>Office:</b> {p?.officeCity || "—"} {p?.officeAddress ? `• ${p.officeAddress}` : ""}
              </div>
              <div className="p" style={{ fontSize: 12 }}>
                <b>Last updated:</b> {p?.updatedAt ? new Date(p.updatedAt).toLocaleString() : "—"}
              </div>
            </div>
          </div>

          {/* Routes */}
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardBody">
              <h3 style={{ margin: "0 0 10px" }}>Routes ({providerRoutes.length})</h3>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={th}>Route</th>
                      <th style={th}>Type</th>
                      <th style={th}>Fare</th>
                      <th style={th}>Availability</th>
                      <th style={th}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerRoutes.map((r) => (
                      <tr key={r._id}>
                        <td style={tdStrong}>{r.from} → {r.to}</td>
                        <td style={td}>{r.type}</td>
                        <td style={td}>{r.type === "Flight" ? "Check website" : formatPKR(r.fare)}</td>
                        <td style={td}>{r.availability}</td>
                        <td style={td}>{r.notes || "—"}</td>
                      </tr>
                    ))}

                    {providerRoutes.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: 14 }} className="p">
                          No routes found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="p" style={{ fontSize: 12, marginTop: 10 }}>
                Note: Prices are manual and may change. For flights, use official booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const th = {
  padding: "10px 10px",
  borderBottom: "1px solid rgba(15,23,42,0.10)",
  color: "var(--heading)",
  fontWeight: 1000,
  fontSize: 13,
};

const td = {
  padding: "10px 10px",
  borderBottom: "1px solid rgba(15,23,42,0.08)",
  color: "rgba(100,116,139,0.95)",
  fontWeight: 700,
  fontSize: 13,
};

const tdStrong = { ...td, color: "var(--heading)", fontWeight: 1000 };