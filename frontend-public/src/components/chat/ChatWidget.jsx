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

function ClockIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
            borderRadius: 12,
            border: "1px solid var(--hairline)",
            background: "var(--canvas)",
            overflow: "hidden",
            boxShadow: "none",
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
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--soft)",
                border: "1px solid var(--hairline)",
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
                fontWeight: 700,
                color: "var(--ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.title}
            </div>

            {c.subtitle ? (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{c.subtitle}</div>
            ) : null}

            {c.meta ? (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
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

  const INK = "var(--ink, #111111)";
  const SOFT = "var(--soft, #f5f5f5)";
  const CANVAS = "var(--canvas, #ffffff)";
  const HAIRLINE = "var(--hairline, #e5e5e5)";
  const MUTED = "var(--muted, #707072)";

  const normalizeMessages = (arr) =>
    (arr || []).map((m) => ({
      ...m,
      time: m.time || formatTime(m.createdAt),
      cards: m.cards || [],
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

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, createdAt: now, time: formatTime(now), cards: [] },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", { message: text, sessionId });
      setSessionId(res.data?.sessionId);

      const botNow = new Date();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data?.reply ?? "No reply",
          createdAt: botNow,
          time: formatTime(botNow),
          cards: Array.isArray(res.data?.cards) ? res.data.cards : [],
        },
      ]);

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
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nw-bouncing { animation: none !important; }
        }

        .nw-chat-btn{
          position: fixed;
          bottom: 22px;
          right: 22px;
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          background: ${INK};
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          font-weight: 700;
          z-index: 1000;
          user-select: none;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0,0,0,0.28);
        }

        .nw-chat-panel{
          position: fixed;
          bottom: 90px;
          right: 22px;
          width: 440px;
          height: 720px;
          background: ${CANVAS};
          border-radius: 16px;
          box-shadow: 0 30px 70px rgba(0,0,0,0.30);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          border: 1px solid ${HAIRLINE};
          overflow: hidden;
        }

        @media (max-width: 540px){
          .nw-chat-btn{
            bottom: 16px;
            right: 16px;
            width: 54px;
            height: 54px;
          }
          .nw-chat-panel{
            left: 12px;
            right: 12px;
            width: auto;
            bottom: 78px;
            height: calc(100vh - 104px);
            border-radius: 14px;
          }
        }
      `}</style>

      <div
        onClick={() => setOpen((v) => !v)}
        className={`nw-chat-btn ${open ? "" : "nw-bouncing"}`}
        style={{ animation: open ? "none" : "nw-bounce 2.2s infinite" }}
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

      {open && (
        <div className="nw-chat-panel">
          <div
            style={{
              padding: "14px 16px",
              background: INK,
              color: "#fff",
              fontWeight: 700,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9999,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                  flexShrink: 0,
                }}
              >
                <img src={BOT_LOGO} alt="AI Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ letterSpacing: 0.2 }}>NorthWay AI Guide</div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHistory((v) => !v);
              }}
              style={{
                cursor: "pointer",
                userSelect: "none",
                width: 36,
                height: 36,
                borderRadius: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
              }}
              title="Chat History"
            >
              <ClockIcon />
            </button>

            {showHistory && (
              <div
                ref={historyRef}
                style={{
                  position: "absolute",
                  top: 56,
                  right: 10,
                  width: 330,
                  maxHeight: 320,
                  overflowY: "auto",
                  padding: 12,
                  borderRadius: 14,
                  background: CANVAS,
                  boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
                  border: `1px solid ${HAIRLINE}`,
                  zIndex: 5000,
                }}
              >
                {sessions.length === 0 ? (
                  <div style={{ fontSize: 13, color: MUTED, padding: 6 }}>
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
                          borderRadius: 12,
                          marginBottom: 8,
                          background: SOFT,
                          border: `1px solid ${HAIRLINE}`,
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
                              fontWeight: 700,
                              color: "var(--ink)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {s.title || "Untitled chat"}
                          </div>
                          <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
                            {dateLabel}
                            {timeLabel ? ` • ${timeLabel}` : ""}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(id);
                          }}
                          type="button"
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#d30005",
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

          <div style={{ flex: 1, padding: 18, overflowY: "auto", background: CANVAS }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: isUser ? "row-reverse" : "row",
                    gap: 10,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9999,
                      overflow: "hidden",
                      flexShrink: 0,
                      border: `1px solid ${HAIRLINE}`,
                      background: isUser ? INK : SOFT,
                      color: isUser ? "#fff" : "var(--ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {isUser ? (
                      "U"
                    ) : (
                      <img src={BOT_LOGO} alt="AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>

                  <div
                    style={{
                      maxWidth: "72%",
                      padding: "10px 14px",
                      borderRadius: 16,
                      background: isUser ? INK : CANVAS,
                      color: isUser ? "#fff" : "var(--ink)",
                      fontSize: 13,
                      lineHeight: 1.45,
                      border: isUser ? "1px solid rgba(255,255,255,0.12)" : `1px solid ${HAIRLINE}`,
                      boxShadow: "none",
                      wordBreak: "break-word",
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                    {!isUser ? <CardGrid cards={msg.cards} /> : null}
                    <div style={{ fontSize: 10, marginTop: 8, opacity: 0.65 }}>
                      {msg.time || formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ marginTop: 10, color: MUTED, fontSize: 13 }}>
                Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              padding: 14,
              display: "flex",
              gap: 10,
              borderTop: `1px solid ${HAIRLINE}`,
              background: CANVAS,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Gilgit-Baltistan..."
              style={{
                flex: 1,
                height: 44,
                padding: "0 14px",
                borderRadius: 12,
                border: `1px solid ${HAIRLINE}`,
                fontSize: 13,
                outline: "none",
                background: CANVAS,
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              type="button"
              onClick={sendMessage}
              style={{
                height: 44,
                padding: "0 18px",
                borderRadius: 9999,
                border: `1px solid ${INK}`,
                background: INK,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
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