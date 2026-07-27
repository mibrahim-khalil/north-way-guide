import { useEffect, useMemo, useState } from "react";
import "./SpotFormModal.css";
import { api } from "../../utils/api";

const emptySpot = {
  id: "",
  name: "",
  district: "",
  region: "UNKNOWN",
  tagsText: "",
  imagesText: "", // NEW: comma/newline separated URLs
  description: "",
  mapsUrl: "",
  status: "Published",
};

const REGION_OPTIONS = [
  { value: "UNKNOWN", label: "Unknown" },

  { value: "GILGIT", label: "GB: Gilgit" },
  { value: "HUNZA", label: "GB: Hunza" },
  { value: "NAGAR", label: "GB: Nagar" },
  { value: "GHIZER", label: "GB: Ghizer" },

  { value: "SKARDU", label: "GB: Skardu" },
  { value: "SHIGAR", label: "GB: Shigar" },
  { value: "GANCHE", label: "GB: Ganche" },
  { value: "KHARMANG", label: "GB: Kharmang" },

  { value: "DIAMER", label: "GB: Diamer" },
  { value: "ASTORE", label: "GB: Astore" },

  { value: "KPK", label: "KPK (Khyber Pakhtunkhwa)" },
];

function tagsToText(tags) {
  if (!Array.isArray(tags)) return "";
  return tags.filter(Boolean).join(", ");
}

function textToTags(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  return raw
    .split(/,|\/|\|/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function parseImagesText(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  // allow commas OR new lines
  return raw
    .split(/,|\n/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

// important for admin preview when backend returns "/uploads/..."
function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base = api?.defaults?.baseURL || ""; // e.g. http://localhost:5000/api
  const origin = base.replace(/\/api\/?$/, ""); // => http://localhost:5000

  if (url.startsWith("/uploads/")) return `${origin}${url}`;
  if (url.startsWith("uploads/")) return `${origin}/${url}`;
  return url;
}

export default function SpotFormModal({ open, onClose, initialSpot, onSave }) {
  const isEdit = Boolean(initialSpot?.id);
  const [spot, setSpot] = useState(emptySpot);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!open) return;

    const merged = initialSpot ? { ...emptySpot, ...initialSpot } : emptySpot;

    const initialImages =
      Array.isArray(merged.images) && merged.images.length
        ? merged.images
        : merged.imageUrl
        ? [merged.imageUrl]
        : [];

    setSpot({
      id: merged.id || "",
      name: merged.name || "",
      district: merged.district || "",
      region: merged.region || "UNKNOWN",
      status: merged.status || "Published",
      mapsUrl: merged.mapsUrl || "",
      description: merged.description || "",
      tagsText:
        merged.tagsText ||
        (Array.isArray(merged.tags) ? tagsToText(merged.tags) : "") ||
        merged.tag ||
        "",
      imagesText: initialImages.join(", "),
    });

    setUploading(false);
    setUploadError("");
  }, [open, initialSpot]);

  const title = useMemo(() => (isEdit ? "Edit Tourist Spot" : "Add Tourist Spot"), [isEdit]);

  const images = useMemo(() => parseImagesText(spot.imagesText), [spot.imagesText]);

  if (!open) return null;

  const onChange = (k) => (e) => setSpot((p) => ({ ...p, [k]: e.target.value }));

  const appendImages = (urls = []) => {
    const clean = urls.map((u) => String(u || "").trim()).filter(Boolean);
    if (!clean.length) return;

    const existing = new Set(parseImagesText(spot.imagesText));
    const merged = [...existing, ...clean].filter(Boolean);

    setSpot((p) => ({ ...p, imagesText: merged.join(", ") }));
  };

  const removeImage = (url) => {
    const next = parseImagesText(spot.imagesText).filter((u) => u !== url);
    setSpot((p) => ({ ...p, imagesText: next.join(", ") }));
  };

  // Upload multiple images
  const uploadImages = async (files = []) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    setUploading(true);
    setUploadError("");

    try {
      const uploadedUrls = [];

      // sequential upload (stable)
      for (const file of arr) {
        const fd = new FormData();
        fd.append("file", file);

        const res = await api.post("/uploads/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const url = res.data?.url;
        if (!url) throw new Error("Upload did not return URL");
        uploadedUrls.push(url);
      }

      appendImages(uploadedUrls);
    } catch (e) {
      setUploadError(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!spot.name || !spot.district) {
      return alert("Name and District are required.");
    }

    const tags = textToTags(spot.tagsText);
    const imgs = parseImagesText(spot.imagesText);

    const payloadForManageSpots = {
      id: spot.id,
      name: spot.name,
      district: spot.district,
      region: spot.region || "UNKNOWN",
      status: spot.status,
      mapsUrl: spot.mapsUrl || "",
      description: spot.description || "",
      tags,
      tag: tags[0] || "",
      images: imgs, //  THIS is the multi-image array saved to Mongo
    };

    await onSave?.(payloadForManageSpots);
  };

  return (
    <>
      <div className="smOverlay" onClick={onClose} />
      <div className="smModal" role="dialog" aria-modal="true">
        <div className="smTop">
          <div>
            <div className="smTitle">{title}</div>
            <div className="smSub">Connected to MongoDB (Admin)</div>
          </div>
          <button className="smClose" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form className="smForm" onSubmit={submit}>
          <div className="smGrid">
            {isEdit && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Spot ID (MongoDB)</label>
                <input className="smInput" value={spot.id} disabled />
              </div>
            )}

            <div>
              <label>Status</label>
              <select className="smInput" value={spot.status} onChange={onChange("status")}>
                <option>Published</option>
                <option>Draft</option>
                <option>Hidden</option>
              </select>
            </div>

            <div>
              <label>Region *</label>
              <select className="smInput" value={spot.region} onChange={onChange("region")}>
                {REGION_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="smHint">Set KPK for Besham, GB regions for Hunza/Skardu, etc.</div>
            </div>

            <div>
              <label>Name *</label>
              <input className="smInput" value={spot.name} onChange={onChange("name")} />
            </div>

            <div>
              <label>District *</label>
              <input className="smInput" value={spot.district} onChange={onChange("district")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Tags (comma separated)</label>
              <input
                className="smInput"
                value={spot.tagsText}
                onChange={onChange("tagsText")}
                placeholder="Lake, Trekking, Adventure"
              />
              <div className="smHint">Card shows first tag only, details page shows all tags.</div>
            </div>

            {/* MULTI-UPLOAD */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Upload Images (multiple) (optional)</label>
              <input
                className="smInput"
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => uploadImages(e.target.files)}
              />
              <div className="smHint">
                {uploading ? "Uploading..." : "Select one or many images. URLs will be added below automatically."}
              </div>
              {uploadError ? (
                <div className="smHint" style={{ color: "crimson", fontWeight: 900 }}>
                  {uploadError}
                </div>
              ) : null}
            </div>

            {/* MULTI URL FIELD */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Images URLs (comma or new line separated)</label>
              <textarea
                className="smInput"
                rows="3"
                value={spot.imagesText}
                onChange={onChange("imagesText")}
                placeholder={`https://...1.jpg, https://...2.jpg\nor one URL per line`}
              />
              <div className="smHint">First image becomes the main cover image.</div>
            </div>

            {/* PREVIEW GRID */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Preview ({images.length})</label>

              {images.length ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {images.slice(0, 12).map((u) => (
                    <div
                      key={u}
                      style={{
                        width: 140,
                        borderRadius: 12,
                        border: "1px solid rgba(15,23,42,0.08)",
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.6)",
                      }}
                    >
                      <img
                        src={resolveMediaUrl(u)}
                        alt="preview"
                        style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <div style={{ padding: 8, display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                          {u.length > 18 ? u.slice(0, 18) + "..." : u}
                        </div>
                        <button
                          type="button"
                          className="aBtn danger"
                          style={{ padding: "6px 10px" }}
                          onClick={() => removeImage(u)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="smHint">No images added yet.</div>
              )}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Google Maps URL</label>
              <input
                className="smInput"
                value={spot.mapsUrl}
                onChange={onChange("mapsUrl")}
                placeholder="https://www.google.com/maps/..."
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea className="smInput" rows="4" value={spot.description} onChange={onChange("description")} />
            </div>
          </div>

          <div className="smActions">
            <button type="button" className="aBtn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="aBtn primary" disabled={uploading}>
              {isEdit ? "Save Changes" : "Create Spot"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}