/**
 * Markdown ↔ JSON conversion pipeline for TattooNOW Show.
 *
 * Content creators author in markdown, the system stores structured JSON.
 * These parsers bridge the two representations bidirectionally.
 */

export {
  scriptToMarkdown,
  markdownToScript,
  generateTeleprompterLines,
  findLineForSegment,
} from './script-parser';

export {
  tapeContentToMarkdown,
  markdownToTapeContent,
} from './tape-parser';
