import { useEffect, useMemo, useState } from "react";
import "./EventFormModal.css";

const emptyEvent = {
  id: "",
  title: "",
  location: "",
  mapUrl: "",
  startDate: "",
  endDate: "",
  imageUrl: "",
  description: "",
  isPublished: true,
};

function toInputDateTimeValue(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(
    x.getHours()
  )}:${pad(x.getMinutes())}`;
}

export default function EventFormModal({ open, onClose, initialEvent, onSave }) {
  const isEdit = Boolean(initialEvent?._id || initialEvent?.id);
  const [ev, setEv] = useState(emptyEvent);

  useEffect(() => {
    if (!open) return;

    if (initialEvent) {
      setEv({
        ...emptyEvent,
        id: initialEvent._id || initialEvent.id || "",
        title: initialEvent.title || "",
        location: initialEvent.location || "",
        mapUrl: initialEvent.mapUrl || "",
        startDate: toInputDateTimeValue(initialEvent.startDate),
        endDate: initialEvent.endDate ? toInputDateTimeValue(initialEvent.endDate) : "",
        imageUrl: initialEvent.image || "",
        description: initialEvent.description || "",
        isPublished:
          initialEvent.isPublished !== undefined ? Boolean(initialEvent.isPublished) : true,
      });
    } else {
      setEv(emptyEvent);
    }
  }, [open, initialEvent]);

  const title = useMemo(() => (isEdit ? "Edit Event" : "Add Event"), [isEdit]);

  if (!open) return null;

  const onChange = (k) => (e) => setEv((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();

    if (!ev.title.trim()) return alert("Title is required.");
    if (!ev.startDate) return alert("Start date is required.");

    const payload = {
      title: ev.title.trim(),
      location: ev.location.trim(),
      mapUrl: ev.mapUrl.trim(),
      description: ev.description.trim(),
      image: ev.imageUrl.trim(),
      isPublished: Boolean(ev.isPublished),
      startDate: new Date(ev.startDate).toISOString(),
      endDate: ev.endDate ? new Date(ev.endDate).toISOString() : null,
    };

    await onSave?.(payload);
  };

  return (
    <>
      <div className="emOverlay" onClick={onClose} />
      <div className="emModal" role="dialog" aria-modal="true">
        <div className="emTop">
          <div>
            <div className="emTitle">{title}</div>
            <div className="emSub">North Way Guide • Admin Panel</div>
          </div>
          <button className="emClose" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form className="emForm" onSubmit={submit}>
          <div className="emGrid">
            {isEdit && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Event ID (MongoDB)</label>
                <input className="emInput" value={ev.id} disabled />
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Title *</label>
              <input
                className="emInput"
                value={ev.title}
                onChange={onChange("title")}
                placeholder="e.g. Sarfaranga Cold Desert Rally 2027"
              />
            </div>

            <div>
              <label>Location</label>
              <input
                className="emInput"
                value={ev.location}
                onChange={onChange("location")}
                placeholder="e.g. Shigar / Skardu"
              />
            </div>

            <div>
              <label>Map URL (clickable)</label>
              <input
                className="emInput"
                value={ev.mapUrl}
                onChange={onChange("mapUrl")}
                placeholder="https://maps.google.com/..."
              />
              <div className="emHint">Public users will open this link on the details page.</div>
            </div>

            <div>
              <label>Start Date *</label>
              <input
                className="emInput"
                type="datetime-local"
                value={ev.startDate}
                onChange={onChange("startDate")}
              />
            </div>

            <div>
              <label>End Date (optional)</label>
              <input
                className="emInput"
                type="datetime-local"
                value={ev.endDate}
                onChange={onChange("endDate")}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Image URL (optional)</label>
              <input
                className="emInput"
                value={ev.imageUrl}
                onChange={onChange("imageUrl")}
                placeholder="https://..."
              />
            </div>

            {ev.imageUrl ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="emPreview">
                  <img src={ev.imageUrl} alt="preview" />
                </div>
              </div>
            ) : null}

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea
                className="emInput"
                rows="4"
                value={ev.description}
                onChange={onChange("description")}
                placeholder="Write event details..."
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center" }}>
              <input
                id="published"
                type="checkbox"
                checked={Boolean(ev.isPublished)}
                onChange={(e) => setEv((p) => ({ ...p, isPublished: e.target.checked }))}
              />
              <label htmlFor="published" style={{ margin: 0, fontWeight: 900 }}>
                Published
              </label>
            </div>
          </div>

          <div className="emActions">
            <button type="button" className="aBtn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="aBtn primary">
              {isEdit ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}