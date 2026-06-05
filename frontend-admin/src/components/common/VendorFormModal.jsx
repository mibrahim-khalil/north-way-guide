import { useEffect, useMemo, useState } from "react";
import "./VendorFormModal.css";

const emptyVendor = {
  id: "",
  shopName: "",
  ownerName: "",
  category: "",
  city: "",
  phone: "",
  address: "",
  mapsUrl: "",
  status: "Approved",
  description: "",
};

export default function VendorFormModal({ open, onClose, initialVendor, onSave }) {
  const isEdit = Boolean(initialVendor?.id);
  const [vendor, setVendor] = useState(emptyVendor);

  useEffect(() => {
    if (!open) return;
    setVendor(initialVendor ? { ...emptyVendor, ...initialVendor } : emptyVendor);
  }, [open, initialVendor]);

  const title = useMemo(() => (isEdit ? "Edit Vendor" : "Add Vendor"), [isEdit]);

  if (!open) return null;

  const onChange = (k) => (e) => setVendor((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!vendor.id || !vendor.shopName || !vendor.category || !vendor.city) {
      return alert("Vendor ID, Shop Name, Category, and City are required.");
    }
    onSave?.(vendor);
    onClose?.();
  };

  return (
    <>
      <div className="vmOverlay" onClick={onClose} />
      <div className="vmModal" role="dialog" aria-modal="true">
        <div className="vmTop">
          <div>
            <div className="vmTitle">{title}</div>
            <div className="vmSub">Mock Data Mode (backend later)</div>
          </div>
          <button className="vmClose" onClick={onClose}>✕</button>
        </div>

        <form className="vmForm" onSubmit={submit}>
          <div className="vmGrid">
            <div>
              <label>Vendor ID *</label>
              <input className="vmInput" value={vendor.id} onChange={onChange("id")} disabled={isEdit} />
              <div className="vmHint">Unique id e.g. hunza-crafts</div>
            </div>

            <div>
              <label>Status</label>
              <select className="vmInput" value={vendor.status} onChange={onChange("status")}>
                <option>Approved</option>
                <option>Pending</option>
                <option>Hidden</option>
              </select>
            </div>

            <div>
              <label>Shop Name *</label>
              <input className="vmInput" value={vendor.shopName} onChange={onChange("shopName")} />
            </div>

            <div>
              <label>Owner Name</label>
              <input className="vmInput" value={vendor.ownerName} onChange={onChange("ownerName")} />
            </div>

            <div>
              <label>Category *</label>
              <input className="vmInput" value={vendor.category} onChange={onChange("category")} placeholder="Herbal / Food / Handicraft" />
            </div>

            <div>
              <label>City *</label>
              <input className="vmInput" value={vendor.city} onChange={onChange("city")} />
            </div>

            <div>
              <label>Phone</label>
              <input className="vmInput" value={vendor.phone} onChange={onChange("phone")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Address</label>
              <input className="vmInput" value={vendor.address} onChange={onChange("address")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Google Maps URL</label>
              <input className="vmInput" value={vendor.mapsUrl} onChange={onChange("mapsUrl")} placeholder="https://www.google.com/maps/..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea className="vmInput" rows="3" value={vendor.description} onChange={onChange("description")} />
            </div>
          </div>

          <div className="vmActions">
            <button type="button" className="aBtn" onClick={onClose}>Cancel</button>
            <button type="submit" className="aBtn primary">{isEdit ? "Save Changes" : "Create Vendor"}</button>
          </div>
        </form>
      </div>
    </>
  );
}