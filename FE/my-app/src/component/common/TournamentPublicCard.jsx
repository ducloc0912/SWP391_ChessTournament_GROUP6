import React from "react";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=1200&q=80";

function formatDate(raw) {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function formatMoney(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("vi-VN");
}

function getApiOrigin(apiBase) {
  try {
    return new URL(apiBase).origin;
  } catch {
    return window.location.origin;
  }
}

function resolveImageUrl(rawImage, apiBase) {
  const src = String(rawImage || "").trim();
  if (!src) return FALLBACK_IMAGE;
  const apiOrigin = getApiOrigin(apiBase);
  if (/^(https?:)?\/\//i.test(src)) return src.startsWith("//") ? `${window.location.protocol}${src}` : src;
  if (/^(data:|blob:)/i.test(src)) return src;
  if (src.startsWith("/")) return `${apiOrigin}${src}`;
  return `${apiOrigin}/${src.replace(/^\.?\//, "")}`;
}

export default function TournamentPublicCard({
  tournament,
  apiBase,
  statusKey,
  statusLabel,
  formatLabel,
  onViewDetail,
  secondaryAction,
}) {
  const currentPlayers = Number(tournament.currentPlayers ?? 0);
  const maxPlayers = Number(tournament.maxPlayer ?? 0);
  const progress = maxPlayers > 0 ? Math.round((currentPlayers / maxPlayers) * 100) : 0;

  return (
    <article className="tp-card">
      <div className="tp-card-banner">
        <img
          src={resolveImageUrl(tournament.tournamentImage, apiBase)}
          alt={tournament.tournamentName || "Tournament"}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <span className={`tp-status-badge tp-status-${statusKey}`}>
          {statusLabel}
        </span>
      </div>
      <div className="tp-card-body">
        <span className="tp-format">{formatLabel}</span>
        <h3>{tournament.tournamentName || "Tournament"}</h3>
        <div className="tp-meta">
          <p><MapPin size={15} />{tournament.location || "Online"}</p>
          <p><Calendar size={15} />{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</p>
          <p><Trophy size={15} />{formatMoney(tournament.prizePool)} VND</p>
        </div>
        <div className="tp-progress">
          <div className="tp-progress-head">
            <span><Users size={14} /> {currentPlayers}/{maxPlayers} người chơi</span>
            <strong>{progress}%</strong>
          </div>
          <div className="tp-progress-bar">
            <div className="tp-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
        <div className="tp-card-actions">
          <button type="button" className="tp-detail-btn" onClick={onViewDetail}>
            Xem chi tiết
          </button>
          {secondaryAction ? (
            <button
              type="button"
              className="tp-detail-btn"
              disabled={secondaryAction.disabled}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
