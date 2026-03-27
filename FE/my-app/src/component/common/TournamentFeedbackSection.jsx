import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { API_BASE } from "../../config/api";

/**
 * Props:
 *   tournamentId  – required
 *   user          – logged-in user object (or null)
 *   role          – user's role string (e.g. "TOURNAMENTLEADER")
 *   isParticipant – true if user has joined the tournament (controls write button)
 */
export default function TournamentFeedbackSection({
  tournamentId,
  user,
  role,
  isParticipant,
}) {
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSummary, setFeedbackSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [showAllFeedback, setShowAllFeedback] = useState(false);

  // Modal: write / edit own feedback
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [newFeedbackComment, setNewFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submitFeedbackError, setSubmitFeedbackError] = useState("");

  // Leader reply state
  const [replyEditingId, setReplyEditingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  const [feedbackToast, setFeedbackToast] = useState(null);

  const isTournamentLeader = (role || "").toUpperCase() === "TOURNAMENTLEADER";

  // ─── Load feedback ────────────────────────────────────────────────────────
  const loadFeedback = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setFeedbackLoading(true);
      const res = await axios
        .get(
          `${API_BASE}/api/public/tournaments?action=feedback&id=${tournamentId}`,
        )
        .catch(() => null);
      if (res?.data) {
        const data = res.data;
        setFeedbackSummary({
          averageRating: Number(data.averageRating || 0),
          totalReviews: Number(data.totalReviews || 0),
          starCounts: {
            1: Number(data.starCounts?.["1"] || 0),
            2: Number(data.starCounts?.["2"] || 0),
            3: Number(data.starCounts?.["3"] || 0),
            4: Number(data.starCounts?.["4"] || 0),
            5: Number(data.starCounts?.["5"] || 0),
          },
        });
        setFeedbackItems(Array.isArray(data.items) ? data.items : []);
      } else {
        setFeedbackSummary({
          averageRating: 0,
          totalReviews: 0,
          starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
        setFeedbackItems([]);
      }
      setFeedbackError("");
    } catch {
      setFeedbackError("Không thể tải feedback cho giải đấu này.");
      setFeedbackItems([]);
    } finally {
      setFeedbackLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Auto-clear toast
  useEffect(() => {
    if (!feedbackToast) return;
    const t = setTimeout(() => setFeedbackToast(null), 3000);
    return () => clearTimeout(t);
  }, [feedbackToast]);

  // ─── Open write/edit modal ─────────────────────────────────────────────────
  const handleOpenWrite = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setSubmitFeedbackError("");
    setNewFeedbackRating(5);
    setNewFeedbackComment("");
    setEditingFeedbackId(null);
    setFeedbackModalOpen(true);
  };

  const handleOpenEdit = (fb) => {
    setEditingFeedbackId(fb.feedbackId);
    setNewFeedbackRating(fb.starRating || 5);
    setNewFeedbackComment(fb.comment || "");
    setSubmitFeedbackError("");
    setFeedbackModalOpen(true);
  };

  // ─── Submit / update feedback (optimistic-free, just reload) ──────────────
  const handleSubmitFeedback = async () => {
    if (!tournamentId) return;
    try {
      setSubmittingFeedback(true);
      setSubmitFeedbackError("");
      const payload = {
        tournamentId,
        starRating: newFeedbackRating,
        comment: newFeedbackComment.trim(),
      };
      let res;
      if (editingFeedbackId != null) {
        res = await axios.put(
          `${API_BASE}/api/feedback`,
          { ...payload, feedbackId: editingFeedbackId },
          { withCredentials: true },
        );
        setFeedbackToast({
          type: "success",
          text: res?.data?.message || "Cập nhật đánh giá thành công.",
        });
      } else {
        res = await axios.post(`${API_BASE}/api/feedback`, payload, {
          withCredentials: true,
        });
        setFeedbackToast({
          type: "success",
          text: res?.data?.message || "Gửi đánh giá thành công.",
        });
      }
      setFeedbackModalOpen(false);
      setEditingFeedbackId(null);
      await loadFeedback(); // reload data, not the page
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Gửi đánh giá thất bại. Vui lòng thử lại.";
      setSubmitFeedbackError(msg);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // ─── Leader: save reply ────────────────────────────────────────────────────
  const handleSaveReply = async (feedbackId) => {
    setSavingReply(true);
    try {
      await axios.post(
        `${API_BASE}/api/leader/feedback`,
        { feedbackId, reply: replyText.trim() },
        { withCredentials: true },
      );
      setReplyEditingId(null);
      setReplyText("");
      setFeedbackToast({
        type: "success",
        text: "Cập nhật phản hồi thành công.",
      });
      await loadFeedback(); // reload without page refresh
    } catch {
      setFeedbackToast({ type: "error", text: "Cập nhật phản hồi thất bại." });
    } finally {
      setSavingReply(false);
    }
  };

  // ─── Stars helper ──────────────────────────────────────────────────────────
  const renderStars = (rating, size = 18) =>
    Array.from({ length: 5 }).map((_, i) => {
      const idx = i + 1;
      return (
        <Star
          key={idx}
          size={size}
          className={rating >= idx ? "tdp-star-filled" : "tdp-star-empty"}
          fill={rating >= idx ? "#facc15" : "none"}
        />
      );
    });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Summary card */}
      <article className="tdp-card tdp-feedback-summary-card">
        <div className="tdp-feedback-header-inline">
          <h3>Feedback &amp; Reviews</h3>
        </div>

        {feedbackLoading ? (
          <div className="tdp-feedback-state">Đang tải feedback...</div>
        ) : feedbackError ? (
          <div className="tdp-feedback-state">{feedbackError}</div>
        ) : (
          <div className="tdp-feedback-summary-inline">
            {/* Score */}
            <div className="tdp-feedback-score-main">
              <span className="tdp-feedback-score-value">
                {feedbackSummary.averageRating.toFixed(1)}
              </span>
              <div className="tdp-feedback-stars-row">
                {renderStars(feedbackSummary.averageRating)}
              </div>
              <span className="tdp-feedback-total">
                {feedbackSummary.totalReviews} reviews
              </span>
            </div>

            {/* Distribution */}
            <div className="tdp-feedback-distribution">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = feedbackSummary.starCounts[String(star)] || 0;
                const total =
                  feedbackSummary.totalReviews > 0
                    ? feedbackSummary.totalReviews
                    : 1;
                const pct = Math.round((count * 100) / total);
                return (
                  <div key={star} className="tdp-feedback-dist-row">
                    <span className="tdp-feedback-dist-label">{star}</span>
                    <div className="tdp-feedback-dist-bar-wrap">
                      <div
                        className="tdp-feedback-dist-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="tdp-feedback-dist-count">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Write button — only for participants who haven't submitted feedback yet */}
            {isParticipant &&
              !feedbackItems.some(
                (fb) => user?.userId != null && fb.userId === user.userId,
              ) && (
                <button
                  type="button"
                  className="tdp-feedback-write-btn"
                  onClick={handleOpenWrite}
                >
                  VIẾT ĐÁNH GIÁ
                </button>
              )}
          </div>
        )}
      </article>

      {/* Feedback list */}
      <div className="tdp-feedback-list-inline">
        {feedbackItems.length === 0 ? (
          <div className="tdp-feedback-empty">
            Chưa có đánh giá nào cho giải đấu này.
          </div>
        ) : (
          <ul className="tdp-feedback-items">
            {feedbackItems.length > 3 && (
              <li className="tdp-feedback-see-all">
                <button
                  type="button"
                  onClick={() => setShowAllFeedback((p) => !p)}
                >
                  {showAllFeedback
                    ? "Thu gọn"
                    : `Xem tất cả (${feedbackItems.length} đánh giá)`}
                </button>
              </li>
            )}

            {(showAllFeedback ? feedbackItems : feedbackItems.slice(0, 3)).map(
              (fb) => {
                const isOwner =
                  user?.userId != null && user.userId === fb.userId;
                const isLeaderReplyRow = isTournamentLeader;

                return (
                  <li key={fb.feedbackId} className="tdp-feedback-item">
                    {/* Header */}
                    <div className="tdp-feedback-item-head">
                      <div className="tdp-feedback-user">
                        <div className="tdp-avatar-circle">
                          {(
                            fb.firstName?.[0] ||
                            fb.lastName?.[0] ||
                            "U"
                          )?.toUpperCase()}
                        </div>
                        <div>
                          <div className="tdp-feedback-name">
                            {fb.fullName ||
                              `${fb.firstName || ""} ${fb.lastName || ""}`.trim() ||
                              "Người chơi"}
                          </div>
                          <div className="tdp-feedback-meta">
                            {fb.createAt
                              ? new Date(fb.createAt).toLocaleDateString(
                                  "vi-VN",
                                )
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="tdp-feedback-stars-row">
                        {renderStars(fb.starRating || 0, 16)}
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="tdp-feedback-comment">{fb.comment}</p>

                    {/* Owner: edit own feedback */}
                    {isOwner && isParticipant && (
                      <button
                        type="button"
                        className="tdp-feedback-edit-own"
                        onClick={() => handleOpenEdit(fb)}
                      >
                        Chỉnh sửa đánh giá
                      </button>
                    )}

                    {/* Reply section */}
                    {isLeaderReplyRow ? (
                      /* Leader view: can reply or edit reply */
                      <div className="tdp-feedback-reply-block">
                        {replyEditingId === fb.feedbackId ? (
                          <>
                            <textarea
                              rows={2}
                              className="tdp-feedback-reply-input"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Nhập phản hồi của bạn..."
                            />
                            <div className="tdp-feedback-reply-actions">
                              <button
                                type="button"
                                className="tdp-btn-secondary"
                                onClick={() => {
                                  setReplyEditingId(null);
                                  setReplyText("");
                                }}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                className="tdp-btn-primary"
                                disabled={savingReply}
                                onClick={() => handleSaveReply(fb.feedbackId)}
                              >
                                {savingReply ? "Đang lưu..." : "Lưu phản hồi"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {fb.reply && (
                              <p className="tdp-feedback-reply">
                                <span className="tdp-feedback-reply-label">
                                  Phản hồi của BTC:
                                </span>{" "}
                                {fb.reply}
                              </p>
                            )}
                            <button
                              type="button"
                              className="tdp-feedback-reply-edit-btn"
                              onClick={() => {
                                setReplyEditingId(fb.feedbackId);
                                setReplyText(fb.reply || "");
                              }}
                            >
                              {fb.reply ? "Chỉnh sửa phản hồi" : "Phản hồi"}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      /* Normal user: just show reply text if exists */
                      fb.reply && (
                        <p className="tdp-feedback-reply">
                          <span className="tdp-feedback-reply-label">
                            Phản hồi từ BTC:
                          </span>{" "}
                          {fb.reply}
                        </p>
                      )
                    )}
                  </li>
                );
              },
            )}
          </ul>
        )}
      </div>

      {/* Modal: write / edit feedback */}
      {feedbackModalOpen && (
        <div className="tdp-feedback-modal-backdrop">
          <div className="tdp-feedback-modal">
            <h3>
              {editingFeedbackId != null
                ? "Chỉnh sửa đánh giá"
                : "Viết đánh giá"}
            </h3>
            <div className="tdp-feedback-modal-rating">
              <span>Đánh giá của bạn:</span>
              <div className="tdp-feedback-stars-row selectable">
                {Array.from({ length: 5 }).map((_, i) => {
                  const idx = i + 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="tdp-star-button"
                      onClick={() => setNewFeedbackRating(idx)}
                    >
                      <Star
                        size={22}
                        className={
                          newFeedbackRating >= idx
                            ? "tdp-star-filled"
                            : "tdp-star-empty"
                        }
                        fill={newFeedbackRating >= idx ? "#facc15" : "none"}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="tdp-feedback-modal-field">
              <label>Nội dung đánh giá</label>
              <textarea
                rows={4}
                value={newFeedbackComment}
                onChange={(e) => setNewFeedbackComment(e.target.value)}
                placeholder="Hãy chia sẻ trải nghiệm của bạn về giải đấu..."
              />
            </div>
            {submitFeedbackError && (
              <div className="tdp-feedback-error">{submitFeedbackError}</div>
            )}
            <div className="tdp-feedback-modal-actions">
              <button
                type="button"
                className="tdp-btn-secondary"
                onClick={() => {
                  if (!submittingFeedback) {
                    setFeedbackModalOpen(false);
                    setEditingFeedbackId(null);
                  }
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="tdp-btn-primary"
                disabled={submittingFeedback}
                onClick={handleSubmitFeedback}
              >
                {submittingFeedback
                  ? "Đang gửi..."
                  : editingFeedbackId != null
                    ? "Cập nhật đánh giá"
                    : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {feedbackToast && (
        <div
          className={`tdp-feedback-toast tdp-feedback-toast-${feedbackToast.type}`}
        >
          {feedbackToast.text}
        </div>
      )}
    </>
  );
}
