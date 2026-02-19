import React from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Timer } from './Timer';
import { Clock } from './Clock';
import { TitleCard } from './TitleCard';
import { PortfolioSlide } from './PortfolioSlide';
import { EducationSlide } from './EducationSlide';
import ScriptSlide from '../slides/ScriptSlide';
import styles from './PresenterView.module.css';

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
  const presenterNotes =
    currentSlide.presenterNotes ||
    currentSlide.notes ||
    'No presenter notes for this slide.';

  return (
    <div className={styles.container}>
      {/* Top: Slide Previews */}
      <div className={styles.previewRow}>
        {/* Current Slide Preview */}
        <div className={styles.currentSlidePreview}>
          <div className={styles.previewLabel}>
            <span className={styles.labelDot} />
            Current Slide
          </div>
          <div className={styles.slidePreviewContainer}>
            {renderSlidePreview(currentSlide, 'current')}
          </div>
        </div>

        {/* Next Slide Preview */}
        <div className={styles.nextSlidePreview}>
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

      {/* Middle: Presenter Notes */}
      <div className={styles.notesPanel}>
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
              `/slideshow?episode=${episodeId}`,
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
 */
function renderSlidePreview(slide, size = 'current') {
  const scale = size === 'current' ? 0.5 : 0.35;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: '1920px',
        height: '1080px',
        pointerEvents: 'none' // Disable interactions in preview
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
