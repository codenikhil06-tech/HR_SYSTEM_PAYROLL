import React from 'react';

export default function Placeholder({ title }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="empty muted">This page is currently being converted to React. Please check back later!</div>
    </div>
  );
}
