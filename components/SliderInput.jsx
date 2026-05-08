import React from 'react';

const SliderInput = ({ label, icon, value, onChange, min = 0, max = 100, step = 1, unit = "" }) => {
  return (
    <div style={{ marginBottom: '20px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>
          {icon} {label}
        </label>
        <span style={{ fontSize: '14px', color: '#7EE7C1', fontWeight: 'bold' }}>
          {value}{unit}
        </span>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: '100%',
          cursor: 'pointer',
          accentColor: '#7EE7C1', // This gives it that nice eco-green color
        }}
      />
    </div>
  );
};

export default SliderInput;