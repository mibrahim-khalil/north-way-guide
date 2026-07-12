import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";

export default function MyVendorEditModal({ open, onClose, vendorApp, onSaved }) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    shopName: "",
    city: "",
    phone: "",
    address: "",
    googleMapUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const p = vendorApp?.payload || {};
    setForm({
      shopName: p.shopName || "",
      city: p.city || "",
      phone: p.phone || "",
      address: p.address || "",
      googleMapUrl: p.googleMapUrl || "",
    });
  }, [open, vendorApp]);

  if (!open) return null;

  const save = async (e) => {
    e.preventDefault();
    if (!form.shopName || !form.city) {
      toast("Shop name and city are required", 2500);
      return;
    }

    setSaving(true);
    try {
      await api.put("/applications/vendor/me", { payload: form });
      toast("Shop updated", 2000);
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to update shop", 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: "min(720px, 100%)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        }}
      >
        <div className="cardBody">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Edit Vendor / Shop</h3>
            <button className="btn" type="button" onClick={onClose} disabled={saving}>
              Close
            </button>
          </div>

          <form onSubmit={save} style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <div className="grid cols-2">
              <div>
                <label>Shop Name *</label>
                <input
                  className="input"
                  value={form.shopName}
                  onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))}
                />
              </div>
              <div>
                <label>City / District *</label>
                <input
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid cols-2">
              <div>
                <label>Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="03xx-xxxxxxx"
                />
              </div>
              <div>
                <label>Address</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label>Google Maps URL</label>
              <input
                className="input"
                value={form.googleMapUrl}
                onChange={(e) => setForm((p) => ({ ...p, googleMapUrl: e.target.value }))}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}