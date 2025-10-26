// src/components/TrackerActions.js
import React, { useState } from "react";

export default function TrackerActions({ onDelete, onPickColor, onOverride, onRename }) {
  const [open, setOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const COLORS = ["#5378ff", "#10b8c9", "#7c3aed", "#ef4444", "#22c55e", "#f59e0b"];

  return (
    <div className={`actions ${open ? "open" : ""}`}>
      {/* Gear */}
      <button
        type="button"
        className="gear"
        aria-label="Open tracker actions"
        onClick={() => { setOpen(v => !v); setShowPalette(false); }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor"
            d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm9 3.5c0-.5-.04-.98-.1-1.45l2.03-1.58-1.92-3.32-2.45.98a8.98 8.98 0 0 0-2.5-1.45L13.6 2h-3.2L9.94 4.68c-.88.28-1.72.69-2.5 1.15l-2.45-.98L3.07 8.17l2.03 1.58c-.06.47-.1.95-.1 1.45 0 .5.04.98.1 1.45l-2.03 1.58 1.92 3.32 2.45-.98c.78.46 1.62.87 2.5 1.15L10.4 22h3.2l.46-2.68c.88-.28 1.72-.69 2.5-1.15l2.45.98 1.92-3.32-2.03-1.58c.06-.47.1-.95.1-1.45Z" />
        </svg>
      </button>

      {/* Rail */}
      <div className="rail">
        {/* Rename */}
        <button type="button" className="rail-btn" title="Rename" aria-label="Rename" onClick={() => onRename?.()}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M10 4h4l6 16h-3l-1.3-4H8.3L7 20H4L10 4Zm3 8-2-6-2 6h4Z" />
          </svg>
        </button>

        {/* Override */}
        <button type="button" className="rail-btn" title="Override value" aria-label="Override value" onClick={() => onOverride?.()}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor"
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm18.71-11.04a1.004 1.004 0 0 0 0-1.41l-2.5-2.5a1.004 1.004 0 0 0-1.41 0L15 3.34l3.75 3.75 2.96-2.88Z"/>
          </svg>
        </button>

        {/* Color */}
        <button type="button" className="rail-btn" title="Change color" aria-label="Change color" onClick={() => setShowPalette(v => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor"
              d="M12 3a9 9 0 1 0 0 18h3a2 2 0 0 0 2-2c0-1.1-.9-2-2-2h-.5a2.5 2.5 0 1 1 0-5H15a3 3 0 0 0 3-3 4 4 0 0 0-4-4h-2Z"/>
          </svg>
        </button>

        {/* Delete */}
        <button type="button" className="rail-btn danger" title="Delete tracker" aria-label="Delete tracker" onClick={() => onDelete?.()}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M3 6h18M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path fill="currentColor" d="M10 11h2v6h-2zM14 11h2v6h-2z"/>
          </svg>
        </button>

        {/* Palette */}
        {showPalette && (
          <div className="palette">
            {COLORS.map((c) => (
              <button
                key={c}
                className="swatch"
                style={{ background: c }}
                onClick={() => { onPickColor?.(c); setShowPalette(false); }}
                aria-label={`Set color ${c}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
