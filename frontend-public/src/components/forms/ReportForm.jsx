import { useEffect, useId, useMemo, useState } from "react";
import { api } from "../../utils/api";
import { uploadImage } from "../../utils/uploadImage";
import "./ReportForm.css";

const complaintTopics = [
  { value: "PAYMENT", label: "Payment" },
  { value: "BOOKING", label: "Booking" },
  { value: "ORDER", label: "Order" },
  { value: "OTHER", label: "Other" },
];

const suggestionTopics = [
  { value: "SPOT_ROUTE", label: "Spot Route / Navigation" },
  { value: "FEATURE", label: "New Feature" },
  { value: "UI_UX", label: "UI/UX" },
  { value: "OTHER", label: "Other" },
];

export default function ReportForm({ onSubmitted, onClose }) {
  const uploadId = useId();

  const [kind, setKind] = useState("COMPLAINT");
  const topics = useMemo(
    () => (kind === "COMPLAINT" ? complaintTopics : suggestionTopics),
    [kind]
  );

  const [topic, setTopic] = useState(complaintTopics[0].value);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [referenceId, setReferenceId] = useState("");
  const [againstUserLabel, setAgainstUserLabel] = useState("");

  const [files, setFiles] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // object URLs

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeKind = (v) => {
    setKind(v);
    setTopic(v === "COMPLAINT" ? complaintTopics[0].value : suggestionTopics[0].value);
  };

  const onPickFiles = (e) => {
    setErr("");
    const selected = Array.from(e.target.files || []);
    const max = 3;

    const merged = [...files, ...selected].slice(0, max);

    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles(merged);
    setPreviews(merged.map((f) => URL.createObjectURL(f)));

    e.target.value = ""; // allow picking same file again
  };

  const removeFile = (idx) => {
    setErr("");
    const nextFiles = files.filter((_, i) => i !== idx);

    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles(nextFiles);
    setPreviews(nextFiles.map((f) => URL.createObjectURL(f)));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!topic) return setErr("Please select a topic.");
    if (!subject.trim()) return setErr("Subject is required.");
    if (!message.trim()) return setErr("Message is required.");

    try {
      setBusy(true);

      const attachments = [];
      for (const f of files) {
        const url = await uploadImage(f);
        attachments.push(url);
      }

      await api.post("/reports", {
        kind,
        topic,
        subject: subject.trim(),
        message: message.trim(),
        referenceId: referenceId.trim(),
        againstUserLabel: againstUserLabel.trim(),
        attachments,
      });

      setOk("Submitted successfully. Thank you!");
      setSubject("");
      setMessage("");
      setReferenceId("");
      setAgainstUserLabel("");

      previews.forEach((u) => URL.revokeObjectURL(u));
      setFiles([]);
      setPreviews([]);

      onSubmitted?.();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit. Please try again.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card rpCard">
      <div className="cardBody">
        <div className="rpHeadRow">
          <h3 className="rpTitle">Report</h3>

          {onClose ? (
            <button type="button" className="rpBtn" onClick={onClose} disabled={busy}>
              Close
            </button>
          ) : null}
        </div>

        {err ? <div className="rpAlertErr">{err}</div> : null}
        {ok ? <div className="rpAlertOk">{ok}</div> : null}

        <div className="rpGrid2" style={{ marginTop: 12 }}>
          <div className="rpField">
            <label>Type</label>
            <select className="rpControl" value={kind} onChange={(e) => onChangeKind(e.target.value)}>
              <option value="COMPLAINT">Complaint</option>
              <option value="SUGGESTION">Suggestion</option>
            </select>
          </div>

          <div className="rpField">
            <label>Topic</label>
            <select className="rpControl" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {kind === "COMPLAINT" ? (
          <div className="rpGrid2" style={{ marginTop: 12 }}>
            <div className="rpField">
              <label>Against user (optional)</label>
              <input
                className="rpControl"
                value={againstUserLabel}
                onChange={(e) => setAgainstUserLabel(e.target.value)}
                placeholder="Email / name / phone"
              />
            </div>

            <div className="rpField">
              <label>Reference ID (optional)</label>
              <input
                className="rpControl"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Order / Booking / Payment id"
              />
            </div>
          </div>
        ) : null}

        <div className="rpField" style={{ marginTop: 12 }}>
          <label>Subject</label>
          <input
            className="rpControl"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Short title"
          />
        </div>

        <div className="rpField" style={{ marginTop: 12 }}>
          <label>Message</label>
          <textarea
            className="rpControl rpTextarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write details..."
          />
        </div>

        <div className="rpField" style={{ marginTop: 12 }}>
          <label>Upload images (optional, max 3)</label>

          <div className="rpUploadRow">
            <label className="rpBtn rpUploadBtn" htmlFor={uploadId}>
              Choose images
            </label>

            <span className="rpUploadHint">
              {files.length ? `${files.length} selected` : "No images selected"}
            </span>

            <input
              id={uploadId}
              className="rpUploadInput"
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
            />
          </div>

          {previews.length > 0 ? (
            <div className="rpPreviewGrid">
              {previews.map((src, idx) => (
                <div className="rpPreviewItem" key={src}>
                  <img src={src} alt="preview" />
                  <button type="button" className="rpRemoveBtn" onClick={() => removeFile(idx)}>
                    X
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rpActions">
          <button type="submit" className="rpBtnPrimary" disabled={busy}>
            {busy ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
}