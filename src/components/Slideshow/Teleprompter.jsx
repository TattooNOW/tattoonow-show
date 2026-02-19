import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Teleprompter.module.css';

const DEFAULT_SCRIPT = `## Welcome to the TattooNOW Show

Welcome back to the TattooNOW Weekly Show.

Today we have an incredible episode planned for you.

We're going to cover some topics that will transform your tattoo business.

## Segment One

Let's dive right into our first segment.

This is where we break down the fundamentals.

Every artist needs to understand these core principles.

Whether you're just starting out or you've been tattooing for twenty years.

These strategies will help you grow.

## Guest Introduction

Now let me introduce our special guest today.

They've been in the industry for over two decades.

And they've built one of the most successful studios in the country.

Welcome to the show.

## Key Takeaways

Before we wrap up let me share the key takeaways.

Number one: invest in your online presence.

Number two: price your work based on value not time.

Number three: build systems that work while you sleep.

Thank you for watching and we'll see you next week.`;

function parseMD(md) {
  return md.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    if (line.startsWith('## ')) return { text: line.slice(3).trim(), isTitle: true };
    if (line.startsWith('# ')) return { text: line.slice(2).trim(), isTitle: true };
    return { text: line, isTitle: false };
  });
}

function toMD(lines) {
  return lines.map(l => l.isTitle ? '## ' + l.text : l.text).join('\n\n');
}

function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

function wordSimilarity(a, b) {
  a = norm(a); b = norm(b);
  if (a === b) return 1;
  if (!a || !b) return 0;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;
  if (longer.length === 0) return 1;
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastVal = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) { costs[j] = j; }
      else if (j > 0) {
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

function getScripts() {
  try {
    const stored = localStorage.getItem('tp_scripts');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return { 'Default Script': DEFAULT_SCRIPT };
}

function saveScripts(scripts) {
  try { localStorage.setItem('tp_scripts', JSON.stringify(scripts)); } catch (e) {}
}

function getActiveName() {
  try { return localStorage.getItem('tp_active_script') || 'Default Script'; } catch (e) { return 'Default Script'; }
}

function setActiveName(name) {
  try { localStorage.setItem('tp_active_script', name); } catch (e) {}
}

export function Teleprompter() {
  const [lines, setLines] = useState([]);
  const [curLine, setCurLine] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [fontSize, setFontSize] = useState(32);
  const [listening, setListening] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const [hearing, setHearing] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(-1);
  const [scripts, setScriptsState] = useState(getScripts);
  const [activeName, setActiveNameState] = useState(getActiveName);
  const [modalText, setModalText] = useState('');
  const [modalSelect, setModalSelect] = useState('');

  const recognitionRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const upcomingRef = useRef(null);
  const editRef = useRef(null);
  const fileInputRef = useRef(null);
  const listeningRef = useRef(false);

  // Load initial script
  useEffect(() => {
    const s = getScripts();
    const name = getActiveName();
    const md = s[name] || s[Object.keys(s)[0]] || DEFAULT_SCRIPT;
    setLines(parseMD(md));
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      const interval = Math.max(200, 2000 - scrollSpeed * 90);
      scrollIntervalRef.current = setInterval(() => {
        if (upcomingRef.current) upcomingRef.current.scrollTop += 2;
      }, interval);
    }
    return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
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
      if (prev > 0) { setWordIndex(0); return prev - 1; }
      return prev;
    });
  }, []);

  const jumpTo = useCallback((i) => {
    setCurLine(i);
    setWordIndex(0);
  }, []);

  // Voice recognition
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported. Use Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setHearing(transcript);
      processTranscript(transcript);
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
    };

    rec.onend = () => {
      if (listeningRef.current) {
        try { rec.start(); } catch (e) {}
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
      listeningRef.current = true;
    } catch (e) {}
  }, []);

  const stopListening = useCallback(() => {
    setListening(false);
    listeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  // Process voice transcript — uses refs for current state
  const linesRef = useRef(lines);
  const curLineRef = useRef(curLine);
  const wordIndexRef = useRef(wordIndex);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { curLineRef.current = curLine; }, [curLine]);
  useEffect(() => { wordIndexRef.current = wordIndex; }, [wordIndex]);

  const processTranscript = useCallback((transcript) => {
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

  // Inline editing
  const startEdit = useCallback((lineIdx) => {
    setEditingLine(lineIdx);
    setTimeout(() => { if (editRef.current) { editRef.current.focus(); editRef.current.select(); } }, 0);
  }, []);

  const finishEdit = useCallback((newText) => {
    if (editingLine >= 0 && newText && newText.trim()) {
      setLines(prev => {
        const next = [...prev];
        next[editingLine] = { ...next[editingLine], text: newText.trim() };
        // Persist
        const updated = { ...scripts };
        updated[activeName] = toMD(next);
        saveScripts(updated);
        setScriptsState(updated);
        return next;
      });
    }
    setEditingLine(-1);
  }, [editingLine, scripts, activeName]);

  // Script modal
  const openModal = useCallback(() => {
    const s = getScripts();
    const name = getActiveName();
    setScriptsState(s);
    setModalSelect(name);
    setModalText(s[name] || '');
    setModalOpen(true);
  }, []);

  const saveAndClose = useCallback(() => {
    const updated = { ...scripts, [modalSelect]: modalText };
    saveScripts(updated);
    setScriptsState(updated);
    setActiveNameState(modalSelect);
    setActiveName(modalSelect);
    setLines(parseMD(modalText));
    setCurLine(0);
    setWordIndex(0);
    setModalOpen(false);
  }, [scripts, modalSelect, modalText]);

  const newScript = useCallback(() => {
    const name = prompt('Enter script name:');
    if (!name || !name.trim()) return;
    if (scripts[name.trim()]) { alert('Name already exists.'); return; }
    const updated = { ...scripts, [name.trim()]: '## New Script\n\nStart writing here.' };
    saveScripts(updated);
    setScriptsState(updated);
    setModalSelect(name.trim());
    setModalText(updated[name.trim()]);
  }, [scripts]);

  const deleteScript = useCallback(() => {
    if (Object.keys(scripts).length <= 1) { alert('Cannot delete the last script.'); return; }
    if (!confirm(`Delete "${modalSelect}"?`)) return;
    const updated = { ...scripts };
    delete updated[modalSelect];
    saveScripts(updated);
    setScriptsState(updated);
    const remaining = Object.keys(updated);
    setModalSelect(remaining[0]);
    setModalText(updated[remaining[0]] || '');
  }, [scripts, modalSelect]);

  const importScript = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.click();
  }, []);

  const handleFileImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const name = file.name.replace(/\.[^.]+$/, '');
      const updated = { ...scripts, [name]: content };
      saveScripts(updated);
      setScriptsState(updated);
      setModalSelect(name);
      setModalText(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [scripts]);

  const exportScript = useCallback(() => {
    const blob = new Blob([modalText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = modalSelect.replace(/[^a-z0-9_-]/gi, '_') + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [modalText, modalSelect]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.target.contentEditable === 'true') return;
      if (modalOpen) {
        if (e.key === 'Escape') setModalOpen(false);
        return;
      }
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
        case 's': case 'S':
          e.preventDefault();
          openModal();
          break;
        case 'r': case 'R':
          e.preventDefault();
          setCurLine(0); setWordIndex(0);
          break;
        case 'Escape':
          if (editingLine >= 0) setEditingLine(-1);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, goBack, startListening, stopListening, openModal, modalOpen, editingLine]);

  // Render
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
        <button className={styles.btn} onClick={openModal}>Scripts</button>
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
          {editingLine === curLine ? (
            <input
              ref={editRef}
              className={styles.lineEditing}
              defaultValue={cur?.text || ''}
              style={{ fontSize }}
              onKeyDown={e => { if (e.key === 'Enter') finishEdit(e.target.value); if (e.key === 'Escape') setEditingLine(-1); }}
              onBlur={e => finishEdit(e.target.value)}
            />
          ) : cur?.isTitle ? (
            <div className={styles.titleLine} onDoubleClick={() => startEdit(curLine)}>
              {cur.text}
            </div>
          ) : (
            <div onDoubleClick={() => startEdit(curLine)}>
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
            return editingLine === lineIdx ? (
              <input
                key={lineIdx}
                ref={editRef}
                className={styles.lineEditing}
                defaultValue={l.text}
                style={{ fontSize }}
                onKeyDown={e => { if (e.key === 'Enter') finishEdit(e.target.value); if (e.key === 'Escape') setEditingLine(-1); }}
                onBlur={e => finishEdit(e.target.value)}
              />
            ) : (
              <div
                key={lineIdx}
                className={`${styles.line} ${l.isTitle ? styles.titleLine : ''}`}
                onClick={() => jumpTo(lineIdx)}
                onDoubleClick={() => startEdit(lineIdx)}
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
          <kbd>Dbl-click</kbd> Edit &nbsp; <kbd>S</kbd> Scripts
        </span>
        <span>Line {curLine + 1} / {lines.length}</span>
      </div>

      {/* Script modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Script Manager</h2>
              <button className={styles.modalClose} onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.scriptSelector}>
                <select
                  value={modalSelect}
                  onChange={e => {
                    setModalSelect(e.target.value);
                    setModalText(scripts[e.target.value] || '');
                  }}
                  className={styles.selectEl}
                >
                  {Object.keys(scripts).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <button className={styles.modalBtn} onClick={newScript}>New</button>
                <button className={`${styles.modalBtn} ${styles.danger}`} onClick={deleteScript}>Delete</button>
              </div>
              <textarea
                className={styles.textarea}
                value={modalText}
                onChange={e => setModalText(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div className={styles.modalFooter}>
              <div>
                <button className={styles.modalBtn} onClick={() => setModalText(DEFAULT_SCRIPT)}>Load Default</button>
                <button className={styles.modalBtn} onClick={importScript}>Import .md</button>
                <button className={styles.modalBtn} onClick={exportScript}>Export .md</button>
              </div>
              <div>
                <button className={styles.modalBtn} onClick={() => setModalOpen(false)}>Cancel</button>
                <button className={`${styles.modalBtn} ${styles.primary}`} onClick={saveAndClose}>Save & Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />
    </div>
  );
}
