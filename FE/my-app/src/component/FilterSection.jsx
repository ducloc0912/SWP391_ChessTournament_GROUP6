import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";

/**
 * Các giá trị filter tạm thời
 */
const TOURNAMENT_STATUS = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
];

const TOURNAMENT_TYPE = [
  "KNOCKOUT",
  "ROUND_ROBIN",
  "HYBRID",
];

const FilterSection = ({
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onReset,
}) => {
  const navigate = useNavigate();

  const onCreate = () => {
    navigate("/tournaments/create");
  };

  return (
    <div className="filter-card">
      <div className="filter-container">

        {/* Search */}
        <div className="filter-search">
          <Search className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search tournament..."
            className="filter-search-input"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="filter-controls">
          <div className="filter-label">
            <Filter size={16} />
            <span>Filters</span>
          </div>

          <select
            className="filter-select filter-select-status"
            defaultValue=""
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            {TOURNAMENT_STATUS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="filter-select filter-select-type"
            defaultValue=""
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">All Types</option>
            {TOURNAMENT_TYPE.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button className="filter-reset" onClick={onReset}>
            Reset
          </button>
        </div>

        {/* Create button */}
        <button className="filter-create-btn" onClick={onCreate}>
          <Plus size={18} />
          Create Tournament
        </button>

      </div>
    </div>
  );
};

export default FilterSection;
