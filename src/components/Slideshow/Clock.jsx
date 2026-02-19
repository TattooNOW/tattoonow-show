import { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

/**
 * Clock - Current wall time display
 * Updates every second
 * Shows time in 12-hour format (e.g., "2:45 PM")
 */
export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '12px 20px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <ClockIcon size={24} color="#9ca3af" />
      <div>
        <div
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '2px'
          }}
        >
          Current Time
        </div>
        <div
          style={{
            fontSize: '24px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
