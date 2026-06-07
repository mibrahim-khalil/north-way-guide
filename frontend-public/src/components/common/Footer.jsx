import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/images/logowhite.png";
import "./Footer.css";

export default function Footer() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const goReport = (e) => {
    e.preventDefault();
    const next = "/support?report=1";
    if (loading) return navigate(next);
    if (!user) return navigate(`/login?next=${encodeURIComponent(next)}`);
    return navigate(next);
  };

  return (
    <footer className="nwFooter">
      <div className="container nwFooterInner">
        <div className="footerTop">
          <div className="footerBrand">
            <div className="footerLogoStage">
              <img src={logo} alt="North Way Guide Logo" className="footerLogoImg" />
            </div>
            <div>
              <div className="footerTitle">North Way Guide</div>
              <div className="footerSub">A tourism platform for Gilgit-Baltistan</div>
            </div>
          </div>

          <div className="footerCols">
            <div className="footerCol">
              <div className="footerColTitle">Explore</div>
              <Link to="/tourist-spots">Tourist Spots</Link>
              <Link to="/hotels">Hotels</Link>
              <Link to="/transport">Transport</Link>
              <Link to="/local-products">Local Products</Link>
            </div>

            <div className="footerCol">
              <div className="footerColTitle">Plan</div>
              <Link to="/trip-planner">Trip Planner</Link>
              <Link to="/about">About</Link>
              <Link to="/terms">Terms & Conditions</Link>
              <a href="/support?report=1" onClick={goReport}>
                Report Complaint / Suggestion
              </a>
            </div>

            <div className="footerCol">
              <div className="footerColTitle">Account</div>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          </div>
        </div>

        <div className="footerBottom">
          <div>© {new Date().getFullYear()} North Way Guide - Gilgit-Baltistan</div>
          <div className="footerNote">Department of Software Engineering-CUST</div>
        </div>
      </div>
    </footer>
  );
}