import { useCallback, useEffect, useMemo, useState } from "react";
import "./ImageGallery.css";

export default function ImageGallery({
  images = [],
  alt = "",
  height = 320,
  fit = "cover",
  showViewFull = true,
}) {
  const list = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const [idx, setIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasMany = list.length > 1;

  useEffect(() => {
    if (idx < 0) setIdx(0);
    else if (idx >= list.length && list.length > 0) setIdx(0);
  }, [idx, list.length]);

  const active = list[idx] || list[0] || "/images/home1.png";

  const open = useCallback(() => setLightboxOpen(true), []);
  const close = useCallback(() => setLightboxOpen(false), []);

  const prev = useCallback(() => {
    if (!hasMany) return;
    setIdx((p) => (p - 1 + list.length) % list.length);
  }, [hasMany, list.length]);

  const next = useCallback(() => {
    if (!hasMany) return;
    setIdx((p) => (p + 1) % list.length);
  }, [hasMany, list.length]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, close, prev, next]);

  return (
    <div className="igWrap">
      <div className="igHeroWrap" style={{ height }}>
        {showViewFull ? (
          <button type="button" className="igViewFull" onClick={open}>
            View Full
          </button>
        ) : null}

        <img
          src={active}
          alt={alt}
          className="igHeroImg"
          style={{ objectFit: fit }}
          onClick={open}
          onError={(e) => (e.currentTarget.src = "/images/home1.png")}
        />
      </div>

      {hasMany ? (
        <div className="igThumbRow">
          {list.slice(0, 12).map((u, i) => (
            <button
              key={`${u}-${i}`}
              type="button"
              className={`igThumbBtn ${i === idx ? "on" : ""}`}
              onClick={() => setIdx(i)}
              title={`Image ${i + 1}`}
            >
              <img
                src={u}
                alt={`${alt}-${i}`}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <div className="igLbOverlay" onClick={close} role="dialog" aria-modal="true">
          <div className="igLbModal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="igLbClose" onClick={close} aria-label="Close">
              ×
            </button>

            {hasMany ? (
              <>
                <button type="button" className="igLbNav left" onClick={prev} aria-label="Previous image">
                  ‹
                </button>
                <button type="button" className="igLbNav right" onClick={next} aria-label="Next image">
                  ›
                </button>
              </>
            ) : null}

            <img
              src={active}
              alt={alt}
              className="igLbImg"
              onError={(e) => (e.currentTarget.src = "/images/home1.png")}
            />

            {hasMany ? (
              <div className="igLbFooter">
                Image <b>{idx + 1}</b> / <b>{list.length}</b>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}