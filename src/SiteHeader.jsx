import { useState } from "react";

export default function SiteHeader({ cfg = {} }) {
  const name     = cfg.full_name || "Antone Holmes, MA";
  const role     = cfg.title     || "Practitioner of Strategy in Philanthropy, Theology, & Revenue Enablement";
  const location = cfg.location  || "United States";
  const photo    = cfg.photo_url || "https://hjs-ah.github.io/AH-FE-2.0/ProHeadshot_web-copy.jpg";

  const links = [
    { key: "social_medium",   label: "Medium",   icon: "medium"   },
    { key: "social_linkedin", label: "LinkedIn", icon: "linkedin" },
    { key: "social_behance",  label: "Behance",  icon: "behance"  },
    { key: "social_figma",    label: "Figma",    icon: "figma"    },
  ].filter(l => cfg[l.key] || true); // show all by default until config loads

  const activeLinks = links.map(l => ({
    ...l,
    url: cfg[l.key] || {
      social_medium:   "https://medium.com/@antoneh",
      social_linkedin: "https://linkedin.com/in/antoneholmes",
      social_behance:  "https://behance.net/antoneholmes",
      social_figma:    "https://figma.com/@antoneholmes",
    }[l.key] || "#"
  }));

  return (
    <header style={{ background: "#111110", fontFamily: "var(--font)", width: "100%" }}>

      {/* Mobile centering */}
      <style>{`
        @media (max-width: 600px) {
          .sh-top  { justify-content: center !important; }
          .sh-text { text-align: center; }
          .sh-meta { justify-content: center !important; flex-wrap: wrap; }
          .sh-soc  { justify-content: center !important; }
        }
      `}</style>

      {/* Top: photo + name + role */}
      <div className="sh-top" style={{
        display: "flex", alignItems: "center",
        gap: "clamp(14px, 3vw, 24px)",
        padding: "clamp(14px, 3vw, 22px) clamp(16px, 4vw, 36px) 14px",
        flexWrap: "wrap",
      }}>
        <Photo src={photo} alt={name} />
        <div className="sh-text">
          <h1 style={{
            fontSize: "clamp(18px, 3.5vw, 28px)", fontWeight: 700,
            color: "#FFFFFF", letterSpacing: "-0.02em",
            lineHeight: 1.15, margin: "0 0 6px",
          }}>
            {name}
          </h1>
          <div className="sh-meta" style={{
            display: "flex", alignItems: "center",
            gap: "6px 14px", fontSize: "clamp(11px, 1.8vw, 13px)",
            color: "#888780", flexWrap: "wrap",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BriefcaseIcon />
              {role}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <PinIcon />
              {location}
            </span>
          </div>
        </div>
      </div>

      {/* Gold divider */}
      <div style={{
        height: 1, background: "#C9A227", opacity: 0.45,
        margin: "0 clamp(16px, 4vw, 36px)",
      }} />

      {/* Social row */}
      <div className="sh-soc" style={{
        display: "flex", alignItems: "center",
        gap: "clamp(12px, 3vw, 22px)",
        padding: "10px clamp(16px, 4vw, 36px) 14px",
        flexWrap: "wrap",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "#555550",
          letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0,
        }}>
          Social
        </span>
        {activeLinks.map(l => (
          <a key={l.key} href={l.url} target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: "clamp(11px, 1.8vw, 13px)",
              color: "#A09E98", textDecoration: "none",
            }}
          >
            <SocialIcon type={l.icon} />
            {l.label}
          </a>
        ))}
      </div>
    </header>
  );
}

function Photo({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const initials = (alt || "AH").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const ringStyle = {
    width: "clamp(52px, 8vw, 72px)",
    height: "clamp(52px, 8vw, 72px)",
    borderRadius: "50%",
    border: "2.5px solid #C9A227",
    overflow: "hidden",
    flexShrink: 0,
    background: "#2A2924",
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  if (failed || !src) {
    return (
      <div style={ringStyle}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#C9A227" }}>{initials}</span>
      </div>
    );
  }

  return (
    <div style={ringStyle}>
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.6, flexShrink: 0 }}>
      <rect x="2" y="5" width="12" height="8" rx="1.5" stroke="#888780" strokeWidth="1.3"/>
      <path d="M5 5V4a1 1 0 011-1h4a1 1 0 011 1v1" stroke="#888780" strokeWidth="1.3"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 12 16" fill="none" style={{ opacity: 0.6, flexShrink: 0 }}>
      <circle cx="6" cy="6" r="2.5" stroke="#888780" strokeWidth="1.3"/>
      <path d="M6 14S1 9.5 1 6a5 5 0 0110 0c0 3.5-5 8-5 8z" stroke="#888780" strokeWidth="1.3"/>
    </svg>
  );
}

function SocialIcon({ type }) {
  const s = { width: 14, height: 14, flexShrink: 0 };
  if (type === "medium") return (
    <svg viewBox="0 0 20 20" fill="none" style={s}>
      <circle cx="6" cy="10" r="5" stroke="#A09E98" strokeWidth="1.5"/>
      <ellipse cx="14" cy="10" rx="2.5" ry="5" stroke="#A09E98" strokeWidth="1.5"/>
      <line x1="18" y1="5" x2="18" y2="15" stroke="#A09E98" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (type === "linkedin") return (
    <svg viewBox="0 0 20 20" fill="none" style={s}>
      <rect x="2" y="2" width="16" height="16" rx="3" stroke="#A09E98" strokeWidth="1.5"/>
      <line x1="6.5" y1="9" x2="6.5" y2="15" stroke="#A09E98" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6.5" cy="6.5" r="1" fill="#A09E98"/>
      <path d="M10 15v-3.5a2.5 2.5 0 015 0V15" stroke="#A09E98" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="9" x2="10" y2="11" stroke="#A09E98" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (type === "behance") return (
    <svg viewBox="0 0 20 20" fill="none" style={s}>
      <path d="M2 5h7a3 3 0 010 6H2V5z" stroke="#A09E98" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 8.5h5" stroke="#A09E98" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14.5" cy="11" r="3.5" stroke="#A09E98" strokeWidth="1.5"/>
      <path d="M11 11h7" stroke="#A09E98" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="6" x2="17" y2="6" stroke="#A09E98" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (type === "figma") return (
    <svg viewBox="0 0 20 20" fill="none" style={s}>
      <rect x="4" y="2" width="5" height="5" rx="2.5" stroke="#A09E98" strokeWidth="1.3"/>
      <rect x="4" y="7" width="5" height="5" rx="0" stroke="#A09E98" strokeWidth="1.3"/>
      <rect x="4" y="12" width="5" height="5" rx="2.5" stroke="#A09E98" strokeWidth="1.3"/>
      <circle cx="14" cy="9.5" r="2.5" stroke="#A09E98" strokeWidth="1.3"/>
      <rect x="11" y="2" width="5" height="5" rx="2.5" stroke="#A09E98" strokeWidth="1.3"/>
    </svg>
  );
  return null;
}
