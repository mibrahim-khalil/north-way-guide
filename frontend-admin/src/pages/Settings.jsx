import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function Settings() {
  const { user: authUser } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });

  const [sec, setSec] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/account");
      const u = res.data?.user;
      setProfile({
        name: u?.name || "",
        email: u?.email || "",
        phone: u?.phone || "",
      });
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to load admin profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChangeProfile = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));
  const onChangeSec = (k) => (e) => setSec((p) => ({ ...p, [k]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return alert("Name is required");

    setSavingProfile(true);
    try {
      await api.patch("/admin/account", { name: profile.name, phone: profile.phone });
      alert("Profile updated");
      await load();
    } catch (e2) {
      alert(e2?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (!sec.currentPassword || !sec.newPassword) {
      return alert("Current password and new password are required");
    }
    if (sec.newPassword.length < 6) {
      return alert("New password must be at least 6 characters");
    }
    if (sec.newPassword !== sec.confirmPassword) {
      return alert("Passwords do not match");
    }

    setChangingPass(true);
    try {
      await api.patch("/admin/account/password", {
        currentPassword: sec.currentPassword,
        newPassword: sec.newPassword,
      });
      alert("Password changed successfully");
      setSec({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e2) {
      alert(e2?.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/*  local styles (same vibe as Manage Events) */}
      <style>{`
        .setInput{
          width: 100%;
          padding: 12px 12px;
          border-radius: 12px;
          border: 1px solid rgba(15,23,42,0.14);
          background: rgba(255,255,255,0.65);
          outline: none;
          font-weight: 800;
          color: var(--heading);
        }
        .setInput:focus{
          border-color: rgba(124,58,237,0.65);
          box-shadow: 0 0 0 4px rgba(124,58,237,0.12);
          background: #fff;
        }
        .setInput:disabled{
          opacity: .7;
          cursor: not-allowed;
        }

        .setTop{
          display:flex;
          justify-content: space-between;
          align-items: end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .setGrid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 950px){
          .setGrid{ grid-template-columns: 1fr; }
        }

        .setCardTitle{
          font-weight: 1100;
          color: var(--heading);
          margin: 0;
        }
        .setCardSub{
          margin-top: 6px;
          font-weight: 900;
          color: var(--muted);
          font-size: 13px;
        }
        .setLabel{
          font-size: 12px;
          font-weight: 1000;
          color: rgba(15,23,42,0.72);
          margin-bottom: 6px;
        }
        .setHint{
          font-size: 12px;
          font-weight: 900;
          color: var(--muted);
          margin-top: 10px;
        }
      `}</style>

      {/* Header like Manage Events */}
      <div className="setTop">
        <div>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Manage your admin profile and security.
          </div>
        </div>

        <button className="aBtn" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="card">
          <div className="cardBody">
            <div className="adminMuted">Loading...</div>
          </div>
        </div>
      ) : (
        <>
          {/* Profile + Security cards (like the clean admin pages) */}
          <div className="setGrid">
            {/* Profile */}
            <div className="card">
              <div className="cardBody">
                <h3 className="setCardTitle">Admin Profile</h3>
                <div className="setCardSub">Update your display name and contact number.</div>

                <form
                  onSubmit={saveProfile}
                  style={{ display: "grid", gap: 12, marginTop: 14 }}
                >
                  <div>
                    <div className="setLabel">Name</div>
                    <input className="setInput" value={profile.name} onChange={onChangeProfile("name")} />
                  </div>

                  <div>
                    <div className="setLabel">Email</div>
                    <input className="setInput" value={profile.email} disabled />
                  </div>

                  <div>
                    <div className="setLabel">Phone</div>
                    <input className="setInput" value={profile.phone} onChange={onChangeProfile("phone")} />
                  </div>

                  <button
                    className="aBtn primary"
                    style={{ width: "100%", padding: "12px 14px" }}
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </form>
              </div>
            </div>

            {/* Security */}
            <div className="card">
              <div className="cardBody">
                <h3 className="setCardTitle">Security</h3>
                <div className="setCardSub">Change your admin password.</div>

                <form
                  onSubmit={changePassword}
                  style={{ display: "grid", gap: 12, marginTop: 14 }}
                >
                  <div>
                    <div className="setLabel">Current Password</div>
                    <input
                      className="setInput"
                      type="password"
                      value={sec.currentPassword}
                      onChange={onChangeSec("currentPassword")}
                    />
                  </div>

                  <div>
                    <div className="setLabel">New Password</div>
                    <input
                      className="setInput"
                      type="password"
                      value={sec.newPassword}
                      onChange={onChangeSec("newPassword")}
                    />
                  </div>

                  <div>
                    <div className="setLabel">Confirm Password</div>
                    <input
                      className="setInput"
                      type="password"
                      value={sec.confirmPassword}
                      onChange={onChangeSec("confirmPassword")}
                    />
                  </div>

                  <button
                    className="aBtn primary"
                    style={{ width: "100%", padding: "12px 14px" }}
                    disabled={changingPass}
                  >
                    {changingPass ? "Changing..." : "Change Password"}
                  </button>

                  <div className="setHint">
                    Logged in as:{" "}
                    <b style={{ color: "var(--heading)" }}>
                      {authUser?.email || profile.email}
                    </b>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}