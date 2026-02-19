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

        <ShowOverview
          slides={slides}
          currentSlideIndex={currentSlideIndex}
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
 * Show Overview — scrollable list of all slides with current highlighted.
 * Shows type, label, target time, and duration for each.
 */
function ShowOverview({ slides, currentSlideIndex }) {
  const containerRef = useRef(null);
  const currentRowRef = useRef(null);

  // Auto-scroll to keep current slide visible
  useEffect(() => {
    if (currentRowRef.current && containerRef.current) {
      currentRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSlideIndex]);

  // Group slides by rundownLabel to show segment boundaries
  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        fontSize: '13px',
      }}
    >
      {slides.map((slide, i) => {
        const isCurrent = i === currentSlideIndex;
        const isPast = i < currentSlideIndex;
        const isSegmentStart = slide.targetTimeCode && slide.targetTimeCode !== '';

        return (
          <div
            key={i}
            ref={isCurrent ? currentRowRef : null}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: isCurrent ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
              borderLeft: isCurrent ? '3px solid #f97316' : isSegmentStart ? '3px solid #333' : '3px solid transparent',
              opacity: isPast ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            {/* Slide number */}
            <span style={{
              width: '28px',
              textAlign: 'right',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: isCurrent ? '#f97316' : '#666',
              flexShrink: 0,
            }}>
              {i + 1}
            </span>

            {/* Target time */}
            <span style={{
              width: '40px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: isSegmentStart ? '#aaa' : '#444',
              flexShrink: 0,
            }}>
              {slide.targetTimeCode || ''}
            </span>

            {/* Type badge */}
            <span style={{
              display: 'inline-block',
              width: '60px',
              fontSize: '10px',
              textAlign: 'center',
              padding: '1px 4px',
              borderRadius: '3px',
              flexShrink: 0,
              background: {
                title: 'rgba(249, 115, 22, 0.2)',
                portfolio: 'rgba(59, 130, 246, 0.2)',
                education: 'rgba(16, 185, 129, 0.2)',
                script: 'rgba(168, 85, 247, 0.2)',
              }[slide.type] || 'rgba(255,255,255,0.05)',
              color: {
                title: '#f97316',
                portfolio: '#60a5fa',
                education: '#34d399',
                script: '#c084fc',
              }[slide.type] || '#888',
            }}>
              {slide.type}
            </span>

            {/* Label */}
            <span style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: isCurrent ? '#fff' : '#ccc',
            }}>
              {slide.title || slide.segment || slide.artistName || slide.rundownLabel || ''}
            </span>

            {/* Duration */}
            {slide.durationMs > 0 && (
              <span style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#666',
                flexShrink: 0,
              }}>
                {formatMsToTimeCode(slide.durationMs)}
              </span>
            )}
          </div>
        );
      })}
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
