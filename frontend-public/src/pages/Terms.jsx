import { useLocation, useNavigate } from "react-router-dom";

// reuse the same themed buttons you already made (rpBtn / rpBtnPrimary)
import "../components/forms/ReportForm.css";

export default function Terms() {
  const navigate = useNavigate();
  const location = useLocation();

  const sp = new URLSearchParams(location.search);
  const next = sp.get("next"); // optional: /terms?next=/support

  const onClose = () => {
    if (next) return navigate(next, { replace: true });

    // fallback: go back if possible, else go home
    if (window.history.length > 1) return navigate(-1);
    return navigate("/", { replace: true });
  };

  return (
    <div className="card">
      <div className="cardBody">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 6px" }}>Terms & Conditions</h2>
            <p className="p" style={{ margin: 0 }}>
              Please read these terms carefully before using North Way Guide.
            </p>
          </div>

          <button type="button" className="rpBtn" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ marginTop: 14, lineHeight: 1.7 }}>
          <h3 style={{ marginBottom: 6 }}>1) Acceptance of Terms</h3>
          <p className="p">
            By accessing or using this platform, you agree to follow these Terms & Conditions.
          </p>

          <h3 style={{ marginBottom: 6 }}>2) Accounts</h3>
          <p className="p">
            You are responsible for maintaining the confidentiality of your account and for all
            activity under your account.
          </p>

          <h3 style={{ marginBottom: 6 }}>3) Listings, Bookings & Orders</h3>
          <p className="p">
            Service providers and vendors are responsible for the accuracy of listings. We do not
            guarantee availability, pricing, or service quality.
          </p>

          <h3 style={{ marginBottom: 6 }}>4) Payments</h3>
          <p className="p">
            Payment-related disputes may be reported through the “Report Complaint / Suggestion”
            feature. We may review and take appropriate action where possible.
          </p>

          <h3 style={{ marginBottom: 6 }}>5) User Content</h3>
          <p className="p">
            Reviews, complaints, suggestions, and uploads must be lawful and must not violate any
            rights of others.
          </p>

          <h3 style={{ marginBottom: 6 }}>6) Termination</h3>
          <p className="p">
            We may suspend or terminate access if these terms are violated.
          </p>

          <h3 style={{ marginBottom: 6 }}>7) Contact</h3>
          <p className="p">
            For help, use the Support page to submit a complaint/suggestion.
          </p>

          <p className="p" style={{ marginTop: 14, opacity: 0.75 }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}