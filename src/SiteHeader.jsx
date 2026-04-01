export default function SiteHeader({ cfg = {} }) {
  const name    = cfg.full_name  || "Antone Holmes, MA";
  const role    = cfg.title      || "Practitioner of Strategy in Philanthropy, Theology, & Revenue Enablement";
  const location= cfg.location   || "United States";
  const photo   = cfg.photo_url  || "";
  const links   = [
    { key: "social_medium",   label: "Medium",   icon: "medium"   },
    { key: "social_linkedin", label: "LinkedIn", icon: "linkedin" },
    { key: "social_behance",  label: "Behance",  icon: "behance"  },
    { key: "social_figma",    label: "Figma",    icon: "figma"    },
  ].filter(l => cfg[l.key]);

  return (
    <header style={{
      background: "#111110",
      fontFamily: "var(--font)",
      width: "100%",
    }}>
      {/* Top section — photo + name + role */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(14px, 3vw, 24px)",
        padding: "clamp(14px, 3vw, 22px) clamp(16px, 4vw, 36px) 14px",
        flexWrap: "wrap",
        justifyContent: "flex-start",
      }}>

        {/* Photo with gold ring */}
        {photo && (
          <div style={{
            width: "clamp(52px, 8vw, 72px)",
            height: "clamp(52px, 8vw, 72px)",
            borderRadius: "50%",
            border: "2.5px solid #C9A227",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            <img
              src={photo}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Name + role + location */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{
            fontSize: "clamp(18px, 3.5vw, 28px)",
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            margin: "0 0 6px",
          }}>
            {name}
          </h1>
          <div style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "6px 12px",
            fontSize: "clamp(11px, 1.8vw, 13px)",
            color: "#888780",
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
      <div style={{ height: "1px", background: "#C9A227", opacity: 0.45, margin: "0 clamp(16px, 4vw, 36px)" }} />

      {/* Social links */}
      {links.length > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(12px, 3vw, 22px)",
          padding: "10px clamp(16px, 4vw, 36px) 14px",
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#555550",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}>
            Social
          </span>
          {links.map(l => (
            <a
              key={l.key}
              href={cfg[l.key]}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: "clamp(11px, 1.8vw, 13px)",
                color: "#A09E98",
                textDecoration: "none",
              }}
            >
              <SocialIcon type={l.icon} />
              {l.label}
            </a>
          ))}
        </div>
      )}

      {/* Mobile centering override via media query injected once */}
      <style>{`
        @media (max-width: 600px) {
          .site-header-top { justify-content: center !important; text-align: center; }
          .site-header-meta { justify-content: center !important; }
          .site-header-social { justify-content: center !important; }
        }
      `}</style>
    </header>
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
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <circle cx="4.5" cy="8" r="3.5" stroke="#A09E98" strokeWidth="1.2"/>
      <ellipse cx="11" cy="8" rx="2" ry="3.5" stroke="#A09E98" strokeWidth="1.2"/>
      <line x1="14.5" y1="4.5" x2="14.5" y2="11.5" stroke="#A09E98" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
  if (type === "linkedin") return (
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="#A09E98" strokeWidth="1.2"/>
      <line x1="5" y1="7" x2="5" y2="12" stroke="#A09E98" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="5" cy="5" r="0.8" fill="#A09E98"/>
      <path d="M8 12V9a2 2 0 014 0v3" stroke="#A09E98" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="7" x2="8" y2="9" stroke="#A09E98" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
  if (type === "behance") return (
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <path d="M2 4h5.5a3 3 0 010 6H2V4z" stroke="#A09E98" strokeWidth="1.2"/>
      <path d="M2 7h4" stroke="#A09E98" strokeWidth="1.2"/>
      <path d="M9 10h5" stroke="#A09E98" strokeWidth="1.2"/>
      <circle cx="11.5" cy="7" r="2.5" stroke="#A09E98" strokeWidth="1.2"/>
      <line x1="9.5" y1="4.5" x2="13.5" y2="4.5" stroke="#A09E98" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
  if (type === "figma") return (
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <rect x="3" y="1.5" width="4" height="4" rx="2" stroke="#A09E98" strokeWidth="1.1"/>
      <rect x="3" y="5.5" width="4" height="4" rx="0" stroke="#A09E98" strokeWidth="1.1"/>
      <rect x="3" y="9.5" width="4" height="4" rx="2" stroke="#A09E98" strokeWidth="1.1"/>
      <circle cx="11" cy="7.5" r="2" stroke="#A09E98" strokeWidth="1.1"/>
      <rect x="9" y="1.5" width="4" height="4" rx="2" stroke="#A09E98" strokeWidth="1.1"/>
    </svg>
  );
  return null;
}
