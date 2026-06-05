import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { uploadImage } from "../utils/uploadImage";

const MAX_PRODUCTS = 25;

function Pill({ status }) {
  const s = String(status || "").toUpperCase();
  const style =
    s === "APPROVED"
      ? { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" }
      : s === "REJECTED"
        ? { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" }
        : { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };

  return (
    <span style={{ ...style, padding: "3px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>
      {s}
    </span>
  );
}

const emptyDraft = {
  name: "",
  category: "",
  price: "",
  stock: 0,
  locationName: "",
  googleMapUrl: "",
  imagesText: "",
  description: "",
  isActive: true,
};

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;

function splitCsv(text) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isLikelyImageUrl(u) {
  if (!u) return false;

  // Allow your app/static patterns
  if (u.startsWith("/uploads/") || u.includes("/uploads/")) return true;
  if (u.startsWith("/images/") || u.includes("/images/")) return true;

  // Typical direct image URLs
  if (IMAGE_EXT_RE.test(u)) return true;
  if (u.includes("images.unsplash.com")) return true;
  if (u.includes("res.cloudinary.com")) return true;

  return false;
}

function parseAndValidateImages(text) {
  const raw = splitCsv(text);
  const seen = new Set();
  const valid = [];
  const invalid = [];

  for (const u of raw) {
    const url = u.trim();
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    if (isLikelyImageUrl(url)) valid.push(url);
    else invalid.push(url);
  }

  return { valid, invalid };
}

export default function MyProducts() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [editSaving, setEditSaving] = useState(false);

  const load = async () => {
    setLoadingItems(true);
    try {
      const res = await api.get("/my/products");
      setItems(res.data.items || []);
    } catch (e) {
      setItems([]);
      toast(e?.response?.data?.message || "Failed to load my products", 2500);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav("/login", { state: { from: "/my-products" } });
      return;
    }
    load();
  }, [user, loading]);

  const count = items.length;
  const canAdd = useMemo(() => count < MAX_PRODUCTS, [count]);

  const addValidThumbs = useMemo(() => parseAndValidateImages(draft.imagesText).valid, [draft.imagesText]);
  const editValidThumbs = useMemo(() => parseAndValidateImages(editDraft.imagesText).valid, [editDraft.imagesText]);

  const create = async (e) => {
    e.preventDefault();
    if (!canAdd) return toast(`You can add maximum ${MAX_PRODUCTS} products.`, 2500);

    if (!draft.name || !draft.category || draft.price === "") {
      return toast("Name, category and price are required", 2500);
    }

    const { valid, invalid } = parseAndValidateImages(draft.imagesText);
    if (invalid.length) {
      toast(`Ignored ${invalid.length} invalid image URL(s). Use direct .jpg/.png or /uploads/...`, 3500);
    }

    const payload = {
      name: draft.name.trim(),
      category: draft.category.trim(),
      price: Number(draft.price),
      stock: Number(draft.stock || 0),
      locationName: draft.locationName || "",
      googleMapUrl: draft.googleMapUrl || "",
      images: valid,
      description: draft.description || "",
      isActive: !!draft.isActive,
    };

    setSaving(true);
    try {
      await api.post("/my/products", payload);
      toast("Product submitted for approval (PENDING).", 2500);
      setDraft(emptyDraft);
      await load();
    } catch (e2) {
      toast(e2?.response?.data?.message || "Failed to add product", 3000);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p) => {
    setEditing(p);
    setEditDraft({
      name: p.name || "",
      category: p.category || "",
      price: String(p.price ?? ""),
      stock: Number(p.stock ?? 0),
      locationName: p.locationName || "",
      googleMapUrl: p.googleMapUrl || "",
      imagesText: Array.isArray(p.images) ? p.images.join(", ") : "",
      description: p.description || "",
      isActive: p.isActive !== false,
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;

    if (!editDraft.name || !editDraft.category || editDraft.price === "") {
      return toast("Name, category and price are required", 2500);
    }

    const { valid, invalid } = parseAndValidateImages(editDraft.imagesText);
    if (invalid.length) {
      toast(`Ignored ${invalid.length} invalid image URL(s). Use direct .jpg/.png or /uploads/...`, 3500);
    }

    const payload = {
      name: editDraft.name.trim(),
      category: editDraft.category.trim(),
      price: Number(editDraft.price),
      stock: Number(editDraft.stock || 0),
      locationName: editDraft.locationName || "",
      googleMapUrl: editDraft.googleMapUrl || "",
      images: valid,
      description: editDraft.description || "",
      isActive: !!editDraft.isActive,
    };

    setEditSaving(true);
    try {
      await api.put(`/my/products/${editing._id}`, payload);
      toast("Saved. If it was approved, it is now PENDING again.", 3000);
      setEditing(null);
      await load();
    } catch (e2) {
      toast(e2?.response?.data?.message || "Failed to save changes", 3000);
    } finally {
      setEditSaving(false);
    }
  };

  const remove = async (p) => {
    const ok = confirm(`Delete "${p?.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/my/products/${p._id}`);
      toast("Deleted", 2000);
      await load();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to delete", 2500);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
      <div className="cardBody">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: "0 0 6px" }}>My Products</h2>
            <p className="p" style={{ margin: 0 }}>
              Products: <b>{count}</b> / {MAX_PRODUCTS}
              {loadingItems ? " • Loading..." : ""}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" to="/profile">Back to Profile</Link>
            <button className="btn" type="button" onClick={load} disabled={loadingItems}>
              Refresh
            </button>
          </div>
        </div>

        <hr className="sep" />

        <div className="card" style={{ boxShadow: "none" }}>
          <div className="cardBody">
            <h3 style={{ margin: "0 0 10px" }}>Add a Product</h3>

            {!canAdd ? (
              <div className="p" style={{ color: "#b45309", fontWeight: 900 }}>
                Limit reached: You can add maximum {MAX_PRODUCTS} products.
              </div>
            ) : null}

            <form onSubmit={create} style={{ display: "grid", gap: 12 }}>
              <div className="grid cols-2">
                <div>
                  <label>Name *</label>
                  <input className="input" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
                </div>

                <div>
                  <label>Category *</label>
                  <input className="input" value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))} />
                </div>
              </div>

              <div className="grid cols-2">
                <div>
                  <label>Price (PKR) *</label>
                  <input className="input" type="number" min="0" value={draft.price} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))} />
                </div>

                <div>
                  <label>Stock</label>
                  <input className="input" type="number" min="0" value={draft.stock} onChange={(e) => setDraft((p) => ({ ...p, stock: e.target.value }))} />
                </div>
              </div>

              <div className="grid cols-2">
                <div>
                  <label>Location Name</label>
                  <input className="input" value={draft.locationName} onChange={(e) => setDraft((p) => ({ ...p, locationName: e.target.value }))} placeholder="Gilgit, Skardu..." />
                </div>
                <div>
                  <label>Google Map URL</label>
                  <input className="input" value={draft.googleMapUrl} onChange={(e) => setDraft((p) => ({ ...p, googleMapUrl: e.target.value }))} placeholder="https://maps.google.com/..." />
                </div>
              </div>

              <div>
                <label>Images (comma separated URLs)</label>
                <input className="input" value={draft.imagesText} onChange={(e) => setDraft((p) => ({ ...p, imagesText: e.target.value }))} placeholder="https://...jpg, https://...png, /uploads/..." />
                <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                  Only image URLs are accepted. Non-image links are ignored automatically.
                </div>
              </div>

              <div>
                <label>Or Upload Image</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadImage(file);
                      setDraft((p) => ({ ...p, imagesText: p.imagesText ? `${url}, ${p.imagesText}` : url }));
                      toast("Image uploaded", 1500);
                    } catch (err) {
                      toast(err?.response?.data?.message || "Upload failed", 2500);
                    }
                  }}
                />
              </div>

              {addValidThumbs.length ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {addValidThumbs.map((u, idx) => (
                    <img
                      key={idx}
                      src={u}
                      alt={`p-${idx}`}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "1px solid rgba(15,23,42,0.08)",
                      }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ))}
                </div>
              ) : null}

              <div>
                <label>Description</label>
                <textarea className="input" rows="4" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
              </div>

              <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
                <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((p) => ({ ...p, isActive: e.target.checked }))} />
                Visible on website (when approved)
              </label>

              <button className="btn primary" type="submit" disabled={saving || !canAdd}>
                {saving ? "Saving..." : "Add Product"}
              </button>

              <p className="p" style={{ fontSize: 12 }}>
                New products start as <b>PENDING</b>. Admin must approve them to appear on public Local Products.
              </p>
            </form>
          </div>
        </div>

        <hr className="sep" />

        {/* List */}
        <h3 style={{ margin: "0 0 10px" }}>My Product List</h3>

        {items.length === 0 && !loadingItems ? (
          <div className="p">No products yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((p) => (
              <div key={p._id} className="card" style={{ boxShadow: "none" }}>
                <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>
                      {p.name}{" "}
                      <span style={{ marginLeft: 8 }}>
                        <Pill status={p.status} />
                      </span>
                    </div>

                    <div className="p" style={{ fontSize: 13, margin: "6px 0 0" }}>
                      Category: <b>{p.category || "—"}</b> • Price: <b>PKR {Number(p.price || 0).toLocaleString("en-PK")}</b> • Stock:{" "}
                      <b>{Number(p.stock || 0)}</b> • Visible: <b>{p.isActive ? "Yes" : "No"}</b>
                    </div>

                    {p.adminNote ? (
                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        <b>Admin Note:</b> {p.adminNote}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button className="btn" type="button" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="btn" type="button" onClick={() => remove(p)} style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Edit panel */}
                {editing?._id === p._id ? (
                  <div className="cardBody" style={{ borderTop: "1px solid rgba(15,23,42,0.08)", marginTop: 10 }}>
                    <form onSubmit={saveEdit} style={{ display: "grid", gap: 12 }}>
                      <div className="grid cols-2">
                        <div>
                          <label>Name *</label>
                          <input className="input" value={editDraft.name} onChange={(e) => setEditDraft((x) => ({ ...x, name: e.target.value }))} />
                        </div>
                        <div>
                          <label>Category *</label>
                          <input className="input" value={editDraft.category} onChange={(e) => setEditDraft((x) => ({ ...x, category: e.target.value }))} />
                        </div>
                      </div>

                      <div className="grid cols-2">
                        <div>
                          <label>Price (PKR) *</label>
                          <input className="input" type="number" min="0" value={editDraft.price} onChange={(e) => setEditDraft((x) => ({ ...x, price: e.target.value }))} />
                        </div>
                        <div>
                          <label>Stock</label>
                          <input className="input" type="number" min="0" value={editDraft.stock} onChange={(e) => setEditDraft((x) => ({ ...x, stock: e.target.value }))} />
                        </div>
                      </div>

                      <div className="grid cols-2">
                        <div>
                          <label>Location Name</label>
                          <input className="input" value={editDraft.locationName} onChange={(e) => setEditDraft((x) => ({ ...x, locationName: e.target.value }))} />
                        </div>
                        <div>
                          <label>Google Map URL</label>
                          <input className="input" value={editDraft.googleMapUrl} onChange={(e) => setEditDraft((x) => ({ ...x, googleMapUrl: e.target.value }))} />
                        </div>
                      </div>

                      <div>
                        <label>Images (comma separated URLs)</label>
                        <input className="input" value={editDraft.imagesText} onChange={(e) => setEditDraft((x) => ({ ...x, imagesText: e.target.value }))} />
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          Non-image links are ignored automatically when saving.
                        </div>
                      </div>

                      <div>
                        <label>Or Upload Image</label>
                        <input
                          className="input"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadImage(file);
                              setEditDraft((x) => ({ ...x, imagesText: x.imagesText ? `${url}, ${x.imagesText}` : url }));
                              toast("Image uploaded", 1500);
                            } catch (err) {
                              toast(err?.response?.data?.message || "Upload failed", 2500);
                            }
                          }}
                        />
                      </div>

                      {editValidThumbs.length ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {editValidThumbs.map((u, idx) => (
                            <img
                              key={idx}
                              src={u}
                              alt={`edit-${idx}`}
                              style={{
                                width: 80,
                                height: 80,
                                objectFit: "cover",
                                borderRadius: 10,
                                border: "1px solid rgba(15,23,42,0.08)",
                              }}
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          ))}
                        </div>
                      ) : null}

                      <div>
                        <label>Description</label>
                        <textarea className="input" rows="4" value={editDraft.description} onChange={(e) => setEditDraft((x) => ({ ...x, description: e.target.value }))} />
                      </div>

                      <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
                        <input type="checkbox" checked={editDraft.isActive} onChange={(e) => setEditDraft((x) => ({ ...x, isActive: e.target.checked }))} />
                        Visible on website (when approved)
                      </label>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className="btn primary" type="submit" disabled={editSaving}>
                          {editSaving ? "Saving..." : "Save Changes"}
                        </button>
                        <button className="btn" type="button" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>

                      <p className="p" style={{ fontSize: 12 }}>
                        If this product was <b>APPROVED</b>, editing will set it back to <b>PENDING</b> for re-approval.
                      </p>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}