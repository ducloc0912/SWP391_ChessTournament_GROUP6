import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import {
  Trophy, 
  Calendar, 
  Users, 
  ChevronRight, 
  MapPin, 
  DollarSign, 
  FileText,
  Info,
  Zap,
  RotateCw,
  Layers,
  MapPinned
} from 'lucide-react';

const TOURNAMENT_FORMAT = {
  ROUND_ROBIN: 'RoundRobin',
  KNOCKOUT: 'KnockOut',
  HYBRID: 'Hybrid',
};

export function FormSection({
  id,
  title,
  subtitle,
  icon,
  gradientClass,
  children
}) {
  return (
    <section id={id} className="tl-form-section">
      <div className="tl-form-section-header">
        <div className={`tl-form-section-icon ${gradientClass}`}>
          {icon}
        </div>

        <div>
          <h3 className="tl-form-section-title">{title}</h3>
          {subtitle && (
            <p className="tl-form-section-subtitle">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="tl-form-section-body">
        {children}
      </div>
    </section>
  );
}

export default function UpdateTournamentPage() {
  const { id } = useParams();
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

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    axios
      .get(`http://localhost:8080/ctms/api/tournaments?id=${id}`)
      .then(res => {
        const data = res.data;
        setFormData({
          ...data,
          registrationDeadline: data.registrationDeadline
            ? data.registrationDeadline.slice(0, 10)
            : "",
          startDate: data.startDate
            ? data.startDate.slice(0, 10)
            : "",
          endDate: data.endDate
            ? data.endDate.slice(0, 10)
            : ""
        });
      })
      .catch(err => console.error(err));
  }, [id]);

  /* ================= HANDLERS ================= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      notes: formData.notes
    };

    try {
      await axios.put(
        `http://localhost:8080/ctms/api/tournaments?id=${id}`,
        payload
      );
      alert("Update tournament thành công!");
      navigate("/tournaments");
    } catch (err) {
        console.error(err);
        alert("Update thất bại!");
        }
  };


  const typeIcons = {
    ROUND_ROBIN: <RotateCw size={16} />,
    KNOCKOUT: <Zap size={16} />,
    HYBRID: <Layers size={16} />,
  };



  return (
    <div className="tlc-page">

      {/* Header */}
      <header className="tlc-header">
        <div className="tlc-container">
          <nav className="tlc-breadcrumb">
            <span>Tournament Management</span>
            <ChevronRight size={14} />
            <span className="active">Update Tournament</span>
          </nav>

          <h1 className="tlc-title">Update Tournament</h1>
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
              <label>Tournament Name</label>
              <input
                name="tournamentName"
                value={formData.tournamentName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="tlc-field-half">
              <label>Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="tlc-field-half">
              <label>Categories</label>
              <input
                name="categories"
                value={formData.categories}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="tlc-field-half">
              <label>Description</label>
              <input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="tlc-field-full">
              <label>Tournament Type</label>
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
                  <label className="schedule-label">Ends</label>
                  <input
                      type="date"
                      name="registrationDeadline"
                      value={formData.registrationDeadline}
                      onChange={handleInputChange}
                      className="schedule-input purple"
                  />
                  </div>
              </div>
            </div>
          </div>
        <div className="schedule-col">
            <div className="schedule-card schedule-card--pink">
            <h4 className="schedule-title pink">Event Duration</h4>

            <div className="schedule-fields">
                <div>
                <label className="schedule-label">Starts</label>
                <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="schedule-input pink"
                />
                </div>

                <div>
                <label className="schedule-label">Ends</label>
                <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="schedule-input pink"
                />
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
            <label className="players-label">Minimum Players</label>
            <input
            type="number"
            name="minPlayer"
            value={formData.minPlayer}
            onChange={handleInputChange}
            min={2}
            className="players-input"
            />
        </div>

        <div className="players-field half">
            <label className="players-label">Maximum Players</label>
            <input
            type="number"
            name="maxPlayer"
            value={formData.maxPlayer}
            onChange={handleInputChange}
            max={100}
            className="players-input"
            />
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
        </div>
        </FormSection>


        </form>
      </main>

      {/* Footer */}
      <footer className="tlc-footer">
        <div className="tlc-container tlc-footer-actions">
          <button type="button" className="btn cancel">Cancel</button>
          <button type="submit" className="btn primary" onClick={handleSubmit}>
            Save & Continue
          </button>
        </div>
      </footer>

    </div>
  );
}