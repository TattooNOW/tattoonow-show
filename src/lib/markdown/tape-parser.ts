/**
 * Bidirectional tape content ↔ Markdown conversion.
 *
 * Each tape type has its own markdown convention, but all follow
 * consistent patterns:
 *   - # Heading for sections
 *   - - bullets for lists
 *   - > blockquotes for presenter notes
 *   - **Bold:** for labeled fields
 *   - Stats: value | label for education stats
 */

import type {
  Tape,
  TapeType,
  InterviewContent,
  TextQAContent,
  TextQAEntry,
  PanelContent,
  EducationContent,
  EducationSlide,
  ClipsContent,
  HostScript,
  ClipEntry,
  VarietyContent,
} from '../types';

// ── Generic helpers ──────────────────────────────────────────────────

function blockquoteLines(text: string): string {
  if (!text) return '';
  return text.split('\n').map(l => `> ${l}`).join('\n');
}

function parseBlockquote(lines: string[]): string {
  return lines
    .filter(l => l.trim().startsWith('>'))
    .map(l => l.trim().replace(/^>\s?/, ''))
    .join(' ')
    .trim();
}

function parseBullets(lines: string[]): string[] {
  return lines
    .filter(l => /^\s*[-*]\s/.test(l))
    .map(l => l.trim().replace(/^[-*]\s+/, ''));
}

// ── Interview ────────────────────────────────────────────────────────

function interviewToMarkdown(content: InterviewContent): string {
  const parts: string[] = [];

  parts.push('# Talking Points');
  for (const tp of content.talkingPoints) {
    parts.push(`- ${tp}`);
  }

  if (content.presenterNotes) {
    parts.push('');
    parts.push('# Presenter Notes');
    parts.push(blockquoteLines(content.presenterNotes));
  }

  return parts.join('\n');
}

function markdownToInterview(md: string): InterviewContent {
  const lines = md.split('\n');
  let section = '';
  const talkingPoints: string[] = [];
  const noteLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      section = trimmed.slice(2).trim().toLowerCase();
      continue;
    }
    if (section.includes('talking') && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      talkingPoints.push(trimmed.slice(2).trim());
    }
    if (section.includes('note') && trimmed.startsWith('>')) {
      noteLines.push(trimmed.replace(/^>\s?/, ''));
    }
  }

  return {
    talkingPoints,
    presenterNotes: noteLines.join(' ').trim(),
  };
}

// ── Text Q&A ─────────────────────────────────────────────────────────

function textQAToMarkdown(content: TextQAContent): string {
  const parts: string[] = [];

  for (let i = 0; i < content.textInterview.length; i++) {
    const entry = content.textInterview[i];
    parts.push(`# Q${i + 1}: ${entry.question}`);
    parts.push(entry.answer);
    if (entry.pullQuote) {
      parts.push(`**Pull Quote:** "${entry.pullQuote}"`);
    }
    if (entry.displayImages && entry.displayImages.length > 0) {
      parts.push(`Images: ${entry.displayImages.join(', ')}`);
    }
    parts.push('');
  }

  if (content.presenterNotes) {
    parts.push('# Presenter Notes');
    parts.push(blockquoteLines(content.presenterNotes));
  }

  return parts.join('\n');
}

function markdownToTextQA(md: string): TextQAContent {
  const entries: TextQAEntry[] = [];
  const noteLines: string[] = [];
  let currentEntry: Partial<TextQAEntry> | null = null;
  let inNotes = false;

  for (const line of md.split('\n')) {
    const trimmed = line.trim();

    // Question heading
    const qMatch = trimmed.match(/^#\s+Q\d+:\s*(.+)/);
    if (qMatch) {
      if (currentEntry?.question) {
        entries.push(currentEntry as TextQAEntry);
      }
      currentEntry = { question: qMatch[1].trim(), answer: '' };
      inNotes = false;
      continue;
    }

    // Presenter notes section
    if (trimmed.match(/^#\s+Presenter Notes/i)) {
      if (currentEntry?.question) {
        entries.push(currentEntry as TextQAEntry);
        currentEntry = null;
      }
      inNotes = true;
      continue;
    }

    if (inNotes && trimmed.startsWith('>')) {
      noteLines.push(trimmed.replace(/^>\s?/, ''));
      continue;
    }

    if (!currentEntry) continue;

    // Pull quote
    const pullMatch = trimmed.match(/^\*\*Pull Quote:\*\*\s*"?(.+?)"?\s*$/);
    if (pullMatch) {
      currentEntry.pullQuote = pullMatch[1].trim();
      continue;
    }

    // Images
    const imgMatch = trimmed.match(/^Images:\s*(.+)/);
    if (imgMatch) {
      currentEntry.displayImages = imgMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      continue;
    }

    // Answer text (non-empty, non-heading lines)
    if (trimmed && !trimmed.startsWith('#')) {
      currentEntry.answer = currentEntry.answer
        ? `${currentEntry.answer} ${trimmed}`
        : trimmed;
    }
  }

  if (currentEntry?.question) {
    entries.push(currentEntry as TextQAEntry);
  }

  return {
    textInterview: entries,
    presenterNotes: noteLines.join(' ').trim(),
  };
}

// ── Panel ────────────────────────────────────────────────────────────

function panelToMarkdown(content: PanelContent): string {
  const parts: string[] = [];

  parts.push('# Topic');
  parts.push(content.topic);
  parts.push('');
  parts.push('# Description');
  parts.push(content.topicDescription);
  parts.push('');
  parts.push('# Talking Points');
  for (const tp of content.talkingPoints) {
    parts.push(`- ${tp}`);
  }

  if (content.presenterNotes) {
    parts.push('');
    parts.push('# Presenter Notes');
    parts.push(blockquoteLines(content.presenterNotes));
  }

  return parts.join('\n');
}

function markdownToPanel(md: string): PanelContent {
  const lines = md.split('\n');
  let section = '';
  let topic = '';
  let description = '';
  const talkingPoints: string[] = [];
  const noteLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      section = trimmed.slice(2).trim().toLowerCase();
      continue;
    }

    if (section === 'topic' && trimmed) {
      topic = topic ? `${topic} ${trimmed}` : trimmed;
    } else if (section === 'description' && trimmed) {
      description = description ? `${description} ${trimmed}` : trimmed;
    } else if (section.includes('talking') && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      talkingPoints.push(trimmed.slice(2).trim());
    } else if (section.includes('note') && trimmed.startsWith('>')) {
      noteLines.push(trimmed.replace(/^>\s?/, ''));
    }
  }

  return {
    topic,
    topicDescription: description,
    talkingPoints,
    presenterNotes: noteLines.join(' ').trim(),
  };
}

// ── Education ────────────────────────────────────────────────────────

function educationToMarkdown(content: EducationContent): string {
  const parts: string[] = [];

  if (content.source) {
    parts.push(`Source: ${content.source.title} (${content.source.url})`);
    parts.push('');
  }

  for (const slide of content.slides) {
    parts.push(`## ${slide.title}`);
    if (slide.subtitle) {
      parts.push(`*${slide.subtitle}*`);
    }
    parts.push('');
    for (const kp of slide.keyPoints) {
      parts.push(`- ${kp}`);
    }
    if (slide.stats && slide.stats.length > 0) {
      parts.push('');
      for (const stat of slide.stats) {
        parts.push(`Stats: ${stat.value} | ${stat.label}`);
      }
    }
    if (slide.layout) {
      parts.push(`Layout: ${slide.layout}`);
    }
    parts.push('');
  }

  if (content.presenterNotes) {
    parts.push('# Presenter Notes');
    parts.push(blockquoteLines(content.presenterNotes));
  }

  return parts.join('\n');
}

function markdownToEducation(md: string): EducationContent {
  const slides: EducationSlide[] = [];
  const noteLines: string[] = [];
  let currentSlide: Partial<EducationSlide> | null = null;
  let inNotes = false;
  let source: EducationContent['source'] | undefined;

  for (const line of md.split('\n')) {
    const trimmed = line.trim();

    // Source line
    const sourceMatch = trimmed.match(/^Source:\s*(.+?)\s*\((.+)\)\s*$/);
    if (sourceMatch) {
      source = {
        type: 'blog',
        title: sourceMatch[1].trim(),
        url: sourceMatch[2].trim(),
        author: '',
        publishDate: '',
      };
      continue;
    }

    // Presenter notes heading
    if (trimmed.match(/^#\s+Presenter Notes/i)) {
      if (currentSlide?.title) {
        slides.push({ keyPoints: [], ...currentSlide } as EducationSlide);
        currentSlide = null;
      }
      inNotes = true;
      continue;
    }

    if (inNotes && trimmed.startsWith('>')) {
      noteLines.push(trimmed.replace(/^>\s?/, ''));
      continue;
    }

    // Slide heading
    if (trimmed.startsWith('## ')) {
      if (currentSlide?.title) {
        slides.push({ keyPoints: [], ...currentSlide } as EducationSlide);
      }
      currentSlide = { title: trimmed.slice(3).trim(), keyPoints: [] };
      inNotes = false;
      continue;
    }

    if (!currentSlide) continue;

    // Subtitle (italic)
    if (/^\*[^*]+\*$/.test(trimmed) || /^_[^_]+_$/.test(trimmed)) {
      currentSlide.subtitle = trimmed.slice(1, -1).trim();
      continue;
    }

    // Key points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentSlide.keyPoints = currentSlide.keyPoints || [];
      currentSlide.keyPoints.push(trimmed.slice(2).trim());
      continue;
    }

    // Stats
    const statsMatch = trimmed.match(/^Stats:\s*(.+?)\s*\|\s*(.+)$/);
    if (statsMatch) {
      currentSlide.stats = currentSlide.stats || [];
      currentSlide.stats.push({ value: statsMatch[1].trim(), label: statsMatch[2].trim() });
      continue;
    }

    // Layout
    const layoutMatch = trimmed.match(/^Layout:\s*(.+)$/);
    if (layoutMatch) {
      currentSlide.layout = layoutMatch[1].trim();
      continue;
    }
  }

  if (currentSlide?.title) {
    slides.push({ keyPoints: [], ...currentSlide } as EducationSlide);
  }

  return {
    ...(source ? { source } : {}),
    slides,
    presenterNotes: noteLines.join(' ').trim(),
  };
}

// ── Clips ────────────────────────────────────────────────────────────

function hostScriptToMd(label: string, hs: HostScript): string {
  const parts: string[] = [`# ${label}`];
  for (const line of hs.script) {
    parts.push(`- ${line}`);
  }
  if (hs.presenterNotes) {
    parts.push(blockquoteLines(hs.presenterNotes));
  }
  return parts.join('\n');
}

function clipsToMarkdown(content: ClipsContent): string {
  const parts: string[] = [];

  parts.push(hostScriptToMd('Host Intro', content.hostIntro));
  parts.push('');

  for (let i = 0; i < content.clips.length; i++) {
    const clip = content.clips[i];
    parts.push(`## Clip ${i + 1}: ${clip.sourceGuest}`);
    parts.push(`From: ${clip.sourceTitle} (${clip.sourceEpisode})`);
    parts.push(`Time: ${clip.timeStart} - ${clip.timeEnd}`);
    parts.push(`> ${clip.transcriptSnippet}`);
    if (clip.hostBridge) {
      parts.push(`Bridge: ${clip.hostBridge}`);
    }
    parts.push('');
  }

  parts.push(hostScriptToMd('Host Outro', content.hostOutro));

  if (content.presenterNotes) {
    parts.push('');
    parts.push('# Presenter Notes');
    parts.push(blockquoteLines(content.presenterNotes));
  }

  return parts.join('\n');
}

function markdownToClips(md: string): ClipsContent {
  const clips: ClipEntry[] = [];
  const introScript: string[] = [];
  const introNotes: string[] = [];
  const outroScript: string[] = [];
  const outroNotes: string[] = [];
  const overallNotes: string[] = [];
  let section = '';
  let currentClip: Partial<ClipEntry> | null = null;

  for (const line of md.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.match(/^#\s+Host Intro/i)) {
      section = 'intro';
      continue;
    }
    if (trimmed.match(/^#\s+Host Outro/i)) {
      if (currentClip?.sourceGuest) {
        clips.push(currentClip as ClipEntry);
        currentClip = null;
      }
      section = 'outro';
      continue;
    }
    if (trimmed.match(/^#\s+Presenter Notes/i)) {
      if (currentClip?.sourceGuest) {
        clips.push(currentClip as ClipEntry);
        currentClip = null;
      }
      section = 'notes';
      continue;
    }

    // Clip heading
    const clipMatch = trimmed.match(/^##\s+Clip\s+\d+:\s*(.+)/);
    if (clipMatch) {
      if (currentClip?.sourceGuest) {
        clips.push(currentClip as ClipEntry);
      }
      currentClip = { sourceGuest: clipMatch[1].trim(), sourceEpisode: '', sourceTitle: '', timeStart: '', timeEnd: '', duration: 0, description: '', transcriptSnippet: '' };
      section = 'clip';
      continue;
    }

    if (section === 'intro') {
      if (trimmed.startsWith('- ')) introScript.push(trimmed.slice(2).trim());
      else if (trimmed.startsWith('>')) introNotes.push(trimmed.replace(/^>\s?/, ''));
    } else if (section === 'outro') {
      if (trimmed.startsWith('- ')) outroScript.push(trimmed.slice(2).trim());
      else if (trimmed.startsWith('>')) outroNotes.push(trimmed.replace(/^>\s?/, ''));
    } else if (section === 'notes' && trimmed.startsWith('>')) {
      overallNotes.push(trimmed.replace(/^>\s?/, ''));
    } else if (section === 'clip' && currentClip) {
      const fromMatch = trimmed.match(/^From:\s*(.+?)\s*\((.+)\)\s*$/);
      if (fromMatch) { currentClip.sourceTitle = fromMatch[1].trim(); currentClip.sourceEpisode = fromMatch[2].trim(); continue; }
      const timeMatch = trimmed.match(/^Time:\s*(.+?)\s*-\s*(.+)$/);
      if (timeMatch) { currentClip.timeStart = timeMatch[1].trim(); currentClip.timeEnd = timeMatch[2].trim(); continue; }
      if (trimmed.startsWith('>')) { currentClip.transcriptSnippet = trimmed.replace(/^>\s?/, ''); continue; }
      const bridgeMatch = trimmed.match(/^Bridge:\s*(.+)/);
      if (bridgeMatch) { currentClip.hostBridge = bridgeMatch[1].trim(); continue; }
    }
  }

  if (currentClip?.sourceGuest) {
    clips.push(currentClip as ClipEntry);
  }

  return {
    hostIntro: { script: introScript, presenterNotes: introNotes.join(' ').trim() },
    clips,
    hostOutro: { script: outroScript, presenterNotes: outroNotes.join(' ').trim() },
    presenterNotes: overallNotes.join(' ').trim(),
  };
}

// ── Variety (generic — host scripts + notes) ─────────────────────────

function varietyToMarkdown(content: VarietyContent): string {
  const parts: string[] = [];

  if (content.hostIntro) {
    parts.push(hostScriptToMd('Host Intro', content.hostIntro));
    parts.push('');
  }

  if (content.hostOutro) {
    parts.push(hostScriptToMd('Host Outro', content.hostOutro));
    parts.push('');
  }

  if (content.presenterNotes) {
    parts.push('# Presenter Notes');
    parts.push(blockquoteLines(content.presenterNotes));
  }

  return parts.join('\n');
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Convert a tape's content to markdown for editing.
 */
export function tapeContentToMarkdown(tape: Tape): string {
  switch (tape.type) {
    case 'interview':
      return interviewToMarkdown(tape.content);
    case 'text-qa':
      return textQAToMarkdown(tape.content);
    case 'panel':
      return panelToMarkdown(tape.content);
    case 'education':
      return educationToMarkdown(tape.content);
    case 'clips':
      return clipsToMarkdown(tape.content);
    case 'variety':
      return varietyToMarkdown(tape.content);
    case 'promo':
    case 'sponsor':
    case 'ad':
      // Simple types: just presenter notes
      if (tape.content?.presenterNotes) {
        return `# Presenter Notes\n${blockquoteLines(tape.content.presenterNotes)}`;
      }
      return '';
    default:
      return '';
  }
}

/**
 * Convert markdown back to tape content for the given type.
 */
export function markdownToTapeContent(
  md: string,
  type: TapeType
): Record<string, unknown> {
  switch (type) {
    case 'interview':
      return markdownToInterview(md);
    case 'text-qa':
      return markdownToTextQA(md);
    case 'panel':
      return markdownToPanel(md);
    case 'education':
      return markdownToEducation(md);
    case 'clips':
      return markdownToClips(md);
    case 'variety':
    case 'promo':
    case 'sponsor':
    case 'ad': {
      // Extract just presenter notes from blockquotes
      const noteLines = md.split('\n')
        .filter(l => l.trim().startsWith('>'))
        .map(l => l.trim().replace(/^>\s?/, ''));
      return { presenterNotes: noteLines.join(' ').trim() };
    }
    default:
      return {};
  }
}
