import React from 'react';
import { useHR, ICONS } from '../store';

const Icon = ({ name, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: `<path d="${ICONS[name] || ICONS['x']}"/>` }}
  />
);

export default function Modal() {
  const { modalConfig, closeModal } = useHR();

  if (!modalConfig) return null;

  const { title, body, footer, size } = modalConfig;

  return (
    <div
      className="mback"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className={`modal ${size || ''}`}>
        <div className="mh">
          <h3>{title}</h3>
          <button className="ib" onClick={closeModal}>
            <Icon name="x" />
          </button>
        </div>
        <div className="mb">{body}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  );
}
