import { useState, useRef, useEffect } from "react";
import { api } from "../../utils/api";

const BOT_LOGO = "/images/chatbot-logo.png";

function TrashIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 6h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 6l1 15c.05.55.5 1 1.1 1h5.8c.6 0 1.05-.45 1.1-1L17 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 11v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 11v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function formatTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHistoryDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function CardGrid({ cards = [] }) {
  if (!cards.length) return null;

  const open = (to) => {
    if (!to) return;
    window.location.assign(to);
  };

  return (
    <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
      {cards.map((c, idx) => (
        <div
          key={idx}
          onClick={() => open(c.to)}
          style={{
            cursor: c.to ? "pointer" : "default",
            borderRadius: 16,
            border: "1px solid rgba(15,23,42,0.10)",
            background: "#fff",
            overflow: "hidden",
            boxShadow: "0 10px 18px rgba(0,0,0,0.06)",
            display: "grid",
            gridTemplateColumns: c.image ? "70px 1fr" : "1fr",
            gap: 12,
            alignItems: "center",
            padding: 10,
          }}
          title={c.to ? "Open" : ""}
        >
          {c.image ? (
            <div
              style={{
                width: 70,
                height: 56,
                borderRadius: 12,
                overflow: "hidden",
                background: "linear-gradient(135deg,#e2e8f0,#f8fafc)",
                border: "1px solid rgba(15,23,42,0.06)",
              }}
            >
              <img
                src={c.image}
                alt={c.title || "item"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          ) : null}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.title}
            </div>

            {c.subtitle ? (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {c.subtitle}
              </div>
            ) : null}

            {c.meta ? (
              <div style={{ fontSize: 11, color: "#0f172a", marginTop: 4, opacity: 0.75 }}>
                {c.meta}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const historyRef = useRef(null);

  const NAVY = "var(--heading, #0b1324)";
  const HEADER_GRADIENT =
    "linear-gradient(135deg, #0b1324 0%, #0f1a32 55%, #1a2a4a 100%)";

  const normalizeMessages = (arr) =>
    (arr || []).map((m) => ({
      ...m,
      time: m.time || formatTime(m.createdAt),
      cards: m.cards || [], // old messages usually won't have cards
    }));

  const fetchSessions = async () => {
    try {
      const res = await api.get("/chat");
      const list = Array.isArray(res.data) ? res.data : res.data?.sessions || [];
      setSessions(list);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setSessions([]);
    }
  };

  useEffect(() => {
    if (open) fetchSessions();
    else setShowHistory(false);
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!showHistory) return;
    const onDown = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) setShowHistory(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showHistory]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    const now = new Date();

    const userMessage = {
      role: "user",
      content: text,
      createdAt: now,
      time: formatTime(now),
      cards: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", { message: text, sessionId });

      setSessionId(res.data?.sessionId);

      const botNow = new Date();
      const botMessage = {
        role: "assistant",
        content: res.data?.reply ?? "No reply",
        createdAt: botNow,
        time: formatTime(botNow),
        cards: Array.isArray(res.data?.cards) ? res.data.cards : [],
      };

      setMessages((prev) => [...prev, botMessage]);
      fetchSessions();
    } catch (err) {
      console.error("Send message failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (id) => {
    try {
      const res = await api.get(`/chat/${id}`);
      setMessages(normalizeMessages(res.data?.session?.messages || []));
      setSessionId(id);
      setShowHistory(false);
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const deleteSession = async (id) => {
    const ok = window.confirm("Delete this chat?");
    if (!ok) return;

    try {
      await api.delete(`/chat/${id}`);
      setSessions((prev) => prev.filter((s) => (s._id || s.id) !== id));
      if (sessionId === id) {
        setSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("Failed to delete chat");
    }
  };

  return (
    <>
      <style>{`
        @keyframes nw-bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-6px); }
        }
        @keyframes nw-bounce-shadow {
          0%, 20%, 50%, 80%, 100% { box-shadow: 0 18px 35px rgba(0,0,0,0.25); }
          40% { box-shadow: 0 26px 45px rgba(0,0,0,0.30); }
          60% { box-shadow: 0 22px 40px rgba(0,0,0,0.28); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nw-bouncing { animation: none !important; }
        }
      `}</style>

      {/* Floating Button */}
      <div
        onClick={() => setOpen((v) => !v)}
        className="nw-bouncing"
        style={{
          position: "fixed",
          bottom: 30,
          right: 30,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontWeight: 800,
          zIndex: 1000,
          userSelect: "none",
          overflow: "hidden",
          animation: open
            ? "none"
            : "nw-bounce 2.2s infinite, nw-bounce-shadow 2.2s infinite",
        }}
        title="Open AI Chat"
      >
        <img
          src={BOT_LOGO}
          alt="AI"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement.textContent = "AI";
          }}
        />
      </div>

      {/* Chat Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 95,
            right: 30,
            width: 460,
            height: 760,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(22px)",
            borderRadius: 26,
            boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "visible",
            border: "1px solid rgba(15, 23, 42, 0.08)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: HEADER_GRADIENT,
              color: "#fff",
              fontWeight: 700,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              position: "relative",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={BOT_LOGO}
                  alt="AI Logo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ letterSpacing: 0.2 }}>NorthWay AI Guide</div>
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowHistory((v) => !v);
              }}
              style={{
                cursor: "pointer",
                fontSize: 16,
                userSelect: "none",
                width: 34,
                height: 34,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
              title="Chat History"
            >
              🕘
            </div>

            {/* History Dropdown */}
            {showHistory && (
              <div
                ref={historyRef}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 10,
                  marginTop: 10,
                  width: 330,
                  maxHeight: 300,
                  overflowY: "auto",
                  padding: 12,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.98)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
                  border: "1px solid rgba(15, 23, 42, 0.10)",
                  zIndex: 5000,
                }}
              >
                {sessions.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#0f172a", opacity: 0.75, padding: 6 }}>
                    No previous chats
                  </div>
                ) : (
                  sessions.map((s) => {
                    const id = s._id || s.id;
                    const when = s.updatedAt || s.createdAt;
                    const dateLabel = formatHistoryDate(when);
                    const timeLabel = formatTime(when);

                    return (
                      <div
                        key={id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 14,
                          marginBottom: 8,
                          background: "#f8fafc",
                          border: "1px solid rgba(15, 23, 42, 0.06)",
                        }}
                      >
                        <div
                          onClick={() => loadSession(id)}
                          style={{ flex: 1, cursor: "pointer", minWidth: 0 }}
                          title={s.title || "Untitled chat"}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: "#0f172a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {s.title || "Untitled chat"}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                            {dateLabel}
                            {timeLabel ? ` • ${timeLabel}` : ""}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(id);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#ff2d2d",
                            padding: 6,
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Delete chat"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {/* Avatar */}
                {msg.role === "assistant" ? (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "1px solid rgba(15, 23, 42, 0.08)",
                      background: "rgba(99,102,241,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={BOT_LOGO}
                      alt="AI"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#fff",
                      background: NAVY,
                      flexShrink: 0,
                    }}
                  >
                    U
                  </div>
                )}

                {/* Bubble */}
                <div
                  style={{
                    maxWidth: "72%",
                    padding: "10px 14px",
                    borderRadius: 16,
                    background: msg.role === "user" ? NAVY : "#ffffff",
                    color: msg.role === "user" ? "#fff" : "#0f172a",
                    fontSize: 13,
                    lineHeight: 1.45,
                    border:
                      msg.role === "user"
                        ? "1px solid rgba(255,255,255,0.10)"
                        : "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: msg.role === "user" ? "none" : "0 10px 18px rgba(0,0,0,0.06)",
                    wordBreak: "break-word",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>

                  {/* ✅ Cards under assistant reply */}
                  {msg.role === "assistant" ? <CardGrid cards={msg.cards} /> : null}

                  <div style={{ fontSize: 10, marginTop: 8, opacity: 0.6 }}>
                    {msg.time || formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ marginTop: 10, color: "#0f172a", opacity: 0.6, fontSize: 13 }}>
                <span style={{ marginRight: 4 }}>●</span>
                <span style={{ marginRight: 4 }}>●</span>
                <span>●</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: 16,
              display: "flex",
              gap: 10,
              borderTop: "1px solid rgba(15, 23, 42, 0.08)",
              background: "rgba(255,255,255,0.85)",
              borderBottomLeftRadius: 26,
              borderBottomRightRadius: 26,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Gilgit Baltistan..."
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid rgba(15, 23, 42, 0.10)",
                fontSize: 13,
                outline: "none",
                background: "rgba(255,255,255,0.95)",
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              onClick={sendMessage}
              style={{
                padding: "10px 16px",
                borderRadius: 16,
                border: "none",
                background: NAVY,
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 12px 20px rgba(0,0,0,0.18)",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}