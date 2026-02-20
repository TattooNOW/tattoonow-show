import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TitleCard } from './TitleCard';
import { PortfolioSlide } from './PortfolioSlide';
import { EducationSlide } from './EducationSlide';
import { LowerThird } from './LowerThird';
import { QRCode, QRCodeWithTracking } from './QRCode';
import ScriptSlide from '../slides/ScriptSlide';
import { IntroSlide, BumperSlide, OutroSlide } from './ShowBreakSlides';
import { PresenterView } from './PresenterView';

/**
 * SlideController - Main slideshow controller
 * Handles slide sequencing, keyboard controls, overlay toggling,
 * and dual-window presenter mode with BroadcastChannel sync.
 */
export function SlideController({ episodeData, prebuiltSlides }) {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'presenter' or null

  // Initialize slide index from URL param (for audience windows opened mid-show)
  const initialSlide = parseInt(searchParams.get('slide') || '0', 10);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(
    isNaN(initialSlide) ? 0 : Math.max(0, initialSlide)
  );
  const [showQR, setShowQR] = useState(false);
  const [showLowerThird, setShowLowerThird] = useState(false);
  const [portfolioLayout, setPortfolioLayout] = useState('grid'); // 'grid' or 'fullscreen'
  const [selectedImage, setSelectedImage] = useState(null);

  // Auto/manual navigation mode
  const [autoMode, setAutoMode] = useState(false);
  // Elapsed time on the current slide (ms)
  const [slideElapsedMs, setSlideElapsedMs] = useState(0);
  // Total show elapsed time (ms) — starts when first slide advances
  const [showStartTime, setShowStartTime] = useState(null);
  const [showElapsedMs, setShowElapsedMs] = useState(0);
  const slideTimerRef = useRef(null);
  const showTimerRef = useRef(null);

  // BroadcastChannel for syncing between audience and presenter windows
  const channelRef = useRef(null);

  // Use prebuilt slides (from Show) or build from episode data
  const slides = prebuiltSlides || buildSlides(episodeData);

  // Clamp initial slide index to valid range once slides are available
  useEffect(() => {
    if (slides.length > 0 && currentSlideIndex >= slides.length) {
      setCurrentSlideIndex(slides.length - 1);
    }
  }, [slides.length]);

  // Initialize BroadcastChannel for window sync
  useEffect(() => {
    channelRef.current = new BroadcastChannel('tattoonow-slideshow-sync');

    channelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'SLIDE_CHANGE':
          setCurrentSlideIndex(payload.slideIndex);
          break;
        case 'QR_TOGGLE':
          setShowQR(payload.show);
          break;
        case 'LOWER_THIRD_TOGGLE':
          setShowLowerThird(payload.show);
          break;
        case 'PORTFOLIO_LAYOUT_TOGGLE':
          setPortfolioLayout(payload.layout);
          break;
        case 'SELECTED_IMAGE':
          setSelectedImage(payload.imageIndex);
          setPortfolioLayout(payload.imageIndex !== null ? 'fullscreen' : 'grid');
          break;
        case 'AUTO_MODE_TOGGLE':
          setAutoMode(payload.auto);
          break;
        default:
          break;
      }
    };

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // Slide elapsed timer — resets on slide change
  useEffect(() => {
    setSlideElapsedMs(0);
    clearInterval(slideTimerRef.current);
    slideTimerRef.current = setInterval(() => {
      setSlideElapsedMs(prev => prev + 250);
    }, 250);
    return () => clearInterval(slideTimerRef.current);
  }, [currentSlideIndex]);

  // Show elapsed timer — starts on first slide advance
  useEffect(() => {
    if (showStartTime) {
      showTimerRef.current = setInterval(() => {
        setShowElapsedMs(Date.now() - showStartTime);
      }, 250);
      return () => clearInterval(showTimerRef.current);
    }
  }, [showStartTime]);

  // Auto-advance: when auto mode is on and slide duration has elapsed, go next
  useEffect(() => {
    if (!autoMode) return;
    const currentSlide = slides[currentSlideIndex];
    if (!currentSlide?.durationMs || currentSlide.durationMs <= 0) return;
    if (slideElapsedMs >= currentSlide.durationMs && currentSlideIndex < slides.length - 1) {
      nextSlide();
    }
  }, [autoMode, slideElapsedMs, currentSlideIndex, slides]);

  const toggleAutoMode = useCallback(() => {
    setAutoMode(prev => {
      const newVal = !prev;
      channelRef.current?.postMessage({
        type: 'AUTO_MODE_TOGGLE',
        payload: { auto: newVal }
      });
      return newVal;
    });
  }, []);

  // Broadcast functions
  const broadcastSlideChange = useCallback((index) => {
    channelRef.current?.postMessage({
      type: 'SLIDE_CHANGE',
      payload: { slideIndex: index }
    });
  }, []);

  const broadcastQRToggle = useCallback((show) => {
    channelRef.current?.postMessage({
      type: 'QR_TOGGLE',
      payload: { show }
    });
  }, []);

  const broadcastLowerThirdToggle = useCallback((show) => {
    channelRef.current?.postMessage({
      type: 'LOWER_THIRD_TOGGLE',
      payload: { show }
    });
  }, []);

  const broadcastPortfolioLayoutToggle = useCallback((layout) => {
    channelRef.current?.postMessage({
      type: 'PORTFOLIO_LAYOUT_TOGGLE',
      payload: { layout }
    });
  }, []);

  const broadcastSelectedImage = useCallback((imageIndex) => {
    channelRef.current?.postMessage({
      type: 'SELECTED_IMAGE',
      payload: { imageIndex }
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          previousSlide();
          break;
        case 'q':
        case 'Q':
          toggleQR();
          break;
        case 'l':
        case 'L':
          toggleLowerThird();
          break;
        case 'g':
        case 'G':
          togglePortfolioLayout();
          break;
        case 'a':
        case 'A':
          toggleAutoMode();
          break;
        case 'Home':
          setCurrentSlideIndex(0);
          break;
        case 'End':
          setCurrentSlideIndex(slides.length - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [slides.length]);

  // Stream Deck WebSocket integration
  useEffect(() => {
    // Connect to Stream Deck WebSocket server
    const ws = new WebSocket('ws://localhost:9000/streamdeck');

    ws.onmessage = (event) => {
      const command = JSON.parse(event.data);

      switch (command.action) {
        case 'next':
          nextSlide();
          break;
        case 'previous':
          previousSlide();
          break;
        case 'toggleQR':
          toggleQR();
          break;
        case 'toggleLowerThird':
          toggleLowerThird();
          break;
        case 'togglePortfolioLayout':
          togglePortfolioLayout();
          break;
        case 'jumpToSegment':
          jumpToSegment(command.segmentNumber);
          break;
        default:
          console.warn('Unknown Stream Deck command:', command);
      }
    };

    ws.onerror = (error) => {
      console.warn('Stream Deck WebSocket not connected:', error.message);
      // Gracefully degrade - keyboard controls still work
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Navigation functions (with broadcast)
  const nextSlide = useCallback(() => {
    // Start the show clock on first advance
    setShowStartTime(prev => prev || Date.now());
    setCurrentSlideIndex((prev) => {
      const newIndex = Math.min(prev + 1, slides.length - 1);
      broadcastSlideChange(newIndex);
      return newIndex;
    });
    // Reset portfolio state when navigating away from a slide
    setSelectedImage(null);
    setPortfolioLayout('grid');
    broadcastSelectedImage(null);
  }, [slides.length, broadcastSlideChange, broadcastSelectedImage]);

  const previousSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => {
      const newIndex = Math.max(prev - 1, 0);
      broadcastSlideChange(newIndex);
      return newIndex;
    });
    // Reset portfolio state when navigating away from a slide
    setSelectedImage(null);
    setPortfolioLayout('grid');
    broadcastSelectedImage(null);
  }, [broadcastSlideChange, broadcastSelectedImage]);

  const toggleQR = useCallback(() => {
    setShowQR((prev) => {
      const newValue = !prev;
      broadcastQRToggle(newValue);
      return newValue;
    });
  }, [broadcastQRToggle]);

  const toggleLowerThird = useCallback(() => {
    setShowLowerThird((prev) => {
      const newValue = !prev;
      broadcastLowerThirdToggle(newValue);
      return newValue;
    });
  }, [broadcastLowerThirdToggle]);

  const togglePortfolioLayout = useCallback(() => {
    setPortfolioLayout((prev) => {
      const newLayout = prev === 'grid' ? 'fullscreen' : 'grid';
      broadcastPortfolioLayoutToggle(newLayout);
      return newLayout;
    });
  }, [broadcastPortfolioLayoutToggle]);

  const handleSelectImage = useCallback((imageIndex) => {
    setSelectedImage(imageIndex);
    setPortfolioLayout(imageIndex !== null ? 'fullscreen' : 'grid');
    broadcastSelectedImage(imageIndex);
  }, [broadcastSelectedImage]);

  const jumpToSlide = useCallback((slideIndex) => {
    const clamped = Math.max(0, Math.min(slideIndex, slides.length - 1));
    setShowStartTime(prev => prev || Date.now());
    setCurrentSlideIndex(clamped);
    broadcastSlideChange(clamped);
    setSelectedImage(null);
    setPortfolioLayout('grid');
    broadcastSelectedImage(null);
  }, [slides.length, broadcastSlideChange, broadcastSelectedImage]);

  const jumpToSegment = useCallback((segmentNumber) => {
    // Find the index of the first slide for the given segment
    const segmentIndex = slides.findIndex(
      (slide) => slide.segment === segmentNumber
    );
    if (segmentIndex >= 0) {
      jumpToSlide(segmentIndex);
    }
  }, [slides, jumpToSlide]);

  if (!episodeData || slides.length === 0) {
    return (
      <div className="slideshow-container flex items-center justify-center">
        <div className="text-4xl text-muted-foreground">
          No episode data loaded
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  // Render Presenter View if mode=presenter
  if (mode === 'presenter') {
    return (
      <PresenterView
        episodeData={episodeData}
        currentSlideIndex={currentSlideIndex}
        slides={slides}
        nextSlide={nextSlide}
        previousSlide={previousSlide}
        toggleQR={toggleQR}
        toggleLowerThird={toggleLowerThird}
        showQR={showQR}
        showLowerThird={showLowerThird}
        portfolioLayout={portfolioLayout}
        togglePortfolioLayout={togglePortfolioLayout}
        selectedImage={selectedImage}
        onSelectImage={handleSelectImage}
        showId={episodeData?._showId}
        autoMode={autoMode}
        toggleAutoMode={toggleAutoMode}
        slideElapsedMs={slideElapsedMs}
        showElapsedMs={showElapsedMs}
        jumpToSlide={jumpToSlide}
      />
    );
  }

  // Render Audience View (default) — scales 1920x1080 content to fill viewport
  return <AudienceView
    currentSlide={currentSlide}
    currentSlideIndex={currentSlideIndex}
    slides={slides}
    portfolioLayout={portfolioLayout}
    selectedImage={selectedImage}
    handleSelectImage={handleSelectImage}
    showLowerThird={showLowerThird}
    showQR={showQR}
    episodeData={episodeData}
  />;
}

/**
 * AudienceView — Renders slides at their designed 1920x1080 size,
 * then CSS-transform-scales the whole thing to fill the viewport.
 * This makes ALL content (text, images, padding) scale proportionally.
 */
function AudienceView({
  currentSlide, currentSlideIndex, slides, portfolioLayout,
  selectedImage, handleSelectImage, showLowerThird, showQR, episodeData
}) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 1920x1080 slide scaled to fill viewport */}
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
        }}
      >
        {/* Main slide content */}
        {renderSlide(currentSlide, portfolioLayout, selectedImage, handleSelectImage)}

        {/* Overlays */}
        {currentSlide.showLowerThird && (
          <LowerThird
            guestName={currentSlide.guestName}
            title={currentSlide.guestTitle}
            location={currentSlide.guestLocation}
            instagram={currentSlide.guestInstagram}
            display={showLowerThird}
          />
        )}

        {episodeData.QR_CODE_URL && (
          <QRCode
            url={episodeData.QR_CODE_URL}
            highlevelUrl={episodeData.HIGHLEVEL_QR_URL}
            message={episodeData.QR_CODE_MESSAGE || 'Book Your Consultation'}
            display={showQR}
          />
        )}

        {/* Slide counter */}
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-sm" style={{ zIndex: 10 }}>
          {currentSlideIndex + 1} / {slides.length}
        </div>
      </div>
    </div>
  );
}

/**
 * Build slides array from episode data
 * If SHOW_SCRIPT exists, use it to interleave script slides with content slides
 * Otherwise, fall back to legacy segment-based building
 */
function buildSlides(episodeData) {
  const slides = [];

  if (!episodeData) return slides;

  // NEW: Script-driven slideshow (preferred)
  if (episodeData.SHOW_SCRIPT && Array.isArray(episodeData.SHOW_SCRIPT)) {
    return buildSlidesFromScript(episodeData);
  }

  // LEGACY: Segment-based slideshow (backwards compatible)

  // ─── Intro ───
  slides.push({
    type: 'intro',
    rundownLabel: 'Intro',
    title: episodeData.EPISODE_TITLE,
    episodeNumber: episodeData.EPISODE_NUMBER,
    host: episodeData.HOST,
    airDate: episodeData.AIR_DATE,
    presenterNotes: 'Pre-show holding slide. Go live, greet viewers, wait for audience to arrive.',
  });

  // ─── Title Card ───
  slides.push({
    type: 'title',
    rundownLabel: 'Title',
    title: episodeData.EPISODE_TITLE,
    episodeNumber: episodeData.EPISODE_NUMBER,
    airDate: episodeData.AIR_DATE,
    host: episodeData.HOST,
    presenterNotes: 'Welcome to the show! Introduce today\'s episode topic and guest(s).',
  });

  // ─── Segments with bumpers between them ───
  const segmentCount = [1, 2, 3].filter(n => episodeData[`SEGMENT_${n}_TYPE`]).length;

  for (let seg = 1; seg <= 3; seg++) {
    const segType = episodeData[`SEGMENT_${seg}_TYPE`];
    if (!segType) continue;

    // Figure out what comes next (for bumper "Coming up" text)
    const nextSeg = seg + 1;
    const nextSegType = episodeData[`SEGMENT_${nextSeg}_TYPE`];
    const nextSegLabel = nextSegType === 'interview'
      ? episodeData[`SEGMENT_${nextSeg}_GUEST_NAME`] || `Segment ${nextSeg}`
      : nextSegType === 'education'
      ? (episodeData[`SEGMENT_${nextSeg}_SLIDES`]?.[0]?.title || `Segment ${nextSeg}`)
      : null;

    if (segType === 'interview') {
      const guestName = episodeData[`SEGMENT_${seg}_GUEST_NAME`] || 'Guest';
      const topics = episodeData[`SEGMENT_${seg}_DISCUSSION_TOPICS`] || [];
      const guide = episodeData[`SEGMENT_${seg}_DISCUSSION_GUIDE`] || '';
      slides.push({
        type: 'portfolio',
        segment: seg,
        rundownLabel: `${guestName} (Seg ${seg})`,
        artistName: guestName,
        artistStyle: episodeData[`SEGMENT_${seg}_GUEST_STYLE`],
        artistLocation: episodeData[`SEGMENT_${seg}_GUEST_LOCATION`],
        artistInstagram: episodeData[`SEGMENT_${seg}_GUEST_INSTAGRAM`],
        images: episodeData[`SEGMENT_${seg}_PORTFOLIO_IMAGES`] || [],
        showLowerThird: true,
        guestName: guestName,
        guestTitle: episodeData[`SEGMENT_${seg}_GUEST_TITLE`],
        guestInstagram: episodeData[`SEGMENT_${seg}_GUEST_INSTAGRAM`],
        presenterNotes: guide || `Discussion topics:\n${topics.map(t => `• ${t}`).join('\n')}`,
      });
    } else if (segType === 'education') {
      const educationSlides = parseEducationSlides(episodeData, seg);
      slides.push(...educationSlides);
    }

    // ─── Bumper between segments (not after the last one) ───
    if (seg < segmentCount) {
      slides.push({
        type: 'bumper',
        rundownLabel: 'Ad Break',
        message: episodeData.QR_CODE_MESSAGE,
        qrUrl: episodeData.QR_CODE_URL,
        qrMessage: episodeData.QR_CODE_MESSAGE,
        nextSegmentLabel: nextSegLabel,
        presenterNotes: 'Ad break. Remind viewers about sponsors, read live chat, tease next segment.',
      });
    }
  }

  // ─── Outro ───
  slides.push({
    type: 'outro',
    rundownLabel: 'Outro',
    title: episodeData.EPISODE_TITLE,
    episodeNumber: episodeData.EPISODE_NUMBER,
    host: episodeData.HOST,
    qrUrl: episodeData.QR_CODE_URL,
    qrMessage: episodeData.QR_CODE_MESSAGE,
    presenterNotes: 'Thank viewers, remind them to like/subscribe/share, mention next week\'s episode.',
  });

  return slides;
}

/**
 * Build slides from SHOW_SCRIPT array (new preferred method)
 * Interleaves script slides with portfolio/education slides
 */
function buildSlidesFromScript(episodeData) {
  const slides = [];
  const script = episodeData.SHOW_SCRIPT;

  script.forEach((scriptItem) => {
    // Add script slide
    slides.push({
      type: 'script',
      segment: scriptItem.segment,
      timeCode: scriptItem.timeCode,
      title: scriptItem.title,
      scriptType: scriptItem.type,
      talkingPoints: scriptItem.talkingPoints || [],
      notes: scriptItem.notes,
      presenterNotes: scriptItem.presenterNotes || scriptItem.notes,
      cue: scriptItem.cue
    });

    // After certain script slides, insert content slides (portfolio/education)
    // Based on cue or title matching
    if (scriptItem.cue && scriptItem.cue.includes('Portfolio')) {
      // Insert portfolio slide for segment 1
      if (episodeData.SEGMENT_1_TYPE === 'interview' && scriptItem.segment === 'SEGMENT 1') {
        slides.push({
          type: 'portfolio',
          segment: 1,
          artistName: episodeData.SEGMENT_1_GUEST_NAME,
          artistStyle: episodeData.SEGMENT_1_GUEST_STYLE,
          artistLocation: episodeData.SEGMENT_1_GUEST_LOCATION,
          artistInstagram: episodeData.SEGMENT_1_GUEST_INSTAGRAM,
          images: episodeData.SEGMENT_1_PORTFOLIO_IMAGES || [],
          showLowerThird: true,
          guestName: episodeData.SEGMENT_1_GUEST_NAME,
          guestTitle: episodeData.SEGMENT_1_GUEST_TITLE,
          guestInstagram: episodeData.SEGMENT_1_GUEST_INSTAGRAM
        });
      }
    }

    if (scriptItem.cue && scriptItem.cue.includes('Education Slides')) {
      // Insert education slides for segment 2
      if (episodeData.SEGMENT_2_TYPE === 'education' && scriptItem.segment === 'SEGMENT 2') {
        const educationSlides = parseEducationSlides(episodeData, 2);
        slides.push(...educationSlides);
      }
    }
  });

  return slides;
}

/**
 * Parse education slides from segment data
 */
function parseEducationSlides(episodeData, segmentNumber) {
  const slides = [];
  const slidesData = episodeData[`SEGMENT_${segmentNumber}_SLIDES`] || [];

  slidesData.forEach((slideData, index) => {
    slides.push({
      type: 'education',
      segment: segmentNumber,
      rundownLabel: slideData.title || `Education ${index + 1}`,
      slideNumber: index + 1,
      title: slideData.title,
      visual: slideData.visual,
      keyPoints: slideData.keyPoints || [],
      stats: slideData.stats || [],
      layout: slideData.layout || 'split'
    });
  });

  return slides;
}

/**
 * Render individual slide based on type
 */
function renderSlide(slide, portfolioLayout, selectedImage, onSelectImage) {
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

    case 'intro':
      return (
        <IntroSlide
          episodeTitle={slide.title}
          episodeNumber={slide.episodeNumber}
          host={slide.host}
          airDate={slide.airDate}
        />
      );

    case 'bumper':
      return (
        <BumperSlide
          message={slide.message}
          qrUrl={slide.qrUrl}
          qrMessage={slide.qrMessage}
          nextSegmentLabel={slide.nextSegmentLabel}
        />
      );

    case 'outro':
      return (
        <OutroSlide
          episodeTitle={slide.title}
          episodeNumber={slide.episodeNumber}
          host={slide.host}
          qrUrl={slide.qrUrl}
          qrMessage={slide.qrMessage}
        />
      );

    default:
      return (
        <div className="slideshow-container flex items-center justify-center">
          <div className="text-4xl text-muted-foreground">
            Unknown slide type: {slide.type}
          </div>
        </div>
      );
  }
}
