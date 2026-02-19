import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Timer } from './Timer';
import { Clock } from './Clock';
import { TitleCard } from './TitleCard';
import { PortfolioSlide } from './PortfolioSlide';
import { EducationSlide } from './EducationSlide';
import ScriptSlide from '../slides/ScriptSlide';
import { Teleprompter } from './Teleprompter';
import styles from './PresenterView.module.css';

/**
 * Hook for draggable border resizing
 * Returns percentage value and mouse event handlers
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
      // Clamp between 15% and 85%
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
 * Displays:
 * - Current slide preview (left, 60%)
 * - Next slide preview (right, 40%)
 * - Presenter notes panel (full width below previews)
 * - Timer, Clock, Slide Counter, Navigation Controls (bottom toolbar)
 *
 * This view is for the host's monitor only (not visible in OBS)
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
  showLowerThird
}) {
  // Hooks must be called unconditionally
  const hSplit = useDragResize(60, 'horizontal');
  const vSplit = useDragResize(50, 'vertical');
  const [viewMode, setViewMode] = useState('presenter'); // 'presenter' or 'teleprompter'

  if (viewMode === 'teleprompter') {
    return (
      <div className={styles.container}>
        <div className={styles.modeTabs}>
          <button className={styles.modeTab} onClick={() => setViewMode('presenter')}>Presenter</button>
          <button className={`${styles.modeTab} ${styles.modeTabActive}`}>Teleprompter</button>
        </div>
        <Teleprompter />
      </div>
    );
  }

  if (!episodeData || !slides || slides.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.modeTabs}>
          <button className={`${styles.modeTab} ${styles.modeTabActive}`}>Presenter</button>
          <button className={styles.modeTab} onClick={() => setViewMode('teleprompter')}>Teleprompter</button>
        </div>
        <div className={styles.emptyState}>
          <h2>No Episode Data Loaded</h2>
          <p>Please load an episode to see presenter view.</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const nextSlideData = slides[currentSlideIndex + 1];
  const presenterNotes =
    currentSlide.presenterNotes ||
    currentSlide.notes ||
    'No presenter notes for this slide.';

  return (
    <div className={styles.container} ref={vSplit.containerRef}>
      {/* Mode Tabs */}
      <div className={styles.modeTabs}>
        <button className={`${styles.modeTab} ${styles.modeTabActive}`}>Presenter</button>
        <button className={styles.modeTab} onClick={() => setViewMode('teleprompter')}>Teleprompter</button>
      </div>
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
          </div>
          <div className={styles.slidePreviewContainer}>
            {renderSlidePreview(currentSlide, 'current')}
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
              renderSlidePreview(nextSlideData, 'next')
            ) : (
              <div className={styles.endOfShow}>
                <p>End of Show</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal drag handle between previews and notes */}
      <div
        className={styles.dragHandleHorizontal}
        onMouseDown={vSplit.onMouseDown}
      />

      {/* Middle: Presenter Notes */}
      <div className={styles.notesPanel} style={{ flex: 1 }}>
        <div className={styles.notesHeader}>
          <h3>Presenter Notes</h3>
          <span className={styles.slideIndicator}>
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
        </div>
        <div className={styles.notesContent}>
          <p>{presenterNotes}</p>
        </div>
      </div>

      {/* Bottom: Timer, Clock, Controls */}
      <div className={styles.controlsBar}>
        {/* Timer */}
        <Timer targetDuration={parseInt(episodeData.DURATION) || 40} />

        {/* Clock */}
        <Clock />

        {/* Slide Counter */}
        <div className={styles.slideCounter}>
          <div className={styles.counterLabel}>Slide</div>
          <div className={styles.counterValue}>
            {currentSlideIndex + 1} / {slides.length}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className={styles.navControls}>
          <button
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
            className={styles.navButton}
            title="Previous Slide (← or PgUp)"
          >
            <ChevronLeft size={20} />
            <span>Prev</span>
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className={styles.navButton}
            title="Next Slide (→ or PgDn)"
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Overlay Toggles */}
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

        {/* Launch Audience View */}
        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            const episodeId = params.get('episode') || params.get('id') || '1';
            window.open(
              `${import.meta.env.BASE_URL}slideshow?episode=${episodeId}`,
              'slideshow-audience',
              'width=1920,height=1080'
            );
          }}
          className={styles.navButton}
          title="Open slides window for screen sharing"
          style={{ marginLeft: '8px' }}
        >
          <ExternalLink size={16} />
          <span>Open Slides</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Render slide preview (scaled down for presenter view)
 * Current slide is interactive (for gallery clicking etc.)
 * Next slide preview is non-interactive.
 */
function renderSlidePreview(slide, size = 'current') {
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
      {renderSlide(slide)}
    </div>
  );
}

/**
 * Render individual slide based on type
 * (Copied from SlideController)
 */
function renderSlide(slide) {
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
          layout="grid" // Always grid in preview
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
