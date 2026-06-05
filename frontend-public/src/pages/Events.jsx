import { useEffect, useState } from "react";
import { api } from "../utils/api";
import EventCard from "../components/cards/EventCard";

export default function Events() {
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ one timer for all cards
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const load = async (type) => {
    setLoading(true);
    try {
      const res = await api.get("/events", { params: { type, limit: 40 } });
      setItems(res.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Events in Gilgit Baltistan</h2>
          <p className="p" style={{ marginTop: 6 }}>
            {tab === "upcoming" ? "Upcoming events you can attend." : "Past events history."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn ${tab === "upcoming" ? "primary" : ""}`}
            type="button"
            onClick={() => setTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`btn ${tab === "past" ? "primary" : ""}`}
            type="button"
            onClick={() => setTab("past")}
          >
            Past
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p">No events found.</div>
      ) : (
        <div className="grid cols-4">
          {items.map((e) => (
            <EventCard key={e._id} event={e} nowMs={nowMs} />
          ))}
        </div>
      )}
    </div>
  );
}