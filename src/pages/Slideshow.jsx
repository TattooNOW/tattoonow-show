import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlideController } from '../components/Slideshow';
import { useEpisodeData, useEpisodeIdFromURL } from '../hooks/useEpisodeData';
import { useShowData } from '../hooks/useShowData';
import { buildSlidesFromShow } from '../lib/buildSlidesFromShow';

/**
 * Slideshow Page - Main page for OBS browser source
 *
 * Usage in OBS:
 * Add Browser Source: http://localhost:5173/slideshow?show=show-ep4-pricing
 * Add Browser Source: http://localhost:5173/slideshow?episode=5
 * Resolution: 1920x1080
 *
 * URL Parameters:
 * - show: Show ID (preferred — loads show rundown + tapes)
 * - episode: Episode number or ID (legacy — loads episode JSON)
 * - mode: 'presenter' for presenter view
 *
 * Keyboard Controls:
 * - Arrow Left/Right or PageUp/PageDown: Navigate slides
 * - Q: Toggle QR code
 * - L: Toggle lower-third
 * - G: Toggle portfolio grid/fullscreen
 * - Home: Jump to first slide
 * - End: Jump to last slide
 */
export function Slideshow() {
  const [searchParams] = useSearchParams();
  const showId = searchParams.get('show');

  if (showId) {
    return <ShowSlideshow showId={showId} />;
  }

  return <EpisodeSlideshow />;
}

function ShowSlideshow({ showId }) {
  const { show, tapes, loading, error } = useShowData(showId);

  if (loading) {
    return (
      <div className="slideshow-container flex items-center justify-center">
        <div className="text-4xl text-muted-foreground animate-pulse">
          Loading show...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slideshow-container flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl text-destructive mb-2">
            Error loading show
          </div>
          <div className="text-xl text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  const slides = buildSlidesFromShow(show, tapes);

  // Synthetic episodeData for SlideController overlays (QR, duration, etc.)
  const ep = show.episode || {};
  const qr = show.showQRCodes?.booking || {};
  const episodeData = {
    EPISODE_NUMBER: String(ep.number || ''),
    EPISODE_TITLE: ep.title || '',
    AIR_DATE: ep.airDate || '',
    HOST: ep.host || '',
    DURATION: String(ep.duration || 60),
    QR_CODE_URL: qr.url || '',
    QR_CODE_MESSAGE: qr.message || '',
    HIGHLEVEL_QR_URL: qr.highlevelUrl || '',
    _showId: show.id,
  };

  return <SlideController episodeData={episodeData} prebuiltSlides={slides} />;
}

function EpisodeSlideshow() {
  const episodeId = useEpisodeIdFromURL();
  const { episode, loading, error } = useEpisodeData(episodeId);

  if (loading) {
    return (
      <div className="slideshow-container flex items-center justify-center">
        <div className="text-4xl text-muted-foreground animate-pulse">
          Loading episode {episodeId}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slideshow-container flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl text-destructive mb-2">
            Error loading episode
          </div>
          <div className="text-xl text-muted-foreground">{error}</div>
          <div className="mt-8 text-sm text-muted-foreground">
            Make sure <code>/public/data/episode-{episodeId}.json</code> exists
          </div>
        </div>
      </div>
    );
  }

  return <SlideController episodeData={episode} />;
}
