import React, { useState, useEffect } from 'react';
import { EpisodeTeleprompter } from '@/components/Slideshow/EpisodeTeleprompter';

/**
 * NotesPopout - Standalone popout window for presenter notes + teleprompter.
 * Listens to BroadcastChannel 'tattoonow-notes-sync' for slide updates
 * from the main PresenterView.
 */
export function NotesPopout() {
  const [mode, setMode] = useState('notes'); // 'notes' or 'script'
  const [slideData, setSlideData] = useState({
    presenterNotes: 'Waiting for presenter view...',
    slideIndex: 0,
    totalSlides: 0,
    slideType: '',
    slideTitle: '',
    talkingPoints: [],
    episodeData: null
  });

  useEffect(() => {
    const channel = new BroadcastChannel('tattoonow-notes-sync');
    channel.onmessage = (event) => {
      if (event.data?.type === 'NOTES_UPDATE') {
        setSlideData(event.data.payload);
      }
    };
    // Tell the presenter we're ready so it sends us the current state
    channel.postMessage({ type: 'NOTES_READY' });
    return () => channel.close();
  }, []);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={tabsStyle}>
          <button
            style={mode === 'notes' ? activeTabStyle : tabStyle}
            onClick={() => setMode('notes')}
          >
            Notes
          </button>
          <button
            style={mode === 'script' ? activeTabStyle : tabStyle}
            onClick={() => setMode('script')}
          >
            Script
          </button>
        </div>
        <div style={headerRightStyle}>
          {slideData.slideTitle && (
            <span style={slideTitleStyle}>{slideData.slideTitle}</span>
          )}
          <span style={slideIndicatorStyle}>
            {slideData.totalSlides > 0
              ? `Slide ${slideData.slideIndex + 1} of ${slideData.totalSlides}`
              : 'No slides'}
          </span>
        </div>
      </div>

      {/* Content */}
      {mode === 'notes' ? (
        <div style={notesContentStyle}>
          {slideData.talkingPoints && slideData.talkingPoints.length > 0 && (
            <div style={talkingPointsStyle}>
              {slideData.talkingPoints.map((point, i) => (
                <div key={i} style={talkingPointStyle}>
                  <span style={bulletStyle} />
                  {point}
                </div>
              ))}
            </div>
          )}
          <p style={notesTextStyle}>
            {slideData.presenterNotes || 'No presenter notes for this slide.'}
          </p>
        </div>
      ) : (
        <div style={scriptContainerStyle}>
          <EpisodeTeleprompter
            episodeData={slideData.episodeData}
            currentSlideIndex={slideData.slideIndex}
          />
        </div>
      )}
    </div>
  );
}

// Inline styles for standalone popout (no CSS module dependency)
const containerStyle = {
  width: '100vw',
  height: '100vh',
  background: '#0a0a0a',
  color: '#fafafa',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  overflow: 'hidden'
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  background: 'rgba(234, 147, 32, 0.1)',
  borderBottom: '1px solid rgba(234, 147, 32, 0.2)',
  flexShrink: 0
};

const tabsStyle = {
  display: 'flex',
  gap: 0
};

const tabStyle = {
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#9ca3af',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer'
};

const activeTabStyle = {
  ...tabStyle,
  color: '#EA9320',
  borderBottomColor: '#EA9320'
};

const headerRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const slideTitleStyle = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#EA9320'
};

const slideIndicatorStyle = {
  fontSize: '14px',
  color: '#9ca3af',
  fontWeight: 500
};

const notesContentStyle = {
  flex: 1,
  padding: '24px',
  overflowY: 'auto',
  fontSize: '22px',
  lineHeight: 1.6
};

const talkingPointsStyle = {
  marginBottom: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const talkingPointStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  fontSize: '20px',
  lineHeight: 1.5
};

const bulletStyle = {
  flexShrink: 0,
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#EA9320',
  marginTop: '10px',
  display: 'inline-block'
};

const notesTextStyle = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  color: '#d1d5db'
};

const scriptContainerStyle = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};
