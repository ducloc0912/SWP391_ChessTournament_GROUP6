import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Calendar,
  ShieldCheck,
  FileText,
  RotateCw,
  Zap,
  Plus,
  Trash2,
} from "lucide-react";
import "../../assets/css/HomePage.css";
import "../../assets/css/tournament-leader/TournamentForm.css";

import { API_BASE } from "../../config/api";

const STEPS = [
  { id: 1, title: "Thông tin cơ bản" },
  { id: 2, title: "Lịch trình & Luật" },
  { id: 3, title: "Đăng ký" },
  { id: 4, title: "Xem lại & Xuất bản" },
];

const FORMAT_ICONS = {
  RoundRobin: RotateCw,
  KnockOut: Zap,
};

const FORMAT_LABELS = {
  RoundRobin: "Vòng tròn",
  KnockOut: "Loại trực tiếp",
};

const FORMAT_PLAYER_LIMITS = {
  RoundRobin: { min: 4, max: 12 },
  KnockOut: { min: 8, max: 32 },
};

const getFormatLabel = (format) => FORMAT_LABELS[format] || format;
const getFormatPlayerLimits = (format) =>
  FORMAT_PLAYER_LIMITS[format] || { min: 2, max: 16 };

const getTodayLocalDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function CreateTournamentPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);
  const [formats, setFormats] = useState([]);

  const [formData, setFormData] = useState({
    tournamentName: "",
    format: "",
    location: "",
    description: "",
    rules: "",
    prizePool: "",
    maxPlayer: "",
    minPlayer: "",
    entryFee: "",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    notes: "",
    autoApprove: true,
    prizeTiers: [{ rankPosition: 1, amount: "" }],
  });

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/tournaments?action=filters`, {
        withCredentials: true,
      })
      .then((res) => setFormats((res.data.formats || []).filter((f) => f !== "Hybrid")))
      .catch(() => {});
  }, []);

  const update = (patch) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const validateStep = (step) => {
    setError(null);
    const today = getTodayLocalDate();
    switch (step) {
      case 1:
        if (!formData.tournamentName.trim())
          return setError("Vui lòng nhập tên giải đấu."), false;
        if (!formData.format)
          return setError("Vui lòng chọn thể thức."), false;
        return true;
      case 2:
        if (!formData.startDate)
          return setError("Vui lòng chọn ngày bắt đầu."), false;
        if (!formData.endDate)
          return setError("Vui lòng chọn ngày kết thúc."), false;
        if (!formData.registrationDeadline)
          return setError("Vui lòng chọn hạn đăng ký."), false;
        if (formData.registrationDeadline < today)
          return setError("Hạn đăng ký không được là ngày trong quá khứ."), false;
        if (formData.startDate < today)
          return setError("Ngày bắt đầu không được là ngày trong quá khứ."), false;
        if (formData.endDate < today)
          return setError("Ngày kết thúc không được là ngày trong quá khứ."), false;
        if (formData.registrationDeadline >= formData.startDate)
          return setError("Hạn đăng ký phải trước ngày bắt đầu."), false;
        if (formData.startDate >= formData.endDate)
          return setError("Ngày bắt đầu phải trước ngày kết thúc."), false;
        return true;
      case 3: {
        const limits = getFormatPlayerLimits(formData.format);
        const min = Number(formData.minPlayer);
        const max = Number(formData.maxPlayer);
        if (!min || min < limits.min || min > limits.max)
          return setError(
            `Số người chơi tối thiểu cho thể thức ${getFormatLabel(formData.format)} phải từ ${limits.min} đến ${limits.max}.`
          ), false;
        if (!max || max < limits.min || max > limits.max)
          return setError(
            `Số người chơi tối đa cho thể thức ${getFormatLabel(formData.format)} phải từ ${limits.min} đến ${limits.max}.`
          ), false;
        if (!max || max < min)
          return setError("Số người chơi tối đa phải lớn hơn tối thiểu."), false;
        return true;
      }
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
      return;
    }
    if (!validateStep(3)) {
      setCurrentStep(3);
      window.scrollTo(0, 0);
      return;
    }

    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).userId : null;
    if (!userId) {
      alert("Vui lòng đăng nhập để tạo giải đấu");
      navigate("/login");
      return;
    }

    const limits = getFormatPlayerLimits(formData.format);
  const tournamentPayload = {
      tournamentName: formData.tournamentName,
      description: formData.description,
      rules: formData.rules,
      location: formData.location,
      format: formData.format,
      maxPlayer: Number(formData.maxPlayer) || limits.max,
      minPlayer: Number(formData.minPlayer) || limits.min,
      entryFee: Number(formData.entryFee) || 0,
      prizePool: Number(formData.prizePool) || 0,
      registrationDeadline: formData.registrationDeadline
        ? new Date(formData.registrationDeadline).toISOString()
        : null,
      startDate: formData.startDate
        ? new Date(formData.startDate).toISOString()
        : null,
      endDate: formData.endDate
        ? new Date(formData.endDate).toISOString()
        : null,
      createBy: userId,
      notes: formData.notes,
    };

  const prizeTemplates = (formData.prizeTiers || [])
    .filter((t) => t.amount !== "" && Number(t.amount) > 0)
    .map((t, i) => ({
      rankPosition: i + 1,
      fixedAmount: Number(t.amount),
      label: `Hạng ${i + 1}`,
    }));

    const payload = {
      tournament: tournamentPayload,
      prizeTemplates: prizeTemplates.length > 0 ? prizeTemplates : undefined,
    };

    try {
      const res = await axios.post(`${API_BASE}/api/tournaments`, payload, {
        withCredentials: true,
      });
      const data = res?.data;
      if (data?.success) {
        alert("Tạo giải đấu thành công!");
        if (data.tournamentId) {
          navigate(`/tournaments/${data.tournamentId}`);
        } else {
          navigate("/tournaments");
        }
      } else {
        alert("Tạo giải đấu thất bại!");
      }
    } catch (err) {
      console.error("Error creating tournament:", err);
      alert(err?.response?.data?.message || "Tạo giải đấu thất bại!");
    }
  };

  return (
    <div className="cw-page hpv-page">
      <div className="cw-container">
        {/* Header */}
        <div className="cw-page-header">
          <div>
            <h1>Tạo giải đấu</h1>
            <p>Thiết lập thông tin cho giải cờ vua</p>
          </div>
        </div>

        {/* Wizard */}
        <div className="cw-wizard">
          {/* Steps Bar */}
          <div className="cw-steps-bar">
            <div className="cw-steps-list">
              {STEPS.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const cls = isActive
                  ? "active"
                  : isCompleted
                    ? "completed"
                    : "pending";
                return (
                  <React.Fragment key={step.id}>
                    <div className="cw-step-item">
                      <div className={`cw-step-circle ${cls}`}>
                        {isCompleted ? <Check size={14} /> : step.id}
                      </div>
                      <span className={`cw-step-label ${cls}`}>
                        {step.title}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="cw-step-connector" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="cw-step-content" key={currentStep}>
            {currentStep === 1 && (
              <BasicInfoStep
                data={formData}
                update={update}
                formats={formats}
              />
            )}
            {currentStep === 2 && (
              <ScheduleRulesStep data={formData} update={update} />
            )}
            {currentStep === 3 && (
              <RegistrationStep data={formData} update={update} />
            )}
            {currentStep === 4 && <ReviewStep data={formData} />}
          </div>

          {/* Footer */}
          <div className="cw-footer">
            <div className="cw-footer-left">
              <button
                className="cw-btn cw-btn-ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft size={16} /> Quay lại
              </button>
              {error && <span className="cw-error-msg">{error}</span>}
            </div>

            <div className="cw-footer-right">
              {currentStep === 4 ? (
                <>
                  <button
                    className="cw-btn cw-btn-danger"
                    onClick={() => navigate("/tournaments")}
                  >
                    Hủy
                  </button>
                  <button
                    className="cw-btn cw-btn-primary"
                    onClick={handleSubmit}
                    style={{ minWidth: 160 }}
                  >
                    Gửi duyệt
                  </button>
                </>
              ) : (
                <button className="cw-btn cw-btn-primary" onClick={nextStep}>
                  Tiếp theo <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ Step 1: Basic Info ══════════════ */

const BasicInfoStep = ({ data, update, formats }) => {
  const [prizeToast, setPrizeToast] = useState("");

  const showPrizeToast = (msg) => {
    setPrizeToast(msg);
    window.clearTimeout(BasicInfoStep._toastTimer);
    BasicInfoStep._toastTimer = window.setTimeout(() => {
      setPrizeToast("");
    }, 2200);
  };

  const recomputeTotalPrize = (tiers) =>
    String(
      (tiers || []).reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0,
      ) || "",
    );

  const tiersOrDefault =
    data.prizeTiers && data.prizeTiers.length
      ? data.prizeTiers
      : [{ rankPosition: 1, amount: "" }];

  return (
    <div>
      <div className="cw-form-row">
        <div className="cw-field full">
          <label className="cw-label">
            Tên giải đấu <span className="req">*</span>
          </label>
          <input
            className="cw-input"
            placeholder="VD: Grandmaster Clash 2026"
            value={data.tournamentName}
            onChange={(e) => update({ tournamentName: e.target.value })}
          />
        </div>
      </div>

      <div className="cw-form-row">
        <div className="cw-field full">
          <label className="cw-label">
            Thể thức <span className="req">*</span>
          </label>
          <div className="cw-format-group">
            {formats.map((f) => {
              const Icon = FORMAT_ICONS[f] || Trophy;
              return (
                <button
                  key={f}
                  type="button"
                  className={`cw-format-btn ${
                    data.format === f ? "active" : ""
                  }`}
                  onClick={() =>
                    update({ format: f, minPlayer: "", maxPlayer: "" })
                  }
                >
                  <Icon size={16} /> {getFormatLabel(f)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cw-form-row">
        <div className="cw-field full">
          <label className="cw-label">Địa điểm</label>
          <input
            className="cw-input"
            placeholder="VD: Nhà thi đấu Quận 1 (hoặc Online)"
            value={data.location}
            onChange={(e) => update({ location: e.target.value })}
          />
        </div>
      </div>

      <div className="cw-form-row">
        <div className="cw-field full">
          <label className="cw-label">Mô tả</label>
          <textarea
            className="cw-textarea"
            placeholder="Mô tả chi tiết giải đấu…"
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>
      </div>

      <div className="cw-form-row">
        <div className="cw-field full">
          <label className="cw-label">Giải thưởng theo hạng</label>
          <p className="cw-hint">
            Thiết lập số người được thưởng và mức thưởng (VND) cho từng hạng.
            Để trống nếu không có giải thưởng.
          </p>
          {prizeToast && (
            <div className="cw-prize-toast">
              {prizeToast}
            </div>
          )}
          <div className="cw-prize-table-wrap">
            <table className="cw-prize-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Mức thưởng (VND)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tiersOrDefault.map((row, idx) => (
                  <tr key={idx}>
                    <td>Hạng {idx + 1}</td>
                    <td>
                      <input
                        className="cw-input cw-input-sm"
                        type="number"
                        min={0}
                        placeholder="VD: 5000000"
                        value={row.amount ?? ""}
                        onChange={(e) => {
                          const tiers = [...(data.prizeTiers || [])];
                          if (!tiers[idx])
                            tiers[idx] = {
                              rankPosition: idx + 1,
                              amount: "",
                            };
                          let val = Number(e.target.value || 0);
                          if (val < 0) val = 0;
                          let safe = val;
                          if (idx > 0) {
                            const prevAmt = Number(
                              tiers[idx - 1]?.amount || 0,
                            );
                            if (prevAmt > 0 && val > prevAmt) {
                              safe = prevAmt;
                              showPrizeToast(
                                `Hạng ${
                                  idx + 1
                                } không được cao hơn hạng ${idx}. Hệ thống đã điều chỉnh về ${prevAmt.toLocaleString(
                                  "vi-VN",
                                )} VND.`,
                              );
                            }
                          }
                          tiers[idx] = {
                            ...tiers[idx],
                            amount: safe ? String(safe) : "",
                          };
                          const prizePool = recomputeTotalPrize(tiers);
                          update({ prizeTiers: tiers, prizePool });
                        }}
                      />
                    </td>
                    <td>
                      {(data.prizeTiers || []).length > 1 && (
                        <button
                          type="button"
                          className="cw-btn-icon cw-btn-ghost"
                          title="Xóa hạng"
                          onClick={() => {
                            const tiers = (data.prizeTiers || []).filter(
                              (_, i) => i !== idx,
                            );
                            const normalized =
                              tiers.length > 0
                                ? tiers.map((t, i2) => ({
                                    ...t,
                                    rankPosition: i2 + 1,
                                  }))
                                : [
                                    {
                                      rankPosition: 1,
                                      amount: "",
                                    },
                                  ];
                            const prizePool =
                              recomputeTotalPrize(normalized);
                            update({
                              prizeTiers: normalized,
                              prizePool,
                            });
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="cw-btn cw-btn-ghost cw-add-tier-btn"
              onClick={() => {
                const tiers = [...(data.prizeTiers || tiersOrDefault)];
                tiers.push({
                  rankPosition: tiers.length + 1,
                  amount: "",
                });
                const prizePool = recomputeTotalPrize(tiers);
                update({ prizeTiers: tiers, prizePool });
              }}
            >
              <Plus size={16} /> Thêm hạng
            </button>
          </div>
          <div className="cw-form-row cols-2" style={{ marginTop: 16 }}>
            <div className="cw-field">
              <label className="cw-label">
                Quỹ thưởng tổng (VND) – tự động
              </label>
              <input
                className="cw-input"
                type="text"
                readOnly
                value={
                  data.prizePool
                    ? Number(data.prizePool).toLocaleString("vi-VN")
                    : ""
                }
              />
            </div>
            <div className="cw-field">
              <label className="cw-label">Phí tham gia ($)</label>
              <input
                className="cw-input"
                type="number"
                min={0}
                placeholder="0"
                value={data.entryFee}
                onChange={(e) => update({ entryFee: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════ Step 2: Schedule & Rules ══════════════ */

const ScheduleRulesStep = ({ data, update }) => {
  const today = getTodayLocalDate();
  return (
  <div>
    <h3 className="cw-section-title">
      <Calendar size={20} /> Lịch trình
    </h3>
    <div className="cw-form-row cols-2">
      <div className="cw-field">
        <label className="cw-label">
          Hạn đăng ký <span className="req">*</span>
        </label>
        <input
          className="cw-input"
          type="date"
          min={today}
          max={data.startDate || undefined}
          value={data.registrationDeadline}
          onChange={(e) => update({ registrationDeadline: e.target.value })}
        />
      </div>
      <div className="cw-field">
        <label className="cw-label">
          Ngày bắt đầu <span className="req">*</span>
        </label>
        <input
          className="cw-input"
          type="date"
          min={today}
          max={data.endDate || undefined}
          value={data.startDate}
          onChange={(e) => update({ startDate: e.target.value })}
        />
      </div>
      <div className="cw-field">
        <label className="cw-label">
          Ngày kết thúc <span className="req">*</span>
        </label>
        <input
          className="cw-input"
          type="date"
          min={data.startDate || today}
          value={data.endDate}
          onChange={(e) => update({ endDate: e.target.value })}
        />
      </div>
    </div>

    <div className="cw-divider" />

    <h3 className="cw-section-title">Luật thi đấu</h3>

    <div className="cw-form-row">
      <div className="cw-field full">
        <label className="cw-label">Luật &amp; Quy định</label>
        <textarea
          className="cw-textarea"
          placeholder="Thời gian chuẩn FIDE: 90p + 30s&#10;Không xin hòa trước nước 30&#10;Cấm thiết bị điện tử"
          value={data.rules}
          onChange={(e) => update({ rules: e.target.value })}
        />
      </div>
    </div>

    <div className="cw-form-row">
      <div className="cw-field full">
        <label className="cw-label">Ghi chú thêm</label>
        <textarea
          className="cw-textarea"
          placeholder="Thông tin địa điểm, hướng dẫn đặc biệt…"
          value={data.notes}
          onChange={(e) => update({ notes: e.target.value })}
          style={{ minHeight: 80 }}
        />
      </div>
    </div>
  </div>
  );
};

/* ══════════════ Step 3: Registration ══════════════ */

const RegistrationStep = ({ data, update }) => {
  const limits = getFormatPlayerLimits(data.format);
  const minForMax = Math.max(limits.min, Number(data.minPlayer) || limits.min);
  return (
  <div>
    <div className="cw-form-row">
      <div className="cw-field full">
        <label className="cw-label">Thể thức đã chọn</label>
        <input
          className="cw-input"
          value={`${getFormatLabel(data.format || "Chưa chọn")} (${limits.min} - ${limits.max} người chơi)`}
          readOnly
        />
      </div>
    </div>

    <div className="cw-divider" />

    <div className="cw-form-row cols-2">
      <div className="cw-field">
        <label className="cw-label">
          Số người tối thiểu <span className="req">*</span>
        </label>
        <input
          className="cw-input"
          type="number"
          min={limits.min}
          max={limits.max}
          placeholder={`${limits.min}`}
          value={data.minPlayer}
          onChange={(e) => update({ minPlayer: e.target.value })}
        />
      </div>
      <div className="cw-field">
        <label className="cw-label">
          Số người tối đa <span className="req">*</span>
        </label>
        <input
          className="cw-input"
          type="number"
          min={minForMax}
          max={limits.max}
          placeholder={`${limits.max}`}
          value={data.maxPlayer}
          onChange={(e) => update({ maxPlayer: e.target.value })}
        />
      </div>
    </div>

    <div className="cw-divider" />

    <div className="cw-form-row cols-2">
      <div className="cw-toggle-card">
        <div className="cw-toggle-row">
          <div className="cw-toggle-info">
            <h4>Tự động duyệt</h4>
            <p>Tự động chấp nhận người chơi đủ điều kiện</p>
          </div>
          <label className="cw-switch">
            <input
              type="checkbox"
              checked={data.autoApprove}
              onChange={(e) => update({ autoApprove: e.target.checked })}
            />
            <span className="cw-switch-track" />
          </label>
        </div>
      </div>
    </div>
  </div>
  );
};

/* ══════════════ Step 4: Review & Publish ══════════════ */

const ReviewStep = ({ data }) => {
  const fmtDate = (v) => (v ? v.replaceAll("-", "/") : "Not set");

  return (
    <div>
      <div className="cw-review-notice">
        <ShieldCheck size={20} />
        <div>
          <strong>Cần xét duyệt</strong>
          Giải đấu sẽ được Admin xét duyệt trước khi công khai.
        </div>
      </div>

      <div className="cw-review-grid">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="cw-review-card">
            <div className="cw-review-card-header">
              <h3>
                <Trophy size={16} /> Chi tiết giải đấu
              </h3>
            </div>
            <div className="cw-review-card-body">
              <div className="cw-review-row">
                <span className="label">Tên</span>
                <span className="value">
                  {data.tournamentName || "Chưa đặt tên"}
                </span>
              </div>
              <div className="cw-review-row">
                <span className="label">Thể thức</span>
                <span className="value">{getFormatLabel(data.format) || "Không có"}</span>
              </div>
              <div className="cw-review-row">
                <span className="label">Địa điểm</span>
                <span className="value">{data.location || "Chưa xác định"}</span>
              </div>
              {(data.prizeTiers || []).filter((t) => t.amount !== "" && Number(t.amount) > 0).length > 0 ? (
                <div className="cw-review-row cw-review-prizes">
                  <span className="label">Giải thưởng theo hạng</span>
                  <span className="value">
                    <ul className="cw-prize-review-list">
                      {(data.prizeTiers || []).filter((t) => t.amount !== "" && Number(t.amount) > 0).map((t, i) => (
                        <li key={i}>
                          Hạng {i + 1}: {Number(t.amount || 0).toLocaleString("vi-VN")} VND
                        </li>
                      ))}
                    </ul>
                  </span>
                </div>
              ) : null}
              <div className="cw-review-row">
                <span className="label">Quỹ thưởng tổng ($)</span>
                <span className="value">
                  ${Number(data.prizePool || 0).toLocaleString()}
                </span>
              </div>
              <div className="cw-review-row">
                <span className="label">Phí tham gia</span>
                <span className="value">
                  {Number(data.entryFee) > 0
                    ? `$${data.entryFee}`
                    : "Miễn phí"}
                </span>
              </div>
              <div className="cw-review-row">
                <span className="label">Người chơi</span>
                <span className="value">
                  {data.minPlayer || 2} — {data.maxPlayer || "Không có"}
                </span>
              </div>
            </div>
          </div>

          {(data.description || data.rules) && (
            <div className="cw-review-card">
              <div className="cw-review-card-header">
                <h3>
                  <FileText size={16} /> Mô tả &amp; Luật thi đấu
                </h3>
              </div>
              <div className="cw-review-card-body">
                {data.description && (
                  <p className="cw-review-desc">{data.description}</p>
                )}
                {data.rules && (
                  <>
                    <h4
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginTop: 16,
                        marginBottom: 8,
                      }}
                    >
                      Luật thi đấu
                    </h4>
                    <p className="cw-review-desc">{data.rules}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="cw-review-sidebar">
          <div className="cw-review-card">
            <div className="cw-review-card-header">
              <h3>
                <Calendar size={16} /> Lịch trình
              </h3>
            </div>
            <div className="cw-review-card-body">
              <div className="cw-review-timeline">
                <div className="cw-review-timeline-item">
                  <div className="cw-review-timeline-dot" />
                  <div className="cw-review-timeline-label">
                    Đóng đăng ký
                  </div>
                  <div className="cw-review-timeline-value">
                    {fmtDate(data.registrationDeadline)}
                  </div>
                </div>
                <div className="cw-review-timeline-item">
                  <div className="cw-review-timeline-dot" />
                  <div className="cw-review-timeline-label">
                    Bắt đầu giải
                  </div>
                  <div className="cw-review-timeline-value">
                    {fmtDate(data.startDate)}
                  </div>
                </div>
                <div className="cw-review-timeline-item">
                  <div className="cw-review-timeline-dot" />
                  <div className="cw-review-timeline-label">
                    Kết thúc giải
                  </div>
                  <div className="cw-review-timeline-value">
                    {fmtDate(data.endDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
