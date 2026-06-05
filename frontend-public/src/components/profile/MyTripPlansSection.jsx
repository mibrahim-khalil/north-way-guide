import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

export default function MyTripPlansSection() {
  const { toast } = useToast();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // load my saved trips
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/trip-planner/saved");
      setItems(res.data?.items || []);
    } catch (e) {
      setItems([]);
      toast(e?.response?.data?.message || "Failed to load saved trip plans", 2500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // delete one saved trip
  const del = async (id) => {
    const ok = confirm("Delete this saved trip plan?");
    if (!ok) return;

    try {
      await api.delete(`/trip-planner/saved/${id}`);
      toast("Deleted", 1800);
      load();
    } catch (e) {
      toast(e?.response?.data?.message || "Delete failed", 2500);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>My Trip Plans</h3>
        <button className="btn" type="button" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!loading && items.length === 0 ? (
        <div className="p">No saved trip plans yet. Generate a trip and click Save Trip Plan.</div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((x) => (
          <div key={x._id} className="card" style={{ boxShadow: "none" }}>
            <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 1000 }}>{x.title || "Trip Plan"}</div>
                <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                  Start: <b>{x.summary?.startLocation || "—"}</b> • Date: <b>{x.summary?.startDate || "—"}</b> • Days:{" "}
                  <b>{x.summary?.daysPlanned || 0}</b> • Est total: <b>{money(x.summary?.estTotal || 0)}</b>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn primary" type="button" onClick={() => nav(`/trip-planner?savedId=${x._id}`)}>
                  Open
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => del(x._id)}
                  style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}