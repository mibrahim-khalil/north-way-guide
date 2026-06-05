import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReportForm from "../components/forms/ReportForm";

// ✅ IMPORTANT: load ReportForm styles even when form is CLOSED
import "../components/forms/ReportForm.css";

export default function Support() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const sp = new URLSearchParams(location.search);
  const isReport = sp.get("report") === "1";

  const closeReport = () => {
    sp.delete("report");
    const qs = sp.toString();
    navigate(qs ? `/support?${qs}` : "/support", { replace: true });
  };

  if (!loading && isReport && !user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return (
    <>
      <div className="card">
        <div
          className="cardBody"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 6px" }}>Support</h2>
            <p className="p">Need help? You can submit a complaint or suggestion.</p>
          </div>

          {!isReport ? (
            <button
              className="rpBtnPrimary"
              type="button"
              onClick={() => navigate("/support?report=1")}
            >
              Report Complaint / Suggestion
            </button>
          ) : (
            <button className="rpBtn" type="button" onClick={closeReport}>
              Close
            </button>
          )}
        </div>
      </div>

      {isReport ? (
        <ReportForm
          onClose={closeReport}
          onSubmitted={() => {
            // optional: auto close after submit
            // closeReport();
          }}
        />
      ) : null}
    </>
  );
}