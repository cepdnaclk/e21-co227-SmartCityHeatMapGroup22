// src/App.jsx
import React from 'react';
import Heatmap from './components/Heatmap';

export default function App() {
  return (
    <div style={{ padding: 18 }}>
      <Heatmap apiUrl="/api/zones" refreshInterval={30000} maxVisitors={30} width={900} height={525} />
    </div>
  );
}
