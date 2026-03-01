<<<<<<< HEAD
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import {
  Trophy, 
  Calendar, 
  Users, 
  ChevronRight, 
  DollarSign, 
=======
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
>>>>>>> Dung
  FileText,
  RotateCw,
<<<<<<< HEAD
  Layers
} from 'lucide-react';
import { FormSection } from '../../component/tournament/FormSection';
import '../../assets/css/tournament-leader.css';

const TOURNAMENT_FORMAT = {
  ROUND_ROBIN: 'RoundRobin',
  KNOCKOUT: 'KnockOut',
  HYBRID: 'Hybrid',
=======
  Zap,
  Layers,
} from "lucide-react";
import "../../assets/css/tournament-leader/TournamentForm.css";

const STEPS = [
  { id: 1, title: "Thông tin cơ bản" },
  { id: 2, title: "Lịch trình & Luật" },
  { id: 3, title: "Đăng ký" },
  { id: 4, title: "Xem lại & Xuất bản" },
];

const FORMAT_ICONS = {
  RoundRobin: RotateCw,
  KnockOut: Zap,
  Hybrid: Layers,
};

const FORMAT_LABELS = {
  RoundRobin: "Vòng tròn",
  KnockOut: "Loại trực tiếp",
  Hybrid: "Kết hợp",
};

const FORMAT_PLAYER_LIMITS = {
  RoundRobin: { min: 4, max: 12 },
  KnockOut: { min: 8, max: 32 },
  Hybrid: { min: 20, max: 50 },
};

const getFormatLabel = (format) => FORMAT_LABELS[format] || format;
const getFormatPlayerLimits = (format) =>
  FORMAT_PLAYER_LIMITS[format] || { min: 2, max: 16 };

const getTodayLocalDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
>>>>>>> Dung
};

export default function CreateTournamentPage() {
  const navigate = useNavigate();
<<<<<<< HEAD

  const [formData, setFormData] = useState({
    tournamentName: "",
    description: "",
    location: "",
    format: "",
    categories: "",
    maxPlayer: 16,
    minPlayer: 2,
    entryFee: 0,
    prizePool: 0,
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Tournament Name
    if (!formData.tournamentName.trim()) {
      newErrors.tournamentName = "Tournament name is required.";
    } else if (formData.tournamentName.length > 100) {
      newErrors.tournamentName = "Tournament name must be less than 100 characters.";
    }

    // Description
    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters.";
    }

    // Location
    if (!formData.location.trim()) {
      newErrors.location = "Location is required.";
    }

    // Format
    if (!formData.format) {
      newErrors.format = "Tournament format is required.";
    } else if (!Object.values(TOURNAMENT_FORMAT).includes(formData.format)) {
      newErrors.format = "Invalid tournament format.";
    }

    // Categories
    if (!formData.categories.trim()) {
      newErrors.categories = "Categories is required.";
    }

    // Players
    const minPlayer = Number(formData.minPlayer);
    const maxPlayer = Number(formData.maxPlayer);
    if (minPlayer < 2) {
      newErrors.minPlayer = "Minimum players must be at least 2.";
    }
    if (maxPlayer > 100) {
      newErrors.maxPlayer = "Maximum players must be at most 100.";
    }
    if (minPlayer >= maxPlayer) {
      newErrors.minPlayer = "Minimum players must be less than maximum players.";
    }

    // Entry Fee and Prize Pool
    const entryFee = Number(formData.entryFee);
    const prizePool = Number(formData.prizePool);
    if (entryFee < 0) {
      newErrors.entryFee = "Entry fee cannot be negative.";
    }
    if (prizePool < 0) {
      newErrors.prizePool = "Prize pool cannot be negative.";
    }

    // Dates
    const now = new Date();
    const regDeadline = formData.registrationDeadline ? new Date(formData.registrationDeadline) : null;
    const startDate = formData.startDate ? new Date(formData.startDate) : null;
    const endDate = formData.endDate ? new Date(formData.endDate) : null;

    if (!regDeadline) {
      newErrors.registrationDeadline = "Registration deadline is required.";
    } else if (regDeadline <= now) {
      newErrors.registrationDeadline = "Registration deadline must be in the future.";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required.";
    } else if (startDate <= now) {
      newErrors.startDate = "Start date must be in the future.";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required.";
    } else if (endDate <= now) {
      newErrors.endDate = "End date must be in the future.";
    }

    if (regDeadline && startDate && regDeadline >= startDate) {
      newErrors.registrationDeadline = "Registration deadline must be before start date.";
    }

    if (startDate && endDate && startDate >= endDate) {
      newErrors.startDate = "Start date must be before end date.";
    }

    // Notes (optional, but limit length)
    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = "Notes must be less than 1000 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };
=======
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);
  const [formats, setFormats] = useState([]);

  const [formData, setFormData] = useState({
    tournamentName: "",
    format: "",
    location: "",
    description: "",
    categories: "",
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
  });

  useEffect(() => {
    axios
      .get("http://localhost:8080/ctms/api/tournaments?action=filters", {
        withCredentials: true,
      })
      .then((res) => setFormats(res.data.formats || []))
      .catch(() => {});
  }, []);
>>>>>>> Dung

  const update = (patch) =>
    setFormData((prev) => ({ ...prev, ...patch }));

<<<<<<< HEAD
    if (!validateForm()) {
      return;
    }

    // Get logged-in user's ID from localStorage
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).userId : null;

    if (!userId) {
      alert('Please login to create a tournament');
      navigate('/login');
      return;
    }

    // Map formData to BE expected format
    const payload = {
      tournamentName: formData.tournamentName,
      description: formData.description,
      location: formData.location,
      format: formData.format,
      categories: formData.categories,
      maxPlayer: Number(formData.maxPlayer),
      minPlayer: Number(formData.minPlayer),
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
      notes: formData.notes
    };

    try {
      const response = await axios.post('http://localhost:8080/ctms/api/tournaments', payload, {
        withCredentials: true
      });
      console.log('Create result:', response.data);
      alert('Tournament created successfully!');
      navigate("/tournaments");
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Create tournament failed');
    }
  };

  const typeIcons = {
    RoundRobin: <RotateCw size={16} />,
    KnockOut: <Zap size={16} />,
    Hybrid: <Layers size={16} />,
=======
  const validateStep = (step) => {
    setError(null);
    const today = getTodayLocalDate();
    switch (step) {
      case 1:
        if (!formData.tournamentName.trim())
          return setError("Vui lòng nhập tên giải đấu."), false;
        if (!formData.format)
          return setError("Vui lòng chọn thể thức."), false;
        if (!formData.categories.trim())
          return setError("Vui lòng nhập hạng mục."), false;
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
    const payload = {
      tournamentName: formData.tournamentName,
      description: formData.description,
      rules: formData.rules,
      location: formData.location,
      format: formData.format,
      categories: formData.categories,
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

    try {
      await axios.post("http://localhost:8080/ctms/api/tournaments", payload, {
        withCredentials: true,
      });
      alert("Tạo giải đấu thành công!");
      navigate("/tournaments");
    } catch (err) {
      console.error("Error creating tournament:", err);
      alert("Tạo giải đấu thất bại!");
    }
>>>>>>> Dung
  };

  return (
    <div className="cw-page">
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

<<<<<<< HEAD
          <FormSection
            title="Tournament Basics"
            subtitle="The fundamental details of your event"
            icon={<Trophy size={24} />}
          >
            <div className="tlc-field-full">
              <label>Tournament Name <span className="required">*</span></label>
              <input
                name="tournamentName"
                value={formData.tournamentName}
                onChange={handleInputChange}
                required
              />
              {errors.tournamentName && <span className="error-message">{errors.tournamentName}</span>}
            </div>

            <div className="tlc-field-half">
              <label>Location <span className="required">*</span></label>
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
              {errors.location && <span className="error-message">{errors.location}</span>}
            </div>

            <div className="tlc-field-half">
              <label>Categories <span className="required">*</span></label>
              <input
                name="categories"
                value={formData.categories}
                onChange={handleInputChange}
                required
              />
              {errors.categories && <span className="error-message">{errors.categories}</span>}
            </div>

            <div className="tlc-field-half">
              <label>Description <span className="required">*</span></label>
              <input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="tlc-field-full">
              <label>Tournament Type <span className="required">*</span></label>
              <div className="tlc-type-group">
                {Object.values(TOURNAMENT_FORMAT).map(format => (
                  <button
                    key={format}
                    type="button"
                    className={`tlc-type-btn ${
                      formData.format === format ? `active ${format.toLowerCase()}` : ''
                    }`}
                    onClick={() =>
                      setFormData(prev => ({ ...prev, format }))
                    }
                  >
                    {typeIcons[format]} {format}
                  </button>
                ))}
              </div>
              {errors.format && <span className="error-message">{errors.format}</span>}
            </div>
          </FormSection>

          {/* Section 2: Schedule & Dates */}
          <FormSection
            id="schedule"
            title="Schedule & Dates"
            subtitle="Important timeline for players and organizers"
            icon={<Calendar size={24} />}
          >
            <div className="schedule-col">
              <div className="schedule-card schedule-card--purple">
                <h4 className="schedule-title purple">Registration Period</h4>

                <div className="schedule-fields">
                  <div>
                    <label className="schedule-label">Registration Deadline <span className="required">*</span></label>
                    <input
                      type="date"
                      name="registrationDeadline"
                      value={formData.registrationDeadline}
                      onChange={handleInputChange}
                      className="schedule-input purple"
                    />
                    {errors.registrationDeadline && <span className="error-message">{errors.registrationDeadline}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="schedule-col">
              <div className="schedule-card schedule-card--pink">
                <h4 className="schedule-title pink">Event Duration</h4>

                <div className="schedule-fields">
                  <div>
                    <label className="schedule-label">Start Date <span className="required">*</span></label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="schedule-input pink"
                    />
                    {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                  </div>

                  <div>
                    <label className="schedule-label">End Date <span className="required">*</span></label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="schedule-input pink"
                    />
                    {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="schedule-note">
              <Info size={16} />
              <p>
                Ensure registration ends at least 24 hours before the tournament starts to
                allow for pairing generation.
              </p>
            </div>
          </FormSection>

          {/* Section 3: Players & Rules */}
          <FormSection
            id="players"
            title="Players & Rules"
            subtitle="Define participation limits and standards"
            icon={<Users size={24} />}
          >
            <div className="players-field half">
              <label className="players-label">Minimum Players <span className="required">*</span></label>
              <input
                type="number"
                name="minPlayer"
                value={formData.minPlayer}
                onChange={handleInputChange}
                min={2}
                className="players-input"
              />
              {errors.minPlayer && <span className="error-message">{errors.minPlayer}</span>}
            </div>

            <div className="players-field half">
              <label className="players-label">Maximum Players <span className="required">*</span></label>
              <input
                type="number"
                name="maxPlayer"
                value={formData.maxPlayer}
                onChange={handleInputChange}
                max={100}
                className="players-input"
              />
              {errors.maxPlayer && <span className="error-message">{errors.maxPlayer}</span>}
            </div>

            <div className="players-field full icon-left">
              <label className="players-label">Entry Fee</label>
              <span className="players-icon">
                <DollarSign size={20} />
              </span>
              <input
                type="number"
                name="entryFee"
                value={formData.entryFee}
                onChange={handleInputChange}
                min={0}
                className="players-input with-icon"
              />
              {errors.entryFee && <span className="error-message">{errors.entryFee}</span>}
            </div>

            <div className="players-field full icon-left">
              <label className="players-label">Prize Pool</label>
              <span className="players-icon">
                <DollarSign size={20} />
              </span>
              <input
                type="number"
                name="prizePool"
                value={formData.prizePool}
                onChange={handleInputChange}
                min={0}
                className="players-input with-icon"
              />
              {errors.prizePool && <span className="error-message">{errors.prizePool}</span>}
            </div>

            <div className="players-field full icon-left textarea">
              <label className="players-label">Tournament Rules & Regulations</label>
              <span className="players-icon textarea-icon">
                <FileText size={20} />
              </span>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={6}
                placeholder="Clearly state fair play policies, tie-break rules, and player responsibilities..."
                className="players-textarea with-icon"
              />
              {errors.notes && <span className="error-message">{errors.notes}</span>}
            </div>
          </FormSection>

        </form>
      </main>

      {/* Footer */}
      <footer className="tlc-footer">
        <div className="tlc-container tlc-footer-actions">
          <button type="button" className="btn cancel" onClick={() => navigate("/tournaments")}>Cancel</button>
          <button type="submit" className="btn primary" onClick={handleSubmit}>
            Save & Continue
          </button>
        </div>
      </footer>

    </div>
  );
}
=======
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

const BasicInfoStep = ({ data, update, formats }) => (
  <div>
    <div className="cw-form-row cols-2">
      <div className="cw-field">
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
      <div className="cw-field">
        <label className="cw-label">
          Hạng mục <span className="req">*</span>
        </label>
        <input
          className="cw-input"
          placeholder="VD: Open, U18, Nữ"
          value={data.categories}
          onChange={(e) => update({ categories: e.target.value })}
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
                className={`cw-format-btn ${data.format === f ? "active" : ""}`}
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

    <div className="cw-form-row cols-2">
      <div className="cw-field">
        <label className="cw-label">Quỹ thưởng ($)</label>
        <input
          className="cw-input"
          type="number"
          min={0}
          placeholder="10000"
          value={data.prizePool}
          onChange={(e) => update({ prizePool: e.target.value })}
        />
      </div>
      <div className="cw-field">
        <label className="cw-label">Phí tham gia ($)</label>
        <input
          className="cw-input"
          type="number"
          min={0}
          placeholder="50"
          value={data.entryFee}
          onChange={(e) => update({ entryFee: e.target.value })}
        />
      </div>
    </div>
  </div>
);

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
                <span className="label">Hạng mục</span>
                <span className="value">{data.categories || "Không có"}</span>
              </div>
              <div className="cw-review-row">
                <span className="label">Địa điểm</span>
                <span className="value">{data.location || "Chưa xác định"}</span>
              </div>
              <div className="cw-review-row">
                <span className="label">Quỹ thưởng</span>
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
>>>>>>> Dung
