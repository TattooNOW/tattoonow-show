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

    // Listen for NOTES_READY from the popout to send current state immediately
    notesChannelRef.current.onmessage = (event) => {
      if (event.data?.type === 'NOTES_READY') {
        broadcastCurrentNotes();
      }
    };

    return () => {
      if (notesChannelRef.current) notesChannelRef.current.close();
    };
  }, []);

  // Helper to broadcast current notes state (reused on slide change + popout ready)
  const broadcastCurrentNotes = useCallback(() => {
    if (!notesChannelRef.current || !slides || slides.length === 0) return;
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    notesChannelRef.current.postMessage({
      type: 'NOTES_UPDATE',
      payload: {
        presenterNotes: slide.presenterNotes || slide.notes || '',
        slideIndex: currentSlideIndex,
        totalSlides: slides.length,
        slideType: slide.type,
        slideTitle: slide.title || slide.segment || '',
        talkingPoints: slide.talkingPoints || [],
        episodeData: episodeData
      }
    });
  }, [currentSlideIndex, slides, episodeData]);

  // Send notes update whenever slide changes
  useEffect(() => {
    broadcastCurrentNotes();
  }, [broadcastCurrentNotes]);

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

  // Auto-advance countdown (seconds remaining on this slide)
  const slideRemainingMs = slideDurationMs > 0 ? Math.max(0, slideDurationMs - slideElapsedMs) : 0;
  const slideRemainingSeconds = Math.ceil(slideRemainingMs / 1000);
  const showCountdown = autoMode && slideDurationMs > 0 && slideRemainingSeconds <= 10 && slideRemainingSeconds > 0;

  function openNotesPopout() {
    const params = new URLSearchParams(window.location.search);
    const episodeId = params.get('episode') || params.get('id') || '1';
    const sid = showId || params.get('show');
    const notesUrl = sid
      ? `${import.meta.env.BASE_URL}notes?show=${sid}`
      : `${import.meta.env.BASE_URL}notes?episode=${episodeId}`;
    window.open(notesUrl, 'slideshow-notes', 'width=800,height=600');
    // Send current state immediately so the popout doesn't start blank
    setTimeout(() => broadcastCurrentNotes(), 500);
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
          <div className={styles.slidePreviewContainer} style={{ position: 'relative' }}>
            {renderSlidePreview(currentSlide, 'current', portfolioLayout, selectedImage, onSelectImage)}
            {/* Auto-advance countdown overlay */}
            {showCountdown && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: slideRemainingSeconds <= 3 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                borderRadius: '8px',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 20,
                transition: 'background 0.3s',
              }}>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  color: '#fff',
                  lineHeight: 1,
                }}>
                  {slideRemainingSeconds}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>
                  sec to<br/>next
                </span>
              </div>
            )}
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

      {/* Bottom: Controls Bar */}
      <div className={styles.controlsBar}>
        {/* ─── Group 1: Current Time (wall clock) ─── */}
        <Clock />

        {/* ─── Group 2: Timer (Start/Reset + Elapsed + Remaining) ─── */}
        <Timer targetDuration={parseInt(episodeData.DURATION) || 60} />

        {/* ─── Group 3: Show & Segment timing ─── */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <div className={styles.slideCounter}>
            <div className={styles.counterLabel}>Show</div>
            <div className={styles.counterValue} style={{ fontFamily: 'monospace' }}>
              {showElapsedMs > 0 ? formatMsToTimeCode(showElapsedMs) : '—'}
            </div>
          </div>

          <div className={styles.slideCounter}>
            <div className={styles.counterLabel}>Remaining</div>
            <div className={styles.counterValue} style={{
              fontFamily: 'monospace',
              color: (() => {
                const totalMs = slides.reduce((sum, s) => sum + (s.durationMs || 0), 0);
                const remaining = totalMs - showElapsedMs;
                if (showElapsedMs <= 0) return 'white';
                if (remaining <= 0) return '#ef4444';
                if (remaining < 5 * 60 * 1000) return '#facc15';
                return 'white';
              })(),
            }}>
              {(() => {
                const totalMs = slides.reduce((sum, s) => sum + (s.durationMs || 0), 0);
                const remaining = Math.max(0, totalMs - showElapsedMs);
                return showElapsedMs > 0 ? formatMsToTimeCode(remaining) : formatMsToTimeCode(totalMs);
              })()}
            </div>
          </div>

          <div className={styles.slideCounter}>
            <div className={styles.counterLabel}>Segment</div>
            <div className={styles.counterValue} style={{
              fontFamily: 'monospace',
              color: slideDurationMs > 0 && slideElapsedMs > slideDurationMs ? '#ef4444'
                : slideDurationMs > 0 && (slideDurationMs - slideElapsedMs) < 10000 ? '#facc15'
                : 'white',
            }}>
              {slideDurationMs > 0
                ? formatMsToTimeCode(Math.max(0, slideDurationMs - slideElapsedMs))
                : '—'
              }
            </div>
          </div>
        </div>

        {/* ─── Group 4: Auto/Manual + Prev/Next ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
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

          <div className={styles.navControls} style={{ marginLeft: 0 }}>
            <button
              onClick={previousSlide}
              disabled={currentSlideIndex === 0}
              className={styles.navButton}
              title="Previous Slide (←)"
            >
              <ChevronLeft size={20} />
              <span>Prev</span>
            </button>

            <div style={{
              fontFamily: 'monospace', fontSize: '13px', color: '#9ca3af',
              whiteSpace: 'nowrap', padding: '0 4px', display: 'flex', alignItems: 'center',
            }}>
              {currentSlideIndex + 1}/{slides.length}
            </div>

            <button
              onClick={nextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className={styles.navButton}
              title="Next Slide (→)"
            >
              <span>Next</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* ─── Group 5: Overlay toggles (stacked) ─── */}
        <div className={styles.overlayToggles} style={{ flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={toggleQR}
            className={`${styles.toggleButton} ${showQR ? styles.active : ''}`}
            style={{
              opacity: currentSlide.showQR !== undefined || currentSlide.showLowerThird ? 1 : 0.4,
              padding: '6px 12px', fontSize: '11px',
            }}
            title="Toggle QR Code (Q)"
          >
            QR Code
          </button>
          <button
            onClick={toggleLowerThird}
            className={`${styles.toggleButton} ${showLowerThird ? styles.active : ''}`}
            style={{
              opacity: currentSlide.showLowerThird ? 1 : 0.4,
              padding: '6px 12px', fontSize: '11px',
            }}
            title="Toggle Lower-Third (L)"
          >
            Lower-Third
          </button>
        </div>

        {/* ─── Group 6: Open windows (stacked) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              const sid = showId || params.get('show');
              const url = sid
                ? `${import.meta.env.BASE_URL}slideshow?show=${sid}&slide=${currentSlideIndex}`
                : `${import.meta.env.BASE_URL}slideshow?episode=${params.get('episode') || params.get('id') || '1'}&slide=${currentSlideIndex}`;
              window.open(url, 'slideshow-audience', 'width=1920,height=1080');
            }}
            className={styles.navButton}
            title="Open slides window for OBS/screen sharing"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <ExternalLink size={14} />
            <span>Slides</span>
          </button>
          <button
            onClick={openNotesPopout}
            className={styles.navButton}
            title="Open notes in separate window"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Maximize2 size={14} />
            <span>Notes</span>
          </button>
        </div>

        <Link
          to="/admin"
          className={styles.navButton}
          title="Admin"
          style={{ opacity: 0.35, padding: '6px 8px' }}
        >
          <Settings size={14} />
        </Link>
      </div>
    </div>
  );
}

/**
 * ShowTimeline — Complete run-of-show with proportional timeline bar
 * and a scrollable segment list showing all segments with timing.
 *
 * Layout (top to bottom):
 *   - Timeline bar (proportional colored blocks + playhead)
 *   - Time marks
 *   - Full segment list (auto-scrolls to current segment)
 */
function ShowTimeline({ slides, currentSlideIndex, slideElapsedMs = 0 }) {
  const listRef = useRef(null);
  const currentRowRef = useRef(null);

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
      last.slideCount++;
      // Collect distinct slide types in this segment
      if (!last.types.includes(slides[i].type)) last.types.push(slides[i].type);
    } else {
      segments.push({
        label,
        startIndex: i,
        endIndex: i,
        startMs: cumulativeMs[i],
        durationMs: slides[i].durationMs || 0,
        slideCount: 1,
        types: [slides[i].type],
      });
    }
  }

  // Time marks at regular intervals
  const timeMarks = [];
  if (totalMs > 0) {
    const intervalMs = totalMs > 30 * 60000 ? 5 * 60000
      : totalMs > 10 * 60000 ? 2 * 60000
      : 60000;
    for (let t = 0; t <= totalMs; t += intervalMs) {
      timeMarks.push(t);
    }
  }

  const currentDurationMs = slides[currentSlideIndex]?.durationMs || 0;

  // Find which segment the current slide belongs to
  const currentSegmentIdx = segments.findIndex(
    seg => currentSlideIndex >= seg.startIndex && currentSlideIndex <= seg.endIndex
  );

  // Auto-scroll horizontally to keep current segment visible
  useEffect(() => {
    if (currentRowRef.current && listRef.current) {
      const card = currentRowRef.current;
      const list = listRef.current;
      const cardLeft = card.offsetLeft - list.offsetLeft;
      const cardRight = cardLeft + card.offsetWidth;
      const visibleLeft = list.scrollLeft;
      const visibleRight = visibleLeft + list.clientWidth;

      if (cardLeft < visibleLeft || cardRight > visibleRight) {
        list.scrollTo({ left: cardLeft - 40, behavior: 'smooth' });
      }
    }
  }, [currentSegmentIdx]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 12px 0',
      overflow: 'hidden',
      gap: '4px',
    }}>
      {/* Timeline bar */}
      <div style={{ position: 'relative', height: '24px', borderRadius: '3px', overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
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
                {isCurrent && currentDurationMs > 0 && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
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
          position: 'absolute', top: 0, bottom: 0,
          left: `${playheadPct}%`, width: '2px',
          background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.5)',
          transition: 'left 0.25s linear', zIndex: 2,
        }} />
      </div>

      {/* Time marks */}
      <div style={{ position: 'relative', height: '12px', flexShrink: 0 }}>
        {timeMarks.map((t, i) => {
          const pct = totalMs > 0 ? (t / totalMs) * 100 : 0;
          return (
            <span key={i} style={{
              position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)',
              fontSize: '9px', fontFamily: 'monospace', color: '#555',
            }}>
              {formatMsToTimeCode(t)}
            </span>
          );
        })}
        {/* Show total on the right */}
        {totalMs > 0 && (
          <span style={{
            position: 'absolute', right: 0,
            fontSize: '9px', fontFamily: 'monospace', color: '#666',
          }}>
            {formatMsToTimeCode(playheadMs)} / {formatMsToTimeCode(totalMs)}
          </span>
        )}
      </div>

      {/* Horizontal segment strip — tapes laid out left to right */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          borderTop: '1px solid #222',
          paddingTop: '4px',
          display: 'flex',
          gap: '3px',
          alignItems: 'stretch',
        }}
      >
        {segments.map((seg, i) => {
          const isCurrent = i === currentSegmentIdx;
          const isPast = currentSegmentIdx > i;
          const segTimeCode = formatMsToTimeCode(seg.startMs);
          const segDuration = formatMsToTimeCode(seg.durationMs);
          const segElapsedMs = isCurrent
            ? cumulativeMs[currentSlideIndex] - seg.startMs + slideElapsedMs
            : 0;
          const segOvertime = isCurrent && seg.durationMs > 0 && segElapsedMs > seg.durationMs;

          // Width proportional to duration, with a minimum so labels are readable
          const widthPct = totalMs > 0 ? (seg.durationMs / totalMs) * 100 : (100 / segments.length);
          const primaryColor = TYPE_COLORS[seg.types[0]] || '#555';

          return (
            <div
              key={i}
              ref={isCurrent ? currentRowRef : undefined}
              style={{
                flex: `0 0 ${Math.max(widthPct, 6)}%`,
                minWidth: '60px',
                display: 'flex',
                flexDirection: 'column',
                padding: '6px 8px',
                borderRadius: '4px',
                background: isCurrent ? 'rgba(249, 115, 22, 0.15)' : '#141414',
                borderTop: `3px solid ${isCurrent ? '#f97316' : primaryColor}`,
                opacity: isPast ? 0.4 : 1,
                transition: 'all 0.2s',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Progress fill for current segment */}
              {isCurrent && seg.durationMs > 0 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: `${Math.min(100, (segElapsedMs / seg.durationMs) * 100)}%`,
                  background: 'rgba(249, 115, 22, 0.08)',
                  transition: 'width 0.25s linear',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Top row: time code + type badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', position: 'relative' }}>
                <span style={{
                  fontSize: '10px', fontFamily: 'monospace', color: '#555',
                }}>
                  {segTimeCode}
                </span>
                {seg.types.map((t, ti) => (
                  <span key={ti} style={{
                    display: 'inline-block', width: '6px', height: '6px',
                    borderRadius: '2px', background: TYPE_COLORS[t] || '#555',
                  }} />
                ))}
              </div>

              {/* Label */}
              <span style={{
                fontSize: '11px',
                color: isCurrent ? '#fff' : '#aaa',
                fontWeight: isCurrent ? 600 : 400,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1,
                position: 'relative',
              }}>
                {seg.label}
              </span>

              {/* Bottom row: slide count + duration */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '2px', position: 'relative' }}>
                {seg.slideCount > 1 ? (
                  <span style={{ fontSize: '9px', color: '#555' }}>
                    {isCurrent
                      ? `${currentSlideIndex - seg.startIndex + 1}/${seg.slideCount}`
                      : `${seg.slideCount} slides`
                    }
                  </span>
                ) : <span />}
                <span style={{
                  fontSize: '10px', fontFamily: 'monospace',
                  color: segOvertime ? '#ef4444' : isCurrent ? '#f97316' : '#555',
                }}>
                  {isCurrent && seg.durationMs > 0
                    ? `${formatMsToTimeCode(segElapsedMs)}/${segDuration}`
                    : segDuration
                  }
                </span>
              </div>
            </div>
          );
        })}
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
