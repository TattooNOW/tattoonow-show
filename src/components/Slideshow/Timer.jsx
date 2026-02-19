import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

/**
 * Timer - Elapsed/Remaining time counter for show presenter view
 * Features:
 * - Counts up (elapsed time)
 * - Counts down (remaining time based on target duration)
 * - Color-coded warnings (green, yellow, red)
 * - Start, Pause, Reset controls
 */
export function Timer({ targetDuration = 40 }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const targetSeconds = targetDuration * 60;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  // Auto-tick when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
  }, []);

  const toggle = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Format seconds as MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Determine color based on remaining time
  const getTimerColor = () => {
    const percentRemaining = (remainingSeconds / targetSeconds) * 100;

    if (percentRemaining > 15) {
      return '#4ade80'; // Green (on track)
    } else if (percentRemaining > 0) {
      return '#facc15'; // Yellow (warning - 5 min left)
    } else {
      return '#ef4444'; // Red (overtime)
    }
  };

  const timerColor = getTimerColor();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '12px 20px',
        borderRadius: '12px',
        border: `2px solid ${timerColor}`
      }}
    >
      {/* Elapsed Time */}
      <div style={{ textAlign: 'left' }}>
        <div
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '4px'
          }}
        >
          Elapsed
        </div>
        <div
          style={{
            fontSize: '28px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          {formatTime(elapsedSeconds)}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '50px',
          background: 'rgba(255, 255, 255, 0.2)'
        }}
      />

      {/* Remaining Time */}
      <div style={{ textAlign: 'left' }}>
        <div
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '4px'
          }}
        >
          Remaining
        </div>
        <div
          style={{
            fontSize: '28px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: timerColor
          }}
        >
          {formatTime(remainingSeconds)}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
        {/* Play/Pause Button */}
        <button
          onClick={toggle}
          style={{
            background: isRunning ? '#6366f1' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1';
          }}
          title={isRunning ? 'Pause (T)' : 'Start (T)'}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* Reset Button */}
        <button
          onClick={reset}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          title="Reset Timer (R)"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
}
