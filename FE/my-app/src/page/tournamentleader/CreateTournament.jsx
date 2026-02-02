import React, { useState } from 'react';
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
import FormSection from '../../component/FormSection';

const TOURNAMENT_TYPES = {
  ROUND_ROBIN: 'ROUND_ROBIN',
  KNOCKOUT: 'KNOCKOUT',
  HYBRID: 'HYBRID',
};

export default function CreateTournamentPage() {
  const [formData, setFormData] = useState({
    name: '',
    type: TOURNAMENT_TYPES.ROUND_ROBIN,
    minPlayers: 4,
    maxPlayers: 32,
    rules: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/ctms/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      const result = await response.json();
      console.log('Create result:', result);

      alert('Tournament created successfully!');
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Create tournament failed');
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
              <label>Tournament Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="tlc-field-full">
              <label>Tournament Type</label>
              <div className="tlc-type-group">
                {Object.values(TOURNAMENT_TYPES).map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`tlc-type-btn ${
                      formData.type === type ? `active ${type.toLowerCase()}` : ''
                    }`}
                    onClick={() =>
                      setFormData(prev => ({ ...prev, type }))
                    }
                  >
                    {typeIcons[type]} {type}
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
                <label className="schedule-label">Starts</label>
                <input
                    type="date"
                    name="registrationStart"
                    value={formData.registrationStart}
                    onChange={handleInputChange}
                    className="schedule-input purple"
                />
                </div>

                <div>
                <label className="schedule-label">Ends</label>
                <input
                    type="date"
                    name="registrationEnd"
                    value={formData.registrationEnd}
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
                    name="tournamentStart"
                    value={formData.tournamentStart}
                    onChange={handleInputChange}
                    className="schedule-input pink"
                />
                </div>

                <div>
                <label className="schedule-label">Ends</label>
                <input
                    type="date"
                    name="tournamentEnd"
                    value={formData.tournamentEnd}
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
            name="minPlayers"
            value={formData.minPlayers}
            onChange={handleInputChange}
            min={2}
            className="players-input"
            />
        </div>

        <div className="players-field half">
            <label className="players-label">Maximum Players</label>
            <input
            type="number"
            name="maxPlayers"
            value={formData.maxPlayers}
            onChange={handleInputChange}
            min={1}
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

        <div className="players-field full icon-left textarea">
            <label className="players-label">Tournament Rules & Regulations</label>
            <span className="players-icon textarea-icon">
            <FileText size={20} />
            </span>
            <textarea
            name="rules"
            value={formData.rules}
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
