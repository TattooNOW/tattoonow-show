import { useState, useEffect, useRef, useCallback } from 'react';
import { generateTeleprompterLines, findLineForSegment } from '@/lib/markdown/script-parser';
import type { Episode, TeleprompterLine } from '@/lib/types';
import styles from './Teleprompter.module.css';

/**
 * EpisodeTeleprompter — Reads from episode SHOW_SCRIPT data.
 *
 * Unlike the standalone Teleprompter (localStorage-based), this component
 * derives its script from the episode's SHOW_SCRIPT array. It auto-scrolls
 * to the section matching the current slide and preserves voice recognition
 * and manual controls.
 *
 * Falls back to the standalone Teleprompter when no SHOW_SCRIPT is available.
 */

interface EpisodeTeleprompterProps {
  episodeData: Episode | null;
  currentSlideIndex?: number;
}

// ── Voice recognition helpers (preserved from original Teleprompter) ──

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function wordSimilarity(a: string, b: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;
  const longer = na.length >= nb.length ? na : nb;
  const shorter = na.length < nb.length ? na : nb;
  if (longer.length === 0) return 1;
  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastVal = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newVal = costs[j - 1];
        if (longer[i - 1] !== shorter[j - 1]) newVal = Math.min(newVal, lastVal, costs[j]) + 1;
        costs[j - 1] = lastVal;
        lastVal = newVal;
      }
    }
    if (i > 0) costs[shorter.length] = lastVal;
  }
  return (longer.length - costs[shorter.length]) / longer.length;
}

// ── Component ────────────────────────────────────────────────────────

export function EpisodeTeleprompter({ episodeData, currentSlideIndex = 0 }: EpisodeTeleprompterProps) {
  const [lines, setLines] = useState<TeleprompterLine[]>([]);
  const [curLine, setCurLine] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [fontSize, setFontSize] = useState(32);
  const [listening, setListening] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const [hearing, setHearing] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);
  const listeningRef = useRef(false);

  // State refs for voice callback
  const linesRef = useRef(lines);
  const curLineRef = useRef(curLine);
  const wordIndexRef = useRef(wordIndex);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { curLineRef.current = curLine; }, [curLine]);
  useEffect(() => { wordIndexRef.current = wordIndex; }, [wordIndex]);

  // Generate lines from SHOW_SCRIPT
  useEffect(() => {
    if (episodeData?.SHOW_SCRIPT && episodeData.SHOW_SCRIPT.length > 0) {
      const generated = generateTeleprompterLines(episodeData.SHOW_SCRIPT);
      setLines(generated);
      setCurLine(0);
      setWordIndex(0);
    }
  }, [episodeData]);

  // Auto-scroll to section when slide changes
  useEffect(() => {
    if (lines.length === 0) return;
    // Map slide index to a rough segment index.
    // The slide controller generates multiple slides per segment (e.g. portfolio pages),
    // but the teleprompter has one section per SHOW_SCRIPT segment.
    // We do a simple mapping: segment index ≈ min(slideIndex, totalSegments-1)
    const totalSegments = episodeData?.SHOW_SCRIPT?.length ?? 1;
    const segIdx = Math.min(currentSlideIndex, totalSegments - 1);
    const lineIdx = findLineForSegment(lines, segIdx);
    if (lineIdx >= 0 && lineIdx !== curLine) {
      setCurLine(lineIdx);
      setWordIndex(0);
    }
  }, [currentSlideIndex, lines.length]);

  // Auto-scroll timer
  useEffect(() => {
    if (autoScroll) {
      const interval = Math.max(200, 2000 - scrollSpeed * 90);
      scrollIntervalRef.current = setInterval(() => {
        if (upcomingRef.current) upcomingRef.current.scrollTop += 2;
      }, interval);
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [autoScroll, scrollSpeed]);

  const advance = useCallback(() => {
    setCurLine(prev => {
      if (prev < lines.length - 1) {
        setWordIndex(0);
        return prev + 1;
      }
      return prev;
    });
  }, [lines.length]);

  const goBack = useCallback(() => {
    setCurLine(prev => {
      if (prev > 0) {
        setWordIndex(0);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const jumpTo = useCallback((i: number) => {
    setCurLine(i);
    setWordIndex(0);
  }, []);

  // ── Voice recognition ──

  const processTranscript = useCallback((transcript: string) => {
    const cl = curLineRef.current;
    const ls = linesRef.current;
    if (cl >= ls.length) return;
    const cur = ls[cl];
    if (cur.isTitle) { advance(); return; }

    const words = cur.text.split(/\s+/);
    const spoken = transcript.split(/\s+/);
    let wi = wordIndexRef.current;

    for (const sw of spoken) {
      if (wi >= words.length) break;
      const target = words[wi];
      const nt = norm(target);
      const ns = norm(sw);
      if (!nt || !ns) continue;
      const threshold = nt.length >= 4 ? 0.7 : 0.9;
      if (wordSimilarity(nt, ns) >= threshold) {
        wi++;
      }
    }

    if (wi !== wordIndexRef.current) {
      setWordIndex(wi);
      if (wi >= words.length) advance();
    }
  }, [advance]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition not supported. Use Chrome.');
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setHearing(transcript);
      processTranscript(transcript);
    };

    rec.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
    };

    rec.onend = () => {
      if (listeningRef.current) {
        try { rec.start(); } catch (_e) { /* noop */ }
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
      listeningRef.current = true;
    } catch (_e) { /* noop */ }
  }, [processTranscript]);

  const stopListening = useCallback(() => {
    setListening(false);
    listeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_e) { /* noop */ }
      recognitionRef.current = null;
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (listeningRef.current) stopListening(); else startListening();
          break;
        case 'ArrowDown':
          e.preventDefault();
          advance();
          break;
        case 'ArrowUp':
          e.preventDefault();
          goBack();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setCurLine(0);
          setWordIndex(0);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, goBack, startListening, stopListening]);

  // ── Empty state ──
  if (!episodeData?.SHOW_SCRIPT || episodeData.SHOW_SCRIPT.length === 0) {
    return (
      <div className={styles.container}>
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
          <p>No SHOW_SCRIPT in episode data.</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            Load an episode with a SHOW_SCRIPT array to use the teleprompter.
          </p>
        </div>
      </div>
    );
  }

  const cur = lines[curLine];
  const prevLines = lines.slice(Math.max(0, curLine - 2), curLine);

  return (
    <div className={styles.container}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <button
          className={`${styles.btn} ${styles.voiceBtn} ${listening ? styles.listening : ''}`}
          onClick={() => listening ? stopListening() : startListening()}
        >
          {listening ? 'Stop Voice' : 'Start Voice'}
        </button>
        <button
          className={`${styles.btn} ${mirror ? styles.active : ''}`}
          onClick={() => setMirror(!mirror)}
        >
          Mirror
        </button>
        <button
          className={`${styles.btn} ${autoScroll ? styles.active : ''}`}
          onClick={() => setAutoScroll(!autoScroll)}
        >
          Auto-Scroll
        </button>
        {autoScroll && (
          <div className={styles.scrollSpeed}>
            <label>Speed</label>
            <input
              type="range" min="1" max="20" value={scrollSpeed}
              onChange={e => setScrollSpeed(parseInt(e.target.value))}
            />
            <span className={styles.speedVal}>{scrollSpeed}</span>
          </div>
        )}
        <div className={styles.fontControls}>
          <button className={styles.fontBtn} onClick={() => setFontSize(Math.max(18, fontSize - 2))}>-</button>
          <span className={styles.fontSizeLabel}>{fontSize}px</span>
          <button className={styles.fontBtn} onClick={() => setFontSize(Math.min(60, fontSize + 2))}>+</button>
        </div>
      </div>

      {/* Hearing bar */}
      <div className={styles.hearing}>{hearing || 'Listening...'}</div>

      {/* Main teleprompter area */}
      <div className={`${styles.tpContainer} ${mirror ? styles.mirror : ''}`}>
        {/* Previous lines */}
        <div className={styles.prev} style={{ fontSize }}>
          {prevLines.map((l, i) => (
            <div key={curLine - prevLines.length + i} className={`${styles.line} ${l.isTitle ? styles.titleLine : ''}`}>
              {l.text}
            </div>
          ))}
        </div>

        {/* Current line */}
        <div className={styles.current} style={{ fontSize }}>
          {cur?.isTitle ? (
            <div className={styles.titleLine}>{cur.text}</div>
          ) : (
            <div>
              {cur?.text.split(/\s+/).map((w, i) => (
                <span key={i} className={`${styles.word} ${i < wordIndex ? styles.matched : ''}`}>
                  {w}{' '}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming lines */}
        <div className={styles.upcoming} ref={upcomingRef} style={{ fontSize }}>
          {lines.slice(curLine + 1).map((l, i) => {
            const lineIdx = curLine + 1 + i;
            return (
              <div
                key={lineIdx}
                className={`${styles.line} ${l.isTitle ? styles.titleLine : ''}`}
                onClick={() => jumpTo(lineIdx)}
              >
                {l.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className={styles.status}>
        <span>
          <kbd>Space</kbd> Voice &nbsp; <kbd>&uarr;</kbd><kbd>&darr;</kbd> Navigate &nbsp;
          <kbd>R</kbd> Reset
        </span>
        <span>Line {curLine + 1} / {lines.length}</span>
      </div>
    </div>
  );
}
