/**
 * Bidirectional SHOW_SCRIPT ↔ Markdown conversion.
 *
 * Markdown convention (segments separated by ---):
 *
 *   ---
 *   ## SEGMENT_LABEL — Segment Title
 *   *timecode*
 *
 *   - Talking point one
 *   - Talking point two
 *
 *   > Presenter notes in blockquotes.
 *   > Can span multiple lines.
 *
 *   CUE: Technical cue text
 *   ---
 */

import type { ShowScriptSegment, ScriptSegmentType, TeleprompterLine } from '../types';

// ── JSON → Markdown ──────────────────────────────────────────────────

export function scriptToMarkdown(segments: ShowScriptSegment[]): string {
  return segments.map(seg => {
    const lines: string[] = [];

    // Heading: ## SEGMENT — Title
    lines.push(`## ${seg.segment} — ${seg.title}`);

    // Timecode as italic
    lines.push(`*${seg.timeCode}*`);

    lines.push('');

    // Talking points as bullet list
    if (seg.talkingPoints && seg.talkingPoints.length > 0) {
      for (const tp of seg.talkingPoints) {
        lines.push(`- ${tp}`);
      }
      lines.push('');
    }

    // Presenter notes as blockquote
    if (seg.presenterNotes) {
      const noteLines = seg.presenterNotes.split('\n');
      for (const nl of noteLines) {
        lines.push(`> ${nl}`);
      }
      lines.push('');
    }

    // Cue
    if (seg.cue) {
      lines.push(seg.cue.startsWith('CUE:') ? seg.cue : `CUE: ${seg.cue}`);
    }

    return lines.join('\n');
  }).join('\n\n---\n\n');
}

// ── Markdown → JSON ──────────────────────────────────────────────────

function inferType(label: string): ScriptSegmentType {
  const upper = label.toUpperCase();
  if (upper === 'INTRO' || upper.includes('INTRO')) return 'intro';
  if (upper.includes('AD BREAK') || upper.includes('TRANSITION')) return 'transition';
  if (upper === 'CLOSING' || upper === 'OUTRO' || upper.includes('CLOSING') || upper.includes('OUTRO')) return 'outro';
  if (upper.includes('EDUCATION')) return 'education';
  return 'discussion';
}

export function markdownToScript(md: string): ShowScriptSegment[] {
  // Split on horizontal rules (---)
  const blocks = md.split(/\n---\n/).map(b => b.trim()).filter(Boolean);

  return blocks.map(block => {
    const lines = block.split('\n');

    let segment = '';
    let title = '';
    let timeCode = '';
    const talkingPoints: string[] = [];
    const noteLines: string[] = [];
    let cue = '';
    let explicitType: ScriptSegmentType | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Heading: ## LABEL — Title
      if (trimmed.startsWith('## ')) {
        const rest = trimmed.slice(3).trim();
        // Split on — or -- or -
        const dashMatch = rest.match(/^(.+?)\s*[—–-]{1,3}\s*(.+)$/);
        if (dashMatch) {
          segment = dashMatch[1].trim();
          title = dashMatch[2].trim();
        } else {
          segment = rest;
          title = rest;
        }
        continue;
      }

      // H1 heading (fallback)
      if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
        const rest = trimmed.slice(2).trim();
        const dashMatch = rest.match(/^(.+?)\s*[—–-]{1,3}\s*(.+)$/);
        if (dashMatch) {
          segment = dashMatch[1].trim();
          title = dashMatch[2].trim();
        } else {
          segment = rest;
          title = rest;
        }
        continue;
      }

      // Timecode: *0:00* or _0:00_
      if (/^\*[^*]+\*$/.test(trimmed) || /^_[^_]+_$/.test(trimmed)) {
        timeCode = trimmed.slice(1, -1).trim();
        continue;
      }

      // Explicit type override: type: discussion
      if (trimmed.startsWith('type:')) {
        explicitType = trimmed.slice(5).trim() as ScriptSegmentType;
        continue;
      }

      // Talking point: - text
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        talkingPoints.push(trimmed.slice(2).trim());
        continue;
      }

      // Blockquote: > notes
      if (trimmed.startsWith('> ')) {
        noteLines.push(trimmed.slice(2).trim());
        continue;
      }
      // Blockquote continuation (just >)
      if (trimmed === '>') {
        noteLines.push('');
        continue;
      }

      // Cue line
      if (trimmed.startsWith('CUE:')) {
        cue = trimmed;
        continue;
      }
    }

    return {
      segment,
      timeCode,
      title,
      type: explicitType || inferType(segment),
      talkingPoints,
      presenterNotes: noteLines.join(' ').trim(),
      ...(cue ? { cue } : {}),
    } as ShowScriptSegment;
  });
}

// ── Teleprompter line generation ─────────────────────────────────────

/**
 * Generate a flat array of teleprompter lines from SHOW_SCRIPT segments.
 * Each line is tagged with its segment index so the teleprompter can
 * auto-scroll to the correct section when the slide changes.
 */
export function generateTeleprompterLines(segments: ShowScriptSegment[]): TeleprompterLine[] {
  const lines: TeleprompterLine[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // Segment title
    lines.push({
      text: `${seg.segment} — ${seg.title}`,
      isTitle: true,
      segmentIndex: i,
      lineType: 'segment-title',
    });

    // Talking points
    for (const tp of seg.talkingPoints) {
      lines.push({
        text: tp,
        isTitle: false,
        segmentIndex: i,
        lineType: 'talking-point',
      });
    }

    // Presenter notes (as a single block if present)
    if (seg.presenterNotes) {
      lines.push({
        text: seg.presenterNotes,
        isTitle: false,
        segmentIndex: i,
        lineType: 'presenter-note',
      });
    }

    // Cue
    if (seg.cue) {
      lines.push({
        text: seg.cue,
        isTitle: true,
        segmentIndex: i,
        lineType: 'cue',
      });
    }
  }

  return lines;
}

/**
 * Find the first teleprompter line index for a given segment index.
 */
export function findLineForSegment(lines: TeleprompterLine[], segmentIndex: number): number {
  return lines.findIndex(l => l.segmentIndex === segmentIndex);
}
