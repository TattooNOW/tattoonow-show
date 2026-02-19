/**
 * buildSlidesFromShow — Converts a Show rundown + loaded Tapes into a slides
 * array that SlideController / PresenterView already know how to render.
 *
 * Each rundown entry becomes one or more slides depending on its type and
 * the tape it references. The output format matches the existing slide types:
 *   - title     (TitleCard)
 *   - portfolio (PortfolioSlide)
 *   - education (EducationSlide)
 *   - script    (ScriptSlide)
 */

export function buildSlidesFromShow(show, tapes) {
  if (!show || !show.rundown) return [];

  const slides = [];
  const ep = show.episode || {};

  for (const entry of show.rundown) {
    const tape = entry.tapeId ? tapes[entry.tapeId] : null;
    const entryType = entry.type || entry.segment || '';

    // ── Title card ──────────────────────────────────────────────────
    if (entryType === 'title-card' || entryType === 'skeleton:cold-open') {
      slides.push({
        type: 'title',
        title: ep.title,
        episodeNumber: ep.number,
        airDate: ep.airDate,
        host: ep.host,
      });
      continue;
    }

    // ── End card ────────────────────────────────────────────────────
    if (entryType === 'skeleton:end-card') {
      slides.push({
        type: 'title',
        title: 'Thanks for Watching!',
        episodeNumber: ep.number,
        airDate: ep.airDate,
        host: ep.host,
      });
      continue;
    }

    // ── Bumper (short transition — skip or show a brief card) ──────
    if (entryType.includes('bumper')) {
      continue; // bumpers are timing-only, no visual slide needed
    }

    // ── Intro / Outro / host script segments ────────────────────────
    if (
      entryType === 'intro' ||
      entryType === 'outro' ||
      entryType === 'skeleton:intro' ||
      entryType === 'skeleton:outro'
    ) {
      slides.push(makeScriptSlide(entry, tape, 'intro'));
      continue;
    }

    // ── Guest intro (interview tape) ────────────────────────────────
    if (entryType === 'guest-intro' && tape) {
      const subject = tape.subject || {};
      slides.push({
        type: 'script',
        segment: entry.label || 'Guest Intro',
        timeCode: entry.timeCode,
        title: subject.name || 'Guest Introduction',
        scriptType: 'intro',
        talkingPoints: [
          subject.name && subject.title ? `${subject.name} — ${subject.title}` : null,
          subject.location ? `Based in ${subject.location}` : null,
          subject.instagram ? `@${subject.instagram}` : null,
          subject.bio || null,
        ].filter(Boolean),
        presenterNotes: tape.content?.presenterNotes || entry.presenterNotes || '',
        notes: entry.presenterNotes || tape.content?.presenterNotes || '',
        // Lower-third data for overlays
        showLowerThird: entry.config?.overlays?.includes('lower-third'),
        guestName: subject.name,
        guestTitle: subject.title,
        guestLocation: subject.location,
        guestInstagram: subject.instagram,
      });
      continue;
    }

    // ── Portfolio (interview / text-qa tape — image pages) ──────────
    if (entryType === 'portfolio' && tape) {
      const subject = tape.subject || {};
      const allImages = [
        ...(tape.media?.images || []),
        ...(tape.media?.videos || []),
      ];
      slides.push({
        type: 'portfolio',
        segment: entry.label || 'Portfolio',
        artistName: subject.name || '',
        artistStyle: subject.style || '',
        artistLocation: subject.location || '',
        artistInstagram: subject.instagram || '',
        images: allImages,
        range: entry.config?.range || null,
        autoAdvance: false,
        showLowerThird: entry.config?.overlays?.includes('lower-third'),
        guestName: subject.name,
        guestTitle: subject.title,
        guestInstagram: subject.instagram,
      });
      continue;
    }

    // ── Discussion (interview tape — talking points) ────────────────
    if (entryType === 'discussion' && tape) {
      slides.push({
        type: 'script',
        segment: entry.label || 'Discussion',
        timeCode: entry.timeCode,
        title: entry.label || 'Interview Discussion',
        scriptType: 'discussion',
        talkingPoints: tape.content?.talkingPoints || entry.talkingPoints || [],
        presenterNotes: tape.content?.presenterNotes || entry.presenterNotes || '',
        notes: tape.content?.presenterNotes || entry.presenterNotes || '',
      });
      continue;
    }

    // ── Panel intro (panel tape — introduce panelists) ──────────────
    if (entryType === 'panel-intro' && tape) {
      const panelists = tape.panelists || [];
      // One portfolio slide showing all panelist headshots
      slides.push({
        type: 'portfolio',
        segment: entry.label || 'Meet the Panelists',
        artistName: 'Panelists',
        images: panelists.map(p => ({
          url: p.headshot,
          description: `${p.name} — ${p.title}`,
          aspect: '1:1',
        })),
        showLowerThird: entry.config?.overlays?.includes('lower-third'),
        presenterNotes: entry.presenterNotes || tape.content?.presenterNotes || '',
      });
      continue;
    }

    // ── Panel discussion ────────────────────────────────────────────
    if (entryType === 'panel' && tape) {
      slides.push({
        type: 'script',
        segment: entry.label || 'Panel',
        timeCode: entry.timeCode,
        title: entry.label || tape.content?.topic || 'Panel Discussion',
        scriptType: 'discussion',
        talkingPoints: entry.talkingPoints || tape.content?.talkingPoints || [],
        presenterNotes: entry.presenterNotes || tape.content?.presenterNotes || '',
        notes: entry.presenterNotes || tape.content?.presenterNotes || '',
      });
      continue;
    }

    // ── Education (education tape — one slide per tape slide) ────────
    if (entryType === 'education' && tape) {
      const tapeSlides = tape.content?.slides || [];
      tapeSlides.forEach((s, i) => {
        slides.push({
          type: 'education',
          segment: entry.label || 'Education',
          slideNumber: i + 1,
          title: s.title,
          visual: s.visual || (tape.media?.images?.[0]?.url) || null,
          keyPoints: s.keyPoints || [],
          stats: s.stats || [],
          layout: s.layout || 'split',
        });
      });
      // Also add a script slide with presenter notes for the segment
      if (tape.content?.presenterNotes || entry.presenterNotes) {
        slides.push({
          type: 'script',
          segment: entry.label || 'Education Notes',
          timeCode: entry.timeCode,
          title: 'Education — Presenter Notes',
          scriptType: 'cue',
          talkingPoints: [],
          presenterNotes: entry.presenterNotes || tape.content?.presenterNotes || '',
          notes: entry.presenterNotes || tape.content?.presenterNotes || '',
        });
      }
      continue;
    }

    // ── Text Q&A (text-qa tape — interleave Q/A cards with portfolio) ─
    if (entryType === 'text-qa' && tape) {
      const subject = tape.subject || {};
      const questions = tape.content?.textInterview || [];
      const allImages = tape.media?.images || [];

      // Intro script slide
      if (tape.audio?.voiceover?.script?.[0]) {
        slides.push({
          type: 'script',
          segment: entry.label || 'Text Q&A',
          timeCode: entry.timeCode,
          title: `Text Q&A: ${subject.name}`,
          scriptType: 'intro',
          talkingPoints: [tape.audio.voiceover.script[0].text],
          presenterNotes: tape.audio.voiceover.script[0].notes || '',
          notes: tape.audio.voiceover.script[0].notes || '',
          showLowerThird: entry.config?.overlays?.includes('lower-third'),
          guestName: subject.name,
          guestTitle: subject.title,
          guestInstagram: subject.instagram,
        });
      }

      // Each Q&A entry → script slide + optional portfolio slide
      questions.forEach((qa, i) => {
        // Q&A card as script slide
        slides.push({
          type: 'script',
          segment: `Q${i + 1}`,
          title: qa.question,
          scriptType: 'discussion',
          talkingPoints: [qa.answer],
          presenterNotes: qa.pullQuote ? `Pull quote: "${qa.pullQuote}"` : '',
          notes: qa.pullQuote || '',
        });

        // Interleave portfolio images referenced by this Q&A
        if (qa.displayImages && qa.displayImages.length > 0 && entry.config?.interleavePortfolio !== false) {
          const range = [
            Math.min(...qa.displayImages),
            Math.max(...qa.displayImages),
          ];
          slides.push({
            type: 'portfolio',
            segment: `${subject.name} Portfolio`,
            artistName: subject.name,
            artistStyle: subject.style,
            artistLocation: subject.location,
            artistInstagram: subject.instagram,
            images: allImages,
            range,
            showLowerThird: entry.config?.overlays?.includes('lower-third'),
            guestName: subject.name,
            guestTitle: subject.title,
            guestInstagram: subject.instagram,
          });
        }
      });
      continue;
    }

    // ── Clips (clips tape — host intro, clip bridges, host outro) ───
    if (entryType === 'clips' && tape) {
      const content = tape.content || {};

      // Host intro
      if (content.hostIntro) {
        slides.push({
          type: 'script',
          segment: entry.label || 'Clips',
          timeCode: entry.timeCode,
          title: entry.label || 'Best Of Clips',
          scriptType: 'intro',
          talkingPoints: content.hostIntro.script || [],
          presenterNotes: content.hostIntro.presenterNotes || '',
          notes: content.hostIntro.presenterNotes || '',
        });
      }

      // Each clip + host bridge
      (content.clips || []).forEach((clip) => {
        slides.push({
          type: 'script',
          segment: `Clip: ${clip.sourceGuest}`,
          title: clip.description,
          scriptType: 'cue',
          talkingPoints: [
            `From: ${clip.sourceTitle} (${clip.sourceEpisode})`,
            clip.transcriptSnippet ? `"${clip.transcriptSnippet}"` : null,
          ].filter(Boolean),
          presenterNotes: `Play ${clip.timeStart}–${clip.timeEnd} (${clip.duration}s)`,
          notes: clip.hostBridge || '',
          cue: `PLAY CLIP: ${clip.sourceGuest} ${clip.timeStart}–${clip.timeEnd}`,
        });

        // Host bridge after clip (if exists)
        if (clip.hostBridge) {
          slides.push({
            type: 'script',
            segment: 'Bridge',
            title: 'Host Bridge',
            scriptType: 'transition',
            talkingPoints: [clip.hostBridge],
          });
        }
      });

      // Host outro
      if (content.hostOutro) {
        slides.push({
          type: 'script',
          segment: 'Clips Wrap',
          title: 'Clips — Outro',
          scriptType: 'outro',
          talkingPoints: content.hostOutro.script || [],
          presenterNotes: content.hostOutro.presenterNotes || '',
          notes: content.hostOutro.presenterNotes || '',
        });
      }
      continue;
    }

    // ── Ad break ────────────────────────────────────────────────────
    if (entryType === 'ad-break' || entryType.includes('ad-break')) {
      // If the entry has adSlots, use the first promo tape
      if (entry.adSlots) {
        for (const slot of entry.adSlots) {
          const adTape = slot.tapeId ? tapes[slot.tapeId] : null;
          if (adTape?.sponsor) {
            slides.push({
              type: 'script',
              segment: entry.label || 'Ad Break',
              timeCode: entry.timeCode,
              title: adTape.sponsor.name || 'Sponsor',
              scriptType: 'cue',
              talkingPoints: [adTape.sponsor.adCopy || ''],
              presenterNotes: adTape.content?.presenterNotes || '',
              notes: adTape.content?.presenterNotes || '',
              showQR: slot.config?.overlays?.includes('qr'),
            });
          } else if (slot.script) {
            slides.push({
              type: 'script',
              segment: 'Platform CTA',
              title: 'TattooNOW CTA',
              scriptType: 'cue',
              talkingPoints: [slot.script],
            });
          }
        }
      } else if (tape?.sponsor) {
        slides.push({
          type: 'script',
          segment: entry.label || 'Ad Break',
          timeCode: entry.timeCode,
          title: tape.sponsor.name || 'Sponsor',
          scriptType: 'cue',
          talkingPoints: [tape.sponsor.adCopy || ''],
          presenterNotes: tape.content?.presenterNotes || entry.presenterNotes || '',
          notes: tape.content?.presenterNotes || entry.presenterNotes || '',
          showQR: entry.config?.overlays?.includes('qr'),
        });
      } else {
        slides.push(makeScriptSlide(entry, tape, 'cue'));
      }
      continue;
    }

    // ── Variety (game tapes — talking points + images) ───────────────
    if (entryType === 'variety' && tape) {
      slides.push({
        type: 'script',
        segment: entry.label || 'Variety',
        timeCode: entry.timeCode,
        title: entry.label || tape.content?.topic || 'Variety Segment',
        scriptType: 'discussion',
        talkingPoints: tape.content?.talkingPoints || entry.talkingPoints || [],
        presenterNotes: entry.presenterNotes || tape.content?.presenterNotes || '',
        notes: entry.presenterNotes || tape.content?.presenterNotes || '',
      });
      continue;
    }

    // ── Fallback — any rundown entry with script/talkingPoints ──────
    if (entry.script || entry.talkingPoints || entry.presenterNotes) {
      slides.push(makeScriptSlide(entry, tape, 'cue'));
      continue;
    }

    // Unknown entry types — skip with a warning
    console.warn('[buildSlidesFromShow] Unhandled rundown entry:', entryType, entry);
  }

  return slides;
}

/**
 * Helper: create a script slide from a rundown entry.
 */
function makeScriptSlide(entry, tape, defaultType) {
  return {
    type: 'script',
    segment: entry.label || entry.segment || '',
    timeCode: entry.timeCode || '',
    title: entry.label || '',
    scriptType: defaultType || 'cue',
    talkingPoints: entry.script || entry.talkingPoints || [],
    presenterNotes: entry.presenterNotes || tape?.content?.presenterNotes || '',
    notes: entry.presenterNotes || tape?.content?.presenterNotes || '',
    cue: entry.cue || '',
  };
}
