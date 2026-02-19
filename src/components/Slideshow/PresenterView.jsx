import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Maximize2, Settings, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Timer } from './Timer';
import { Clock } from './Clock';
import { TitleCard } from './TitleCard';
import { PortfolioSlide } from './PortfolioSlide';
import { EducationSlide } from './EducationSlide';
import ScriptSlide from '../slides/ScriptSlide';
import { formatMsToTimeCode } from '../../lib/buildSlidesFromShow';
import styles from './PresenterView.module.css';

/**
 * Hook for draggable border resizing
 */
function useDragResize(initialPct, direction = 'horizontal') {
  const [pct, setPct] = useState(initialPct);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = direction === 'vertical' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newPct;
      if (direction === 'vertical') {
        newPct = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        newPct = ((e.clientX - rect.left) / rect.width) * 100;
      }
      setPct(Math.min(85, Math.max(15, newPct)));
    };

    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [direction]);

  return { pct, containerRef, onMouseDown };
}

/**
 * PresenterView - Presenter mode for TattooNOW show slideshow
 *
 * Layout:
 * - Slide previews (current + next) top half
 * - Show overview (upcoming segments) bottom half
 * - Notes always pop out to a separate window
 * - Controls bar at bottom with timing + auto/manual toggle
 */
export function PresenterView({
  episodeData,
  currentSlideIndex,
  slides,
  nextSlide,
  previousSlide,
  toggleQR,
  toggleLowerThird,
  showQR,
  showLowerThird,
  portfolioLayout,
  togglePortfolioLayout,
  selectedImage,
  onSelectImage,
  showId,
  autoMode = false,
  toggleAutoMode,
  slideElapsedMs = 0,
  showElapsedMs = 0
}) {
  const hSplit = useDragResize(60, 'horizontal');
  const vSplit = useDragResize(55, 'vertical');
  const notesChannelRef = useRef(null);

  // Broadcast notes to popout window
  useEffect(() => {
    notesChannelRef.current = new BroadcastChannel('tattoonow-notes-sync');
    return () => {
      if (notesChannelRef.current) notesChannelRef.current.close();
    };
  }, []);

  // Send notes update whenever slide changes
  useEffect(() => {
    if (!notesChannelRef.current || !slides || slides.length === 0) return;
    const currentSlide = slides[currentSlideIndex];
    if (!currentSlide) return;

    notesChannelRef.current.postMessage({
      type: 'NOTES_UPDATE',
      payload: {
        presenterNotes: currentSlide.presenterNotes || currentSlide.notes || '',
        slideIndex: currentSlideIndex,
        totalSlides: slides.length,
        slideType: currentSlide.type,
        slideTitle: currentSlide.title || currentSlide.segment || '',
        talkingPoints: currentSlide.talkingPoints || [],
        episodeData: episodeData
      }
    });
  }, [currentSlideIndex, slides]);

  // Auto-open notes popout on mount
  useEffect(() => {
    openNotesPopout();
  }, []);

  if (!episodeData || !slides || slides.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>No Episode Data Loaded</h2>
          <p>Please load an episode to see presenter view.</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const nextSlideData = slides[currentSlideIndex + 1];

  // Timing for current slide
  const slideDurationMs = currentSlide.durationMs || 0;
  const slideOvertime = slideDurationMs > 0 && slideElapsedMs > slideDurationMs;
  const slideProgressPct = slideDurationMs > 0
    ? Math.min(100, (slideElapsedMs / slideDurationMs) * 100)
    : 0;

  function openNotesPopout() {
    const params = new URLSearchParams(window.location.search);
    const episodeId = params.get('episode') || params.get('id') || '1';
    const sid = showId || params.get('show');
    const notesUrl = sid
      ? `${import.meta.env.BASE_URL}notes?show=${sid}`
      : `${import.meta.env.BASE_URL}notes?episode=${episodeId}`;
    window.open(notesUrl, 'slideshow-notes', 'width=800,height=600');
  }

  return (
    <div className={styles.container} ref={vSplit.containerRef}>
      {/* Top: Slide Previews */}
      <div
        className={styles.previewRow}
        ref={hSplit.containerRef}
        style={{ height: `${vSplit.pct}%` }}
      >
        {/* Current Slide Preview */}
        <div className={styles.currentSlidePreview} style={{ flex: `0 0 ${hSplit.pct}%` }}>
          <div className={styles.previewLabel}>
            <span className={styles.labelDot} />
            Current Slide
            {slideDurationMs > 0 && (
              <span style={{
                marginLeft: '12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: slideOvertime ? '#ef4444' : '#888'
              }}>
                {formatMsToTimeCode(slideElapsedMs)} / {formatMsToTimeCode(slideDurationMs)}
              </span>
            )}
          </div>
          {/* Slide progress bar */}
          {slideDurationMs > 0 && (
            <div style={{
              height: '3px',
              background: '#333',
              borderRadius: '2px',
              margin: '0 8px 4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${slideProgressPct}%`,
                background: slideOvertime ? '#ef4444' : '#22c55e',
                transition: 'width 0.25s linear, background 0.3s',
              }} />
            </div>
          )}
          <div className={styles.slidePreviewContainer}>
            {renderSlidePreview(currentSlide, 'current', portfolioLayout, selectedImage, onSelectImage)}
          </div>
        </div>

        {/* Vertical drag handle between slides */}
        <div
          className={styles.dragHandleVertical}
          onMouseDown={hSplit.onMouseDown}
        />

        {/* Next Slide Preview */}
        <div className={styles.nextSlidePreview} style={{ flex: 1 }}>
          <div className={styles.previewLabel}>Next Slide</div>
          <div className={styles.slidePreviewContainer}>
            {nextSlideData ? (
              renderSlidePreview(nextSlideData, 'next', portfolioLayout, null, null)
            ) : (
              <div className={styles.endOfShow}>
                <p>End of Show</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal drag handle */}
      <div
        className={styles.dragHandleHorizontal}
        onMouseDown={vSplit.onMouseDown}
      />

      {/* Show Overview Panel — upcoming segments */}
      <div className={styles.notesPanel} style={{ flex: 1 }}>
        <div className={styles.notesHeader}>
          <div className={styles.notesTabs}>
            <span className={styles.notesTab} style={{ cursor: 'default', opacity: 1, borderBottom: '2px solid var(--accent, #f97316)' }}>
              Run of Show
            </span>
          </div>
          <div className={styles.notesHeaderRight}>
            <span className={styles.slideIndicator}>
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <button
              className={styles.popoutBtn}
              onClick={openNotesPopout}
              title="Pop out notes into separate window"
            >
              <Maximize2 size={14} />
              Notes
            </button>
          </div>
        </div>

        <ShowTimeline
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          slideElapsedMs={slideElapsedMs}
          showElapsedMs={showElapsedMs}
        />
      </div>

      {/* Bottom: Timer, Clock, Controls */}
      <div className={styles.controlsBar}>
        <Timer targetDuration={parseInt(episodeData.DURATION) || 60} />
        <Clock />

        {/* Show elapsed */}
        {showElapsedMs > 0 && (
          <div className={styles.slideCounter}>
            <div className={styles.counterLabel}>Show</div>
            <div className={styles.counterValue} style={{ fontFamily: 'monospace' }}>
              {formatMsToTimeCode(showElapsedMs)}
            </div>
          </div>
        )}

        <div className={styles.slideCounter}>
          <div className={styles.counterLabel}>Slide</div>
          <div className={styles.counterValue}>
            {currentSlideIndex + 1} / {slides.length}
          </div>
        </div>

        {/* Auto/Manual toggle */}
        {toggleAutoMode && (
          <button
            onClick={toggleAutoMode}
            className={`${styles.toggleButton} ${autoMode ? styles.active : ''}`}
            title="Toggle Auto/Manual navigation (A)"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {autoMode ? <Pause size={14} /> : <Play size={14} />}
            {autoMode ? 'Auto' : 'Manual'}
          </button>
        )}

        <div className={styles.navControls}>
          <button
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
            className={styles.navButton}
            title="Previous Slide"
          >
            <ChevronLeft size={20} />
            <span>Prev</span>
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className={styles.navButton}
            title="Next Slide"
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className={styles.overlayToggles}>
          <button
            onClick={toggleQR}
            className={`${styles.toggleButton} ${showQR ? styles.active : ''}`}
            title="Toggle QR Code (Q)"
          >
            QR Code
          </button>
          <button
            onClick={toggleLowerThird}
            className={`${styles.toggleButton} ${showLowerThird ? styles.active : ''}`}
            title="Toggle Lower-Third (L)"
          >
            Lower-Third
          </button>
        </div>

        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            const sid = showId || params.get('show');
            const url = sid
              ? `${import.meta.env.BASE_URL}slideshow?show=${sid}`
              : `${import.meta.env.BASE_URL}slideshow?episode=${params.get('episode') || params.get('id') || '1'}`;
            window.open(url, 'slideshow-audience', 'width=1920,height=1080');
          }}
          className={styles.navButton}
          title="Open slides window for screen sharing"
          style={{ marginLeft: '8px' }}
        >
          <ExternalLink size={16} />
          <span>Open Slides</span>
        </button>

        <Link
          to="/admin"
          className={styles.navButton}
          title="Admin"
          style={{ marginLeft: 'auto', opacity: 0.35 }}
        >
          <Settings size={14} />
        </Link>
      </div>
    </div>
  );
}

/**
 * ShowTimeline — Proportional timeline visualization.
 *
 * Each slide is a block whose width is proportional to its duration
 * relative to the total show duration. A playhead shows current position.
 *
 * Layout (top to bottom):
 *   - Segment labels (grouped by rundownLabel)
 *   - Timeline bar (colored blocks per slide type)
 *   - Time marks
 *   - Details row for current slide
 */
function ShowTimeline({ slides, currentSlideIndex, slideElapsedMs = 0, showElapsedMs = 0 }) {
  const containerRef = useRef(null);

  const TYPE_COLORS = {
    title: '#f97316',
    portfolio: '#3b82f6',
    education: '#10b981',
    script: '#a855f7',
  };

  // Total show duration from sum of all slide durations
  const totalMs = slides.reduce((sum, s) => sum + (s.durationMs || 0), 0);

  // Cumulative start time for each slide
  const cumulativeMs = [];
  let runningMs = 0;
  for (const slide of slides) {
    cumulativeMs.push(runningMs);
    runningMs += slide.durationMs || 0;
  }

  // Playhead position as percentage
  const playheadMs = totalMs > 0
    ? cumulativeMs[currentSlideIndex] + slideElapsedMs
    : 0;
  const playheadPct = totalMs > 0 ? (playheadMs / totalMs) * 100 : 0;

  // Group consecutive slides with the same rundownLabel into segments
  const segments = [];
  for (let i = 0; i < slides.length; i++) {
    const label = slides[i].rundownLabel || slides[i].segment || slides[i].title || '';
    const last = segments[segments.length - 1];
    if (last && last.label === label) {
      last.endIndex = i;
      last.durationMs += slides[i].durationMs || 0;
    } else {
      segments.push({
        label,
        startIndex: i,
        endIndex: i,
        startMs: cumulativeMs[i],
        durationMs: slides[i].durationMs || 0,
      });
    }
  }

  // Time marks at regular intervals
  const timeMarks = [];
  if (totalMs > 0) {
    // Pick a nice interval: 5min for shows > 30min, 2min for > 10min, 1min otherwise
    const intervalMs = totalMs > 30 * 60000 ? 5 * 60000
      : totalMs > 10 * 60000 ? 2 * 60000
      : 60000;
    for (let t = 0; t <= totalMs; t += intervalMs) {
      timeMarks.push(t);
    }
  }

  // Current slide info
  const current = slides[currentSlideIndex];
  const currentLabel = current?.title || current?.segment || current?.artistName || '';
  const currentDurationMs = current?.durationMs || 0;

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 16px',
        overflow: 'hidden',
        gap: '6px',
      }}
    >
      {/* Segment labels row */}
      <div style={{ display: 'flex', height: '18px', position: 'relative' }}>
        {segments.map((seg, i) => {
          const widthPct = totalMs > 0 ? (seg.durationMs / totalMs) * 100 : 0;
          if (widthPct < 2) return null; // too small to label
          return (
            <div
              key={i}
              style={{
                width: `${widthPct}%`,
                fontSize: '10px',
                color: '#888',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingLeft: '2px',
                borderLeft: i > 0 ? '1px solid #333' : 'none',
                flexShrink: 0,
              }}
              title={`${seg.label} (${formatMsToTimeCode(seg.durationMs)})`}
            >
              {seg.label}
            </div>
          );
        })}
      </div>

      {/* Timeline bar */}
      <div style={{ position: 'relative', height: '32px', borderRadius: '4px', overflow: 'hidden', background: '#1a1a1a' }}>
        {/* Slide blocks */}
        <div style={{ display: 'flex', height: '100%' }}>
          {slides.map((slide, i) => {
            const widthPct = totalMs > 0 ? ((slide.durationMs || 0) / totalMs) * 100 : 0;
            const isCurrent = i === currentSlideIndex;
            const isPast = i < currentSlideIndex;
            const baseColor = TYPE_COLORS[slide.type] || '#555';

            return (
              <div
                key={i}
                style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: baseColor,
                  opacity: isPast ? 0.3 : isCurrent ? 1 : 0.6,
                  borderRight: '1px solid #0a0a0a',
                  transition: 'opacity 0.3s',
                  position: 'relative',
                  minWidth: widthPct > 0 ? '1px' : '0',
                }}
                title={`${slide.title || slide.segment || slide.type} — ${formatMsToTimeCode(slide.durationMs || 0)}`}
              >
                {/* Current slide fill based on elapsed */}
                {isCurrent && currentDurationMs > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${Math.min(100, (slideElapsedMs / currentDurationMs) * 100)}%`,
                    background: 'rgba(255, 255, 255, 0.25)',
                    transition: 'width 0.25s linear',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Playhead */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${playheadPct}%`,
          width: '2px',
          background: '#fff',
          boxShadow: '0 0 6px rgba(255,255,255,0.5)',
          transition: 'left 0.25s linear',
          zIndex: 2,
        }} />
      </div>

      {/* Time marks */}
      <div style={{ position: 'relative', height: '14px' }}>
        {timeMarks.map((t, i) => {
          const pct = totalMs > 0 ? (t / totalMs) * 100 : 0;
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#555',
              }}
            >
              {formatMsToTimeCode(t)}
            </span>
          );
        })}
      </div>

      {/* Current slide detail row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 4px',
        borderTop: '1px solid #222',
        minHeight: '36px',
      }}>
        <span style={{
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#666',
        }}>
          {currentSlideIndex + 1}/{slides.length}
        </span>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '3px',
          fontSize: '11px',
          background: (TYPE_COLORS[current?.type] || '#555') + '33',
          color: TYPE_COLORS[current?.type] || '#888',
        }}>
          {current?.type}
        </span>
        <span style={{
          flex: 1,
          fontSize: '13px',
          color: '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {currentLabel}
        </span>
        {currentDurationMs > 0 && (
          <span style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            color: slideElapsedMs > currentDurationMs ? '#ef4444' : '#888',
          }}>
            {formatMsToTimeCode(slideElapsedMs)} / {formatMsToTimeCode(currentDurationMs)}
          </span>
        )}
        {totalMs > 0 && (
          <span style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#555',
          }}>
            {formatMsToTimeCode(playheadMs)} / {formatMsToTimeCode(totalMs)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Render slide preview (scaled down for presenter view)
 */
function renderSlidePreview(slide, size = 'current', portfolioLayout = 'grid', selectedImage = null, onSelectImage = null) {
  const scale = size === 'current' ? 0.5 : 0.35;
  const interactive = size === 'current';

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: '1920px',
        height: '1080px',
        pointerEvents: interactive ? 'auto' : 'none'
      }}
    >
      {renderSlide(slide, portfolioLayout, selectedImage, onSelectImage)}
    </div>
  );
}

function renderSlide(slide, portfolioLayout = 'grid', selectedImage = null, onSelectImage = null) {
  switch (slide.type) {
    case 'title':
      return (
        <TitleCard
          title={slide.title}
          episodeNumber={slide.episodeNumber}
          airDate={slide.airDate}
          host={slide.host}
        />
      );

    case 'portfolio':
      return (
        <PortfolioSlide
          artistName={slide.artistName}
          artistStyle={slide.artistStyle}
          artistLocation={slide.artistLocation}
          artistInstagram={slide.artistInstagram}
          images={slide.images}
          range={slide.range}
          autoAdvance={slide.autoAdvance || false}
          autoAdvanceMs={slide.autoAdvanceMs || 20000}
          layout={portfolioLayout}
          selectedImage={selectedImage}
          onSelectImage={onSelectImage}
        />
      );

    case 'education':
      return (
        <EducationSlide
          slideNumber={slide.slideNumber}
          title={slide.title}
          visual={slide.visual}
          keyPoints={slide.keyPoints}
          stats={slide.stats}
          layout={slide.layout}
        />
      );

    case 'script':
      return (
        <ScriptSlide
          script={{
            segment: slide.segment,
            timeCode: slide.timeCode,
            title: slide.title,
            type: slide.scriptType,
            talkingPoints: slide.talkingPoints,
            notes: slide.notes,
            cue: slide.cue
          }}
        />
      );

    default:
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#666'
          }}
        >
          <div style={{ fontSize: '24px' }}>Unknown slide type: {slide.type}</div>
        </div>
      );
  }
}
