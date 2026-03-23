import { useState } from "react";

export default function StarRating({ value = 0, onChange, size = 16, readonly = false }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize: size,
            cursor: readonly ? "default" : "pointer",
            color: n <= active ? "#C47B10" : "#D0CEC5",
            transition: "color 0.1s",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
