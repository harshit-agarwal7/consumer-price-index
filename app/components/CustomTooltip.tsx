'use client';

import { CustomTooltipProps } from '../types';
import { getCategoryDisplayName } from '../utils';

export const CustomTooltip = ({ active, payload, label, small = false }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: small ? '8px' : '12px',
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
        padding: small ? '8px' : '12px'
      }}
    >
      <p style={{
        color: '#e2e8f0',
        marginBottom: small ? '4px' : '8px',
        fontWeight: 600,
        fontSize: small ? '11px' : '14px'
      }}>
        {label}
      </p>
      {sortedPayload.map((entry, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: small ? '1px 0' : '2px 0'
          }}
        >
          <span
            style={{
              width: small ? '8px' : '10px',
              height: small ? '8px' : '10px',
              borderRadius: '50%',
              backgroundColor: entry.color,
              flexShrink: 0
            }}
          />
          <span style={{
            color: '#cbd5e1',
            fontSize: small ? '10px' : '12px',
            flex: 1
          }}>
            {getCategoryDisplayName(entry.name)}
          </span>
          <span style={{
            color: '#94a3b8',
            fontSize: small ? '10px' : '12px',
            fontWeight: 500
          }}>
            {entry.value?.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
};
