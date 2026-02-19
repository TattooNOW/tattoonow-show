import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TitleCard } from './TitleCard';
import { PortfolioSlide } from './PortfolioSlide';
import { EducationSlide } from './EducationSlide';
import { LowerThird } from './LowerThird';
import { QRCode, QRCodeWithTracking } from './QRCode';
import ScriptSlide from '../slides/ScriptSlide';
import { PresenterView } from './PresenterView';

/**
 * SlideController - Main slideshow controller
 * Handles slide sequencing, keyboard controls, overlay toggling,
 * and dual-window presenter mode with BroadcastChannel sync.
 */
export function SlideController({ episodeData, prebuiltSlides }) {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'presenter' or null

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [showLowerThird, setShowLowerThird] = useState(false);
  const [portfolioLayout, setPortfolioLayout] = useState('grid'); // 'grid' or 'fullscreen'
  const [selectedImage, setSelectedImage] = useState(null);

  // BroadcastChannel for syncing between audience and presenter windows
  const channelRef = useRef(null);

  // Use prebuilt slides (from Show) or build from episode data
  const slides = prebuiltSlides || buildSlides(episodeData);

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

  const jumpToSegment = useCallback((segmentNumber) => {
    // Find the index of the first slide for the given segment
    const segmentIndex = slides.findIndex(
      (slide) => slide.segment === segmentNumber
    );
    if (segmentIndex >= 0) {
      setCurrentSlideIndex(segmentIndex);
      broadcastSlideChange(segmentIndex);
      setSelectedImage(null);
      setPortfolioLayout('grid');
      broadcastSelectedImage(null);
    }
  }, [slides, broadcastSlideChange, broadcastSelectedImage]);

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
      />
    );
  }

  // Render Audience View (default)
  return (
    <div className="relative">
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

      {/* Slide counter (debug - can be hidden) */}
      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-sm">
        {currentSlideIndex + 1} / {slides.length}
      </div>

      {/* Keyboard shortcuts hint (can be toggled off) */}
      <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-xs text-muted-foreground">
        ← → Next/Prev | Q: QR | L: Lower Third | G: Grid/Fullscreen
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
  // Title card
  slides.push({
    type: 'title',
    title: episodeData.EPISODE_TITLE,
    episodeNumber: episodeData.EPISODE_NUMBER,
    airDate: episodeData.AIR_DATE,
    host: episodeData.HOST
  });

  // Segment 1
  if (episodeData.SEGMENT_1_TYPE === 'interview') {
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
  } else if (episodeData.SEGMENT_1_TYPE === 'education') {
    const educationSlides = parseEducationSlides(episodeData, 1);
    slides.push(...educationSlides);
  }

  // Segment 2
  if (episodeData.SEGMENT_2_TYPE === 'interview') {
    slides.push({
      type: 'portfolio',
      segment: 2,
      artistName: episodeData.SEGMENT_2_GUEST_NAME,
      artistStyle: episodeData.SEGMENT_2_GUEST_STYLE,
      artistLocation: episodeData.SEGMENT_2_GUEST_LOCATION,
      artistInstagram: episodeData.SEGMENT_2_GUEST_INSTAGRAM,
      images: episodeData.SEGMENT_2_PORTFOLIO_IMAGES || [],
      showLowerThird: true,
      guestName: episodeData.SEGMENT_2_GUEST_NAME,
      guestTitle: episodeData.SEGMENT_2_GUEST_TITLE,
      guestInstagram: episodeData.SEGMENT_2_GUEST_INSTAGRAM
    });
  } else if (episodeData.SEGMENT_2_TYPE === 'education') {
    const educationSlides = parseEducationSlides(episodeData, 2);
    slides.push(...educationSlides);
  }

  // Segment 3
  if (episodeData.SEGMENT_3_TYPE === 'interview') {
    slides.push({
      type: 'portfolio',
      segment: 3,
      artistName: episodeData.SEGMENT_3_GUEST_NAME,
      artistStyle: episodeData.SEGMENT_3_GUEST_STYLE,
      artistLocation: episodeData.SEGMENT_3_GUEST_LOCATION,
      artistInstagram: episodeData.SEGMENT_3_GUEST_INSTAGRAM,
      images: episodeData.SEGMENT_3_PORTFOLIO_IMAGES || [],
      showLowerThird: true,
      guestName: episodeData.SEGMENT_3_GUEST_NAME,
      guestTitle: episodeData.SEGMENT_3_GUEST_TITLE,
      guestInstagram: episodeData.SEGMENT_3_GUEST_INSTAGRAM
    });
  } else if (episodeData.SEGMENT_3_TYPE === 'education') {
    const educationSlides = parseEducationSlides(episodeData, 3);
    slides.push(...educationSlides);
  }

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
