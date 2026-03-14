import React, { useEffect, useState } from "react";
import axios from "axios";
import { Filter } from "lucide-react";
import "../../assets/css/tournament-leader/FilterSection.css";

import { API_BASE } from "../../config/api";

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
    <div className="tlf-sidebar">
      <div className="tlf-header">
        <h3 className="tlf-title">
          <Filter size={18} />
          Bộ lọc
        </h3>
        <button className="tlf-reset-link" onClick={onReset}>
          Đặt lại
        </button>
      </div>

      <div className="tlf-body">
        {/* Status */}
        <div>
          <label className="tlf-section-label">Trạng thái</label>
          <div className="tlf-checkbox-group">
            {statuses.map((status) => (
              <label key={status} className="tlf-checkbox-item">
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

        <div className="tlf-divider" />

        {/* Format */}
        <div>
          <label className="tlf-section-label">Thể thức</label>
          <select
            className="tlf-select"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">Tất cả thể thức</option>
            {formats.map((f) => (
              <option key={f} value={f}>{getFormatLabel(f)}</option>
            ))}
          </select>
        </div>

        <div className="tlf-divider" />

      </div>
    </div>
  );
};

export default FilterSection;
