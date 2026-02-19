import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Maximize2, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Timer } from './Timer';
import { Clock } from './Clock';
import { TitleCard } from './TitleCard';
import { PortfolioSlide } from './PortfolioSlide';
import { EducationSlide } from './EducationSlide';
import ScriptSlide from '../slides/ScriptSlide';
import { EpisodeTeleprompter } from './EpisodeTeleprompter';
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
 * - Notes panel bottom half with sub-tabs: Notes | Script
 * - Notes panel has pop-out button to open in separate window
 * - Controls bar at bottom
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
  showId
}) {
  const hSplit = useDragResize(60, 'horizontal');
  const vSplit = useDragResize(50, 'vertical');
  const [notesMode, setNotesMode] = useState('notes'); // 'notes' or 'script'
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

  const openNotesPopout = () => {
    const params = new URLSearchParams(window.location.search);
    const episodeId = params.get('episode') || params.get('id') || '1';
    window.open(
      `${import.meta.env.BASE_URL}notes?episode=${episodeId}`,
      'slideshow-notes',
      'width=800,height=600'
    );
  };

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
          </div>
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

      {/* Notes Panel with sub-tabs */}
      <div className={styles.notesPanel} style={{ flex: 1 }}>
        <div className={styles.notesHeader}>
          <div className={styles.notesTabs}>
            <button
              className={`${styles.notesTab} ${notesMode === 'notes' ? styles.notesTabActive : ''}`}
              onClick={() => setNotesMode('notes')}
            >
              Notes
            </button>
            <button
              className={`${styles.notesTab} ${notesMode === 'script' ? styles.notesTabActive : ''}`}
              onClick={() => setNotesMode('script')}
            >
              Script
            </button>
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
              Pop Out
            </button>
          </div>
        </div>

        {notesMode === 'notes' ? (
          <div className={styles.notesContent}>
            {currentSlide.talkingPoints && currentSlide.talkingPoints.length > 0 && (
              <div className={styles.talkingPoints}>
                {currentSlide.talkingPoints.map((point, i) => (
                  <div key={i} className={styles.talkingPoint}>
                    <span className={styles.talkingPointBullet} />
                    {point}
                  </div>
                ))}
              </div>
            )}
            <p>{presenterNotes}</p>
          </div>
        ) : (
          <div className={styles.scriptContainer}>
            <EpisodeTeleprompter
              episodeData={episodeData}
              currentSlideIndex={currentSlideIndex}
            />
          </div>
        )}
      </div>

      {/* Bottom: Timer, Clock, Controls */}
      <div className={styles.controlsBar}>
        <Timer targetDuration={parseInt(episodeData.DURATION) || 60} />
        <Clock />

        <div className={styles.slideCounter}>
          <div className={styles.counterLabel}>Slide</div>
          <div className={styles.counterValue}>
            {currentSlideIndex + 1} / {slides.length}
          </div>
        </div>

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
