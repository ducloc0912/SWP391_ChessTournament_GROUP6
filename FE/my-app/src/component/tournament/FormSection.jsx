import React from 'react';
import '../../assets/css/tournament-leader/FormSection.css';

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

export default FormSection;