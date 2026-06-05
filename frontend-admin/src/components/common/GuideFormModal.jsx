import { useEffect, useMemo, useState } from "react";
import "./GuideFormModal.css";

const emptyGuide = {
  id: "",
  name: "",
  baseCity: "",
  phone: "",
  bio: "",
  rating: 0,
  pricePerDay: 0,
  languagesText: "",   
  specialtiesText: "", 
  imagesText: "",      
  isActive: false,
};

const toCSV = (arr) => (Array.isArray(arr) ? arr.filter(Boolean).join(", ") : "");
const fromCSV = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function GuideFormModal({ open, onClose, initialGuide, onSave }) {
  const isEdit = Boolean(initialGuide?.id);
  const [guide, setGuide] = useState(emptyGuide);

  useEffect(() => {
    if (!open) return;

    if (initialGuide) {
      setGuide({
        ...emptyGuide,
        ...initialGuide,
        languagesText: toCSV(initialGuide.languages),
        specialtiesText: toCSV(initialGuide.specialties),
        imagesText: toCSV(initialGuide.images),
      });
    } else {
      setGuide(emptyGuide);
    }
  }, [open, initialGuide]);

  const title = useMemo(() => (isEdit ? "Edit Guide" : "Add Guide"), [isEdit]);

  if (!open) return null;

  const onChange = (k) => (e) => setGuide((p) => ({ ...p, [k]: e.target.value }));
  const onCheck = (k) => (e) => setGuide((p) => ({ ...p, [k]: e.target.checked }));

  const submit = (e) => {
    e.preventDefault();

    if (!guide.name || !guide.baseCity) {
      return alert("Name and Base City are required.");
    }

    onSave?.({
      id: guide.id,
      name: guide.name,
      baseCity: guide.baseCity,
      phone: guide.phone,
      bio: guide.bio,
      rating: Number(guide.rating || 0),
      pricePerDay: Number(guide.pricePerDay || 0),
      languages: fromCSV(guide.languagesText),
      specialties: fromCSV(guide.specialtiesText),
      images: fromCSV(guide.imagesText),
      isActive: Boolean(guide.isActive),
    });
  };

  return (
    <>
      <div className="gmOverlay" onClick={onClose} />
      <div className="gmModal" role="dialog" aria-modal="true">
        <div className="gmTop">
          <div>
            <div className="gmTitle">{title}</div>
            <div className="gmSub">DB Mode (Guide fields)</div>
          </div>
          <button className="gmClose" onClick={onClose}>✕</button>
        </div>

        <form className="gmForm" onSubmit={submit}>
          <div className="gmGrid">
            {isEdit && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Mongo ID</label>
                <input className="gmInput" value={guide.id} disabled />
              </div>
            )}

            <div>
              <label>Name *</label>
              <input className="gmInput" value={guide.name} onChange={onChange("name")} />
            </div>

            <div>
              <label>Base City *</label>
              <input className="gmInput" value={guide.baseCity} onChange={onChange("baseCity")} placeholder="Skardu" />
            </div>

            <div>
              <label>Phone</label>
              <input className="gmInput" value={guide.phone} onChange={onChange("phone")} />
            </div>

            <div>
              <label>Price Per Day</label>
              <input className="gmInput" type="number" value={guide.pricePerDay} onChange={onChange("pricePerDay")} />
            </div>

            <div>
              <label>Rating</label>
              <input className="gmInput" type="number" step="0.1" min="0" max="5" value={guide.rating} onChange={onChange("rating")} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
              <input type="checkbox" checked={guide.isActive} onChange={onCheck("isActive")} />
              <label style={{ margin: 0 }}>Active (Approved)</label>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Languages (comma separated)</label>
              <input className="gmInput" value={guide.languagesText} onChange={onChange("languagesText")} placeholder="Urdu, English" />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Specialties (comma separated)</label>
              <input className="gmInput" value={guide.specialtiesText} onChange={onChange("specialtiesText")} placeholder="Trekking, Culture" />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Images (comma separated URLs)</label>
              <input className="gmInput" value={guide.imagesText} onChange={onChange("imagesText")} placeholder="https://..., https://..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Bio</label>
              <textarea className="gmInput" rows="3" value={guide.bio} onChange={onChange("bio")} />
            </div>
          </div>

          <div className="gmActions">
            <button type="button" className="aBtn" onClick={onClose}>Cancel</button>
            <button type="submit" className="aBtn primary">{isEdit ? "Save Changes" : "Create Guide"}</button>
          </div>
        </form>
      </div>
    </>
  );
}