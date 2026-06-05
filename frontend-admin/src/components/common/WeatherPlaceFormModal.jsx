import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import "./WeatherPlaceFormModal.css";

const empty = {
  id: "",
  name: "",
  lat: "",
  lon: "",
  sortOrder: 0,
  isActive: true,
};

export default function WeatherPlaceFormModal({ open, onClose, initial, onSave }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;

    const m = initial ? { ...empty, ...initial } : empty;
    setForm({
      id: m.id || "",
      name: m.name || "",
      lat: m.lat ?? "",
      lon: m.lon ?? "",
      sortOrder: Number(m.sortOrder || 0),
      isActive: m.isActive !== false,
    });
  }, [open, initial]);

  const title = useMemo(() => (isEdit ? "Edit Weather Place" : "Add Weather Place"), [isEdit]);

  if (!open) return null;

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();

    const name = String(form.name || "").trim();
    if (!name) return alert("Name is required.");

    const lat = Number(form.lat);
    const lon = Number(form.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return alert("Lat/Lon must be numbers.");
    if (lat < -90 || lat > 90) return alert("Latitude must be between -90 and 90.");
    if (lon < -180 || lon > 180) return alert("Longitude must be between -180 and 180.");

    onSave?.({
      id: form.id || "",
      name,
      lat,
      lon,
      sortOrder: Number(form.sortOrder || 0),
      isActive: Boolean(form.isActive),
    });
  };

  return createPortal(
    <>
      <div className="wpOverlay" onClick={onClose} />
      <div className="wpModal" role="dialog" aria-modal="true">
        <div className="wpTop">
          <div>
            <div className="wpTitle">{title}</div>
            <div className="wpSub">Add GB city/district with coordinates (lat/lon).</div>
          </div>
          <button type="button" className="wpClose" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="wpForm" onSubmit={submit}>
          <div className="wpGrid">
            {isEdit ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <label>ID</label>
                <input className="wpInput" value={form.id} disabled />
              </div>
            ) : null}

            <div>
              <label>Status</label>
              <select
                className="wpInput"
                value={form.isActive ? "ACTIVE" : "HIDDEN"}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === "ACTIVE" }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="HIDDEN">Hidden</option>
              </select>
              <div className="wpHint">Hidden places won’t show on public Weather page.</div>
            </div>

            <div>
              <label>Sort Order</label>
              <input className="wpInput" type="number" value={form.sortOrder} onChange={onChange("sortOrder")} />
              <div className="wpHint">Lower comes first in dropdown.</div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Place Name *</label>
              <input className="wpInput" value={form.name} onChange={onChange("name")} placeholder="Hunza / Skardu / Gilgit" />
              <div className="wpHint">Use short names. Must be unique.</div>
            </div>

            <div>
              <label>Latitude *</label>
              <input className="wpInput" value={form.lat} onChange={onChange("lat")} placeholder="36.3167" />
            </div>

            <div>
              <label>Longitude *</label>
              <input className="wpInput" value={form.lon} onChange={onChange("lon")} placeholder="74.6500" />
            </div>
          </div>

          <div className="wpActions">
            <button type="button" className="aBtn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="aBtn primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}