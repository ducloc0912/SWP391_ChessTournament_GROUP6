import React, { useEffect, useState } from "react";
import axios from "axios";
import { Filter } from "lucide-react";
import "../../assets/css/tournament-leader/FilterSection.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/ctms";

const STATUS_LABELS = {
  Pending: "Chờ duyệt",
  Rejected: "Bị từ chối",
  Delayed: "Hoãn",
  Ongoing: "Đang diễn ra",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const FORMAT_LABELS = {
  RoundRobin: "Vòng tròn",
  KnockOut: "Loại trực tiếp",
  Hybrid: "Kết hợp",
};

const getStatusLabel = (s) => STATUS_LABELS[s] || s;
const getFormatLabel = (f) => FORMAT_LABELS[f] || f;

const FilterSection = ({
  statusFilter,
  typeFilter,
  onStatusChange,
  onTypeChange,
  onReset,
}) => {
  const [statuses, setStatuses] = useState([]);
  const [formats, setFormats] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/tournaments?action=filters`, { withCredentials: true })
      .then((res) => {
        setStatuses(res.data.statuses || []);
        setFormats(res.data.formats || []);
      })
      .catch((err) => console.error("Load filters error:", err));
  }, []);

  return (
    <div className="filter-sidebar">
      <div className="filter-sidebar-header">
        <h3 className="filter-sidebar-title">
          <Filter size={18} />
          Bộ lọc
        </h3>
        <button className="filter-reset-link" onClick={onReset}>
          Đặt lại
        </button>
      </div>

      <div className="filter-sidebar-body">
        {/* Status */}
        <div>
          <label className="filter-section-label">Trạng thái</label>
          <div className="filter-checkbox-group">
            {statuses.map((status) => (
              <label key={status} className="filter-checkbox-item">
                <input
                  type="checkbox"
                  checked={statusFilter === status}
                  onChange={() =>
                    onStatusChange(statusFilter === status ? "" : status)
                  }
                />
                <span>{getStatusLabel(status)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-divider" />

        {/* Format */}
        <div>
          <label className="filter-section-label">Thể thức</label>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">Tất cả thể thức</option>
            {formats.map((f) => (
              <option key={f} value={f}>{getFormatLabel(f)}</option>
            ))}
          </select>
        </div>

        <div className="filter-divider" />

      </div>
    </div>
  );
};

export default FilterSection;
