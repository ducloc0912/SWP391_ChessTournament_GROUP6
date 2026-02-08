import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import {
  Trophy, 
  Calendar, 
  Users, 
  ChevronRight, 
  DollarSign, 
  FileText,
  Info,
  Zap,
  RotateCw,
  Layers
} from 'lucide-react';
import { FormSection } from '../../component/tournament/FormSection';
import '../../assets/css/tournament-leader.css';

const TOURNAMENT_FORMAT = {
  ROUND_ROBIN: 'RoundRobin',
  KNOCKOUT: 'KnockOut',
  HYBRID: 'Hybrid',
};

export default function CreateTournamentPage() {
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
  };

  return (
    <div className="tlc-page">

      {/* Header */}
      <header className="tlc-header">
        <div className="tlc-container">
          <nav className="tlc-breadcrumb">
            <span>Tournament Management</span>
            <ChevronRight size={14} />
            <span className="active">Create New Tournament</span>
          </nav>

          <h1 className="tlc-title">Create New Tournament</h1>
        </div>
      </header>

      {/* Main */}
      <main className="tlc-main tlc-container">
        <form className="tlc-form" onSubmit={handleSubmit}>

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
