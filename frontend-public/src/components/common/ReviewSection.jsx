import { useEffect, useMemo, useState, useId } from "react";
import { api } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNavigate, useLocation } from "react-router-dom";
import { requireLogin } from "../../utils/requireLogin";

function chipStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
}

/** one star with partial fill (0..1) */
function StarSvg({ fill = 0, size = 14 }) {
  const id = useId();
  const pct = Math.max(0, Math.min(1, Number(fill || 0)));
  const w = 24 * pct;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <clipPath id={`clip-${id}`}>
          <rect x="0" y="0" width={w} height="24" />
        </clipPath>
      </defs>

      {/* base (empty) */}
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill="rgba(148,163,184,0.55)"
      />

      {/* filled part */}
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill="rgb(245,158,11)"
        clipPath={`url(#clip-${id})`}
      />
    </svg>
  );
}

/** supports half stars like 4.5 */
function StarsStatic({ value = 0, size = 14 }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));

  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }} aria-label={`Rating ${v}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, v - i)); // 0..1
        return <StarSvg key={i} fill={fill} size={size} />;
      })}
    </span>
  );
}

function StarRatingInput({ value = 5, onChange }) {
  const [hover, setHover] = useState(0);
  const v = Math.max(1, Math.min(5, Number(value || 5)));
  const show = hover || v;

  return (
    <div className="rsStarInputRow">
      <div className="rsStarRow" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rsStar ${n <= show ? "on" : ""}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange?.(n)}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="rsStarValue">{v}/5</div>
    </div>
  );
}

export default function ReviewSection({ targetType, targetId }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const loc = useLocation();

  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(false);

  const [my, setMy] = useState(null);
  const [myLoading, setMyLoading] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reviews", { params: { targetType, targetId } });
      setList(res.data.items || []);
      setSummary(res.data.summary || { avg: 0, count: 0 });
    } catch {
      setList([]);
      setSummary({ avg: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadMine = async () => {
    if (!user) return;
    setMyLoading(true);
    try {
      const res = await api.get("/reviews/me", { params: { targetType, targetId } });
      const item = res.data?.item || null;
      setMy(item);

      if (item) {
        setRating(Number(item.rating || 5));
        setComment(String(item.comment || ""));
      } else {
        setRating(5);
        setComment("");
      }
    } catch {
      setMy(null);
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => {
    if (!targetId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, targetType, targetId]);

  const submit = async (e) => {
    e.preventDefault();

    const ok = await requireLogin(nav, toast, "Please login to review", loc.pathname + loc.search);
    if (!ok) return;

    setSaving(true);
    try {
      await api.post("/reviews", {
        targetType,
        targetId,
        rating: Number(rating || 5),
        comment: String(comment || ""),
      });

      toast("Review submitted. Waiting for admin approval.", 2500);
      await load();
      await loadMine();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to submit review", 2500);
    } finally {
      setSaving(false);
    }
  };

  const removeMine = async () => {
    if (!my?._id) return;
    const ok = confirm("Delete your review?");
    if (!ok) return;

    try {
      await api.delete(`/reviews/${my._id}`);
      toast("Review deleted", 2000);
      setMy(null);
      setRating(5);
      setComment("");
      await load();
    } catch (err) {
      toast(err?.response?.data?.message || "Delete failed", 2500);
    }
  };

  const myStatus = String(my?.status || "").toUpperCase();
  const avgLabel = useMemo(() => Number(summary.avg || 0).toFixed(1), [summary.avg]);

  return (
    <div className="card">
      <div className="cardBody">
        <style>{`
          .rsTop{
            display:flex;
            justify-content:space-between;
            gap: 10px;
            flex-wrap: wrap;
            align-items:center;
          }
          .rsSummary{
            display:flex;
            gap: 12px;
            flex-wrap:wrap;
            align-items:center;
            font-size: 13px;
            font-weight: 1000;
            color: rgba(100,116,139,0.95);
          }

          .rsGrid2{
            display:grid;
            grid-template-columns: 1fr 1.15fr;
            gap: 12px;
          }
          @media (max-width: 900px){ .rsGrid2{ grid-template-columns: 1fr; } }

          .rsBox{
            border: 1px solid rgba(15,23,42,0.08);
            border-radius: 16px;
            background: rgba(255,255,255,0.65);
            overflow: hidden;
          }

          .rsBoxHead{
            padding: 12px 12px;
            display:flex;
            justify-content:space-between;
            gap: 10px;
            flex-wrap:wrap;
            align-items:center;
            border-bottom: 1px solid rgba(15,23,42,0.06);
          }
          .rsBoxTitle{
            font-weight: 1100;
            color: var(--heading);
          }

          .rsChip{
            padding: 3px 10px;
            border-radius: 999px;
            font-weight: 1000;
            font-size: 12px;
          }

          .rsBoxBody{ padding: 12px; }

          /* Input stars (clean, not boxed) */
          .rsStarInputRow{
            display:flex;
            align-items:center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
          }
          .rsStarRow{
            display:inline-flex;
            gap: 4px;
            align-items:center;
          }
          .rsStar{
            appearance:none;
            border:0;
            background: transparent;
            cursor:pointer;
            padding: 0;
            width: 28px;
            height: 28px;
            display:grid;
            place-items:center;

            font-size: 22px;
            line-height: 1;
            font-weight: 1000;
            color: rgba(148,163,184,0.75);

            transition: transform .08s ease, color .12s ease;
          }
          .rsStar.on{ color: rgb(245,158,11); }
          .rsStar:hover{ transform: translateY(-1px) scale(1.05); }
          .rsStar:focus{ outline: none; }
          .rsStar:focus-visible{
            box-shadow: 0 0 0 4px rgba(59,130,246,0.14);
            border-radius: 10px;
          }
          .rsStarValue{
            font-size: 12px;
            font-weight: 1100;
            color: rgba(100,116,139,0.95);
            padding: 6px 10px;
            border-radius: 999px;
            border: 1px solid rgba(15,23,42,0.10);
            background: rgba(255,255,255,0.85);
          }

          .rsList{
            display:grid;
            gap: 10px;
          }
          .rsItem{
            border: 1px solid rgba(15,23,42,0.08);
            border-radius: 14px;
            background: rgba(255,255,255,0.78);
            padding: 12px;
          }
          .rsRow{
            display:flex;
            justify-content:space-between;
            gap: 10px;
            flex-wrap:wrap;
            align-items:center;
          }
          .rsUser{ font-weight: 1100; color: var(--heading); }
          .rsMeta{
            font-size: 12px;
            font-weight: 900;
            color: rgba(100,116,139,0.95);
          }
        `}</style>

        <div className="rsTop">
          <div>
            <h3 style={{ margin: "0 0 6px" }}>Reviews</h3>
            <div className="rsSummary">
              <span>
                Avg: <b>{avgLabel}</b>
              </span>
              <StarsStatic value={summary.avg || 0} size={14} />
              <span>
                Count: <b>{summary.count || 0}</b>
              </span>
            </div>
          </div>

          <button className="btn" type="button" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <hr className="sep" />

        <div className="rsGrid2">
          {/* Your review */}
          <div className="rsBox">
            <div className="rsBoxHead">
              <div className="rsBoxTitle">Your Review</div>
              {my ? (
                <span className="rsChip" style={chipStyle(my.status)}>
                  {String(my.status || "PENDING").toUpperCase()}
                </span>
              ) : null}
            </div>

            <div className="rsBoxBody">
              {!user ? (
                <p className="p" style={{ margin: 0 }}>Login to submit a review.</p>
              ) : myLoading ? (
                <p className="p" style={{ margin: 0 }}>Loading your review...</p>
              ) : (
                <>
                  {my ? (
                    <p className="p" style={{ fontSize: 12, marginTop: 0 }}>
                      {my.adminNote ? (
                        <>
                          <b>Admin note:</b> {my.adminNote}
                        </>
                      ) : myStatus === "APPROVED" ? (
                        "Editing will require re-approval."
                      ) : (
                        "Waiting for admin approval."
                      )}
                    </p>
                  ) : (
                    <p className="p" style={{ fontSize: 12, marginTop: 0 }}>
                      You haven’t reviewed yet.
                    </p>
                  )}

                  <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    <div>
                      <label>Rating</label>
                      <StarRatingInput value={rating} onChange={setRating} />
                    </div>

                    <div>
                      <label>Comment</label>
                      <textarea
                        className="input"
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write your experience..."
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button className="btn primary" type="submit" disabled={saving}>
                        {saving ? "Submitting..." : my ? "Update Review" : "Submit Review"}
                      </button>

                      {my ? (
                        <button className="btn" type="button" onClick={removeMine}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Approved list */}
          <div className="rsBox">
            <div className="rsBoxHead">
              <div className="rsBoxTitle">Approved Reviews</div>
              <span className="badge">{list.length}</span>
            </div>

            <div className="rsBoxBody">
              {list.length === 0 ? (
                <p className="p" style={{ margin: 0 }}>No approved reviews yet.</p>
              ) : (
                <div className="rsList">
                  {list.map((r) => (
                    <div key={r._id} className="rsItem">
                      <div className="rsRow">
                        <div className="rsUser" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span>{r.userId?.name || "User"}</span>
                          <StarsStatic value={r.rating} size={14} />
                          <span style={{ fontWeight: 1100 }}>{r.rating}/5</span>
                        </div>
                        <div className="rsMeta">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                        </div>
                      </div>
                      <p className="p" style={{ marginTop: 8 }}>{r.comment || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}