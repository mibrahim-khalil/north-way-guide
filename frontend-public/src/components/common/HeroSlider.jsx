import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./HeroSlider.css";

export default function HeroSlider({
  title,
  subtitle,
  badges = [],
  images = [],
  interval = 2600,
  ctaPrimary,
  ctaSecondary,
}) {
  const safeImages = useMemo(() => images?.filter(Boolean) ?? [], [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const t = setInterval(() => {
      setIndex((p) => (p + 1) % safeImages.length);
    }, interval);
    return () => clearInterval(t);
  }, [safeImages.length, interval]);

  const bg = safeImages[index];

  return (
    <section className="hero">
      <div className="heroBg" style={{ backgroundImage: `url(${bg})` }} />
      <div className="heroOverlay" />

      <div className="container heroInner">
        <div className="heroLeft">
          <div className="heroBadges">
            {badges.map((b) => (
              <span className="badge" key={b}>{b}</span>
            ))}
          </div>

          <h1 className="h1">{title}</h1>
          <p className="p">{subtitle}</p>

          <div className="heroCtas">
            {ctaPrimary?.to && (
              <Link className="btn primary" to={ctaPrimary.to}>
                {ctaPrimary.label}
              </Link>
            )}
            {ctaSecondary?.to && (
              <Link className="btn" to={ctaSecondary.to}>
                {ctaSecondary.label}
              </Link>
            )}
          </div>

          {safeImages.length > 1 && (
            <div className="dots" aria-label="Hero images">
              {safeImages.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === index ? "active" : ""}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="heroRight">
          <div className="glassCard">
            <div className="glassTitle">Quick Access</div>
            <div className="glassGrid">
              <Link to="/trip-planner" className="glassItem">AI Trip Planner</Link>
              <Link to="/hotels" className="glassItem">Find Hotels</Link>
              <Link to="/tourist-spots" className="glassItem">Tourist Spots</Link>
              <Link to="/transport" className="glassItem">Transport & Fare Comparison</Link>
            </div>
            <hr className="sep" />

          </div>
        </div>
      </div>
    </section>
  );
}