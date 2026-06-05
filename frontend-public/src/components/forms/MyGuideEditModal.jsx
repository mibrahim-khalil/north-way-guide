import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";
import { uploadImage } from "../../utils/uploadImage";
import "./MyHotelEditModal.css";

const toCSV = (arr) => (Array.isArray(arr) ? arr.filter(Boolean).join(", ") : "");
const fromCSV = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function ymdUTC(d) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}

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

const empty = {
  name: "",
  baseCity: "",
  phone: "",
  pricePerDay: 0,
  languagesText: "",
  specialtiesText: "",
  imagesText: "",
  bio: "",
  unavailableRanges: [], // {fromYmd,toYmd,note}
};

export default function MyGuideEditModal({ open, onClose, guide, onSaved }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const todayMin = useMemo(() => ymdLocal(new Date()), []);

  useEffect(() => {
    if (!open) return;

    if (!guide) {
      setForm(empty);
      return;
    }

    const ranges = Array.isArray(guide.unavailableRanges)
      ? guide.unavailableRanges.map((r) => ({
          fromYmd: ymdUTC(r.from),
          toYmd: ymdUTC(r.to),
          note: r.note || "",
        }))
      : [];

    setForm({
      name: guide.name || "",
      baseCity: guide.baseCity || "",
      phone: guide.phone || "",
      pricePerDay: Number(guide.pricePerDay || 0),
      languagesText: toCSV(guide.languages),
      specialtiesText: toCSV(guide.specialties),
      imagesText: toCSV(guide.images),
      bio: guide.bio || "",
      unavailableRanges: ranges,
    });

    setUploading(false);
    setUploadErr("");
  }, [open, guide]);

  const images = useMemo(() => fromCSV(form.imagesText), [form.imagesText]);

  if (!open) return null;

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const doUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadErr("");

    try {
      const url = await uploadImage(file);
      if (!url) {
        setUploadErr("Upload failed: no URL returned");
        return;
      }
      setForm((p) => ({
        ...p,
        imagesText: p.imagesText ? `${p.imagesText}, ${url}` : url,
      }));
    } catch (err) {
      setUploadErr(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addRange = () => {
    const fromYmd = todayMin;
    const toYmd = addDaysYmd(todayMin, 1);
    setForm((p) => ({
      ...p,
      unavailableRanges: [...(p.unavailableRanges || []), { fromYmd, toYmd, note: "" }],
    }));
  };

  const updateRange = (idx, key, value) => {
    setForm((p) => {
      const next = [...(p.unavailableRanges || [])];
      next[idx] = { ...next[idx], [key]: value };
      return { ...p, unavailableRanges: next };
    });
  };

  const removeRange = (idx) => {
    setForm((p) => {
      const next = [...(p.unavailableRanges || [])];
      next.splice(idx, 1);
      return { ...p, unavailableRanges: next };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!guide?._id) return;

    setBusy(true);
    try {
      const ranges = (form.unavailableRanges || [])
        .map((r) => ({
          from: r.fromYmd ? new Date(`${r.fromYmd}T00:00:00.000Z`) : null,
          to: r.toYmd ? new Date(`${r.toYmd}T00:00:00.000Z`) : null,
          note: String(r.note || ""),
        }))
        .filter((r) => r.from && r.to && r.from.getTime() < r.to.getTime());

      await api.put(`/my/guides/${guide._id}`, {
        name: form.name,
        baseCity: form.baseCity,
        phone: form.phone,
        pricePerDay: Number(form.pricePerDay || 0),
        languages: fromCSV(form.languagesText),
        specialties: fromCSV(form.specialtiesText),
        images: fromCSV(form.imagesText),
        bio: form.bio,
        unavailableRanges: ranges,
      });

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
            <div className="mhTitle">Edit My Guide</div>
            <div className="mhSub">Upload image or paste URLs. (comma separated)</div>
          </div>
          <button className="mhClose" onClick={onClose} type="button">✕</button>
        </div>

        <form className="mhForm" onSubmit={save}>
          <div className="mhGrid">
            <div>
              <label>Name</label>
              <input className="mhInput" value={form.name} onChange={onChange("name")} />
            </div>

            <div>
              <label>Base City</label>
              <input className="mhInput" value={form.baseCity} onChange={onChange("baseCity")} />
            </div>

            <div>
              <label>Phone</label>
              <input className="mhInput" value={form.phone} onChange={onChange("phone")} />
            </div>

            <div>
              <label>Price Per Day</label>
              <input className="mhInput" type="number" min="0" value={form.pricePerDay} onChange={onChange("pricePerDay")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Languages (comma separated)</label>
              <input className="mhInput" value={form.languagesText} onChange={onChange("languagesText")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Specialties (comma separated)</label>
              <input className="mhInput" value={form.specialtiesText} onChange={onChange("specialtiesText")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Images (comma separated URLs)</label>
              <input className="mhInput" value={form.imagesText} onChange={onChange("imagesText")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Upload Image</label>

              <input
                id="guideImageUpload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={uploading}
                onChange={(e) => doUpload(e.target.files?.[0])}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <label htmlFor="guideImageUpload" className="aBtn">
                  {uploading ? "Uploading..." : "Choose Image"}
                </label>
                <span className="mhFileName">{images.length ? `${images.length} image(s)` : "No images"}</span>
              </div>

              {uploadErr ? (
                <div className="mhHint" style={{ color: "crimson", fontWeight: 900, marginTop: 8 }}>
                  {uploadErr}
                </div>
              ) : (
                <div className="mhHint" style={{ marginTop: 8 }}>
                  Tip: Upload adds URL into Images field automatically.
                </div>
              )}
            </div>

            {images.length ? (
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {images.slice(0, 8).map((u, idx) => (
                  <img
                    key={`${u}-${idx}`}
                    src={u}
                    alt={`guide-${idx}`}
                    style={{
                      width: 78,
                      height: 78,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid rgba(15,23,42,0.08)",
                    }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ))}
              </div>
            ) : null}

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Bio</label>
              <textarea className="mhInput" rows="3" value={form.bio} onChange={onChange("bio")} />
            </div>

            {/* ✅ Availability blocks */}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ margin: 0, fontWeight: 900 }}>Unavailable Date Ranges</label>
                <button type="button" className="aBtn" onClick={addRange}>
                  + Add Range
                </button>
              </div>

              <div className="mhHint" style={{ marginTop: 6 }}>
                These dates will be blocked for customers (guide will show “Not available”).
              </div>

              {(form.unavailableRanges || []).length === 0 ? (
                <div className="p" style={{ fontSize: 12, marginTop: 10 }}>No blocked ranges.</div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {form.unavailableRanges.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(15,23,42,0.08)",
                        background: "rgba(255,255,255,0.65)",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>From *</div>
                          <input
                            className="mhInput"
                            type="date"
                            min={todayMin}
                            value={r.fromYmd || ""}
                            onChange={(e) => updateRange(idx, "fromYmd", e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>To *</div>
                          <input
                            className="mhInput"
                            type="date"
                            min={r.fromYmd || todayMin}
                            value={r.toYmd || ""}
                            onChange={(e) => updateRange(idx, "toYmd", e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Note (optional)</div>
                        <input
                          className="mhInput"
                          value={r.note || ""}
                          onChange={(e) => updateRange(idx, "note", e.target.value)}
                          placeholder="e.g. Already assigned to another group"
                        />
                      </div>

                      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="aBtn"
                          style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                          onClick={() => removeRange(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mhActions">
            <button type="button" className="aBtn" onClick={onClose}>Cancel</button>
            <button type="submit" className="aBtn primary" disabled={busy || uploading}>
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}