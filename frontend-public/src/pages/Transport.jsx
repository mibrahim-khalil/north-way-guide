import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";
import TransportProviderModal from "../components/common/TransportProviderModal";

const SEASONS = [
  { value: "off", label: "Off Season (Nov–Mar)", hint: "Lower fares, limited availability on some routes." },
  { value: "peak", label: "Peak Season (Apr–Oct)", hint: "Higher demand; fares can increase." },
];

const UPDATE_HOURS = 48;

function factorBySeason(season) {
  return season === "peak" ? 1.15 : 1.0;
}

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

export default function Transport() {
  const [season, setSeason] = useState("off");
  const factor = factorBySeason(season);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("All"); // All | Local | Private | Flight


  const [providerOpen, setProviderOpen] = useState(false);
  const [providerName, setProviderName] = useState("");

  const openProvider = (name) => {
    if (!name) return;
    setProviderName(name);
    setProviderOpen(true);
  };

  useEffect(() => {
    setLoading(true);
    api
      .get("/transport") // public active only
      .then((res) => setItems(res.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(() => {
    const set = new Set();
    for (const x of items) {
      if (x.from) set.add(x.from);
      if (x.to) set.add(x.to);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  useEffect(() => {
    if (!locations.length) return;
    if (!from) setFrom(locations[0]);
    if (!to) setTo(locations[1] || locations[0]);
  }, [locations]);

  const results = useMemo(() => {
    return items
      .filter((x) => (type === "All" ? true : x.type === type))
      .filter((x) => x.from === from && x.to === to)
      .map((x) => {
        const fareAdjusted = x.type === "Flight" ? "Check website" : formatPKR(Number(x.fare || 0) * factor);

        const updatedAt = x.updatedAt ? new Date(x.updatedAt) : null;
        const stale = updatedAt ? (Date.now() - updatedAt.getTime()) > UPDATE_HOURS * 3600 * 1000 : false;

        return { ...x, fareAdjusted, stale, updatedAt };
      });
  }, [items, from, to, factor, type]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card">
        <div className="cardBody" style={{ textAlign: "center", padding: "26px 18px" }}>
          <h2 style={{ margin: "0 0 8px" }}>Transport (Directory + Manual Pricing)</h2>
          <p className="p" style={{ maxWidth: 820, margin: "0 auto" }}>
            Prices are entered manually by admin and typically updated within <b>{UPDATE_HOURS} hours</b>.
            For flights, use the airline’s official booking link.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <a className="btn primary" href="#compare">Compare</a>
            <a className="btn" href="#allroutes">All Routes</a>
          </div>
        </div>
      </div>

      <div id="compare" className="card">
        <div className="cardBody">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 6px" }}>Select Your Route</h3>
              <p className="p">{loading ? "Loading..." : "Choose From/To, Type and Season to preview fare + booking info."}</p>
            </div>
            <span className="badge">{SEASONS.find((s) => s.value === season)?.label}</span>
          </div>

          <hr className="sep" />

          <div className="grid cols-4">
            <div>
              <label>From</label>
              <select value={from} onChange={(e) => setFrom(e.target.value)} disabled={!locations.length}>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label>To</label>
              <select value={to} onChange={(e) => setTo(e.target.value)} disabled={!locations.length}>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="All">All</option>
                <option value="Local">Local (Bus/Public)</option>
                <option value="Private">Private (Rent-a-car)</option>
                <option value="Flight">Flight</option>
              </select>
            </div>

            <div>
              <label>Season</label>
              <select value={season} onChange={(e) => setSeason(e.target.value)}>
                {SEASONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div className="p" style={{ fontSize: 12, marginTop: 8 }}>
                {SEASONS.find((s) => s.value === season)?.hint}
              </div>
            </div>
          </div>

          <hr className="sep" />

          <div style={{ display: "grid", gap: 10 }}>
            {!loading && results.length ? results.map((r) => {
              const whatsappUrl = waLink(r.whatsapp);
              return (
                <div
                  key={r._id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(15,23,42,0.08)",
                    background: "rgba(255,255,255,0.65)",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <button
                        type="button"
                        onClick={() => openProvider(r.providerName)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          fontWeight: 1000,
                          color: "var(--heading)",
                          textDecoration: "underline",
                        }}
                        title="View provider details & all routes"
                      >
                        {r.providerName || "—"}
                      </button>

                      <div className="p" style={{ fontSize: 13 }}>
                        {r.from} → {r.to} • {r.type} • Availability: {r.availability}
                      </div>

                      {r.updatedAt ? (
                        <div className="p" style={{ fontSize: 12 }}>
                          Last updated: <b>{r.updatedAt.toLocaleString()}</b> {r.stale ? " (may be outdated)" : ""}
                        </div>
                      ) : null}

                      {r.notes ? <div className="p" style={{ fontSize: 12 }}>Notes: {r.notes}</div> : null}
                    </div>

                    <div style={{ fontWeight: 1000, color: "var(--heading)" }}>
                      {r.fareAdjusted}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {r.contactPhone ? (
                      <a className="btn" href={`tel:${r.contactPhone}`}>Call</a>
                    ) : null}

                    {whatsappUrl ? (
                      <a className="btn primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                        WhatsApp
                      </a>
                    ) : null}

                    {r.bookingUrl ? (
                      <a className="btn" href={r.bookingUrl} target="_blank" rel="noreferrer">
                        Open Booking
                      </a>
                    ) : null}

                    {r.officeMapsUrl ? (
                      <a className="btn" href={r.officeMapsUrl} target="_blank" rel="noreferrer">
                        Office Map
                      </a>
                    ) : null}
                  </div>

                  {(r.officeCity || r.officeAddress) ? (
                    <div className="p" style={{ fontSize: 12 }}>
                      <b>Office:</b> {r.officeCity || "—"} {r.officeAddress ? `• ${r.officeAddress}` : ""}
                    </div>
                  ) : null}
                </div>
              );
            }) : (
              !loading && <div className="p">No routes found for this selection. Ask admin to add routes.</div>
            )}
          </div>
        </div>
      </div>

      <div id="allroutes" className="card">
        <div className="cardBody">
          <h3 style={{ margin: "0 0 10px" }}>All Active Routes</h3>

          {loading ? (
            <div className="p">Loading...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={th}>Provider</th>
                    <th style={th}>Route</th>
                    <th style={th}>Type</th>
                    <th style={th}>Fare</th>
                    <th style={th}>Availability</th>
                    <th style={th}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r._id}>
                      <td style={tdStrong}>
                        <button
                          type="button"
                          onClick={() => openProvider(r.providerName)}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            fontWeight: 1000,
                            color: "var(--heading)",
                            textDecoration: "underline",
                          }}
                          title="View provider details & all routes"
                        >
                          {r.providerName || "—"}
                        </button>
                      </td>
                      <td style={td}>{r.from} → {r.to}</td>
                      <td style={td}>{r.type}</td>
                      <td style={td}>{r.type === "Flight" ? "Check website" : formatPKR(r.fare)}</td>
                      <td style={td}>{r.availability}</td>
                      <td style={td}>{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                        No transport routes in DB yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="p" style={{ fontSize: 12, marginTop: 10 }}>
            Note: Transport booking/payment inside the app will be added later.
          </p>
        </div>
      </div>

      <TransportProviderModal
        open={providerOpen}
        onClose={() => setProviderOpen(false)}
        providerName={providerName}
        items={items}
      />
    </div>
  );
}

const th = {
  padding: "12px 10px",
  borderBottom: "1px solid rgba(15,23,42,0.10)",
  color: "var(--heading)",
  fontWeight: 1000,
  fontSize: 13,
};

const td = {
  padding: "12px 10px",
  borderBottom: "1px solid rgba(15,23,42,0.08)",
  color: "rgba(100,116,139,0.95)",
  fontWeight: 700,
  fontSize: 13,
};

const tdStrong = { ...td, color: "var(--heading)", fontWeight: 1000 };