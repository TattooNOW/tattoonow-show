/**
 * TypeScript types for TattooNOW Show data model.
 * Derived from existing JSON structures in /public/data/
 */

// ── Show Script (episode-level) ──────────────────────────────────────

export type ScriptSegmentType = 'intro' | 'discussion' | 'transition' | 'outro' | 'education';

export interface ShowScriptSegment {
  segment: string;
  timeCode: string;
  title: string;
  type: ScriptSegmentType;
  talkingPoints: string[];
  presenterNotes: string;
  cue?: string;
}

// ── Episode ──────────────────────────────────────────────────────────

export interface Episode {
  EPISODE_NUMBER: string;
  EPISODE_TITLE: string;
  AIR_DATE: string;
  DURATION: string;
  HOST: string;

  GUEST_NAME?: string;
  GUEST_TITLE?: string;
  GUEST_BIO?: string;
  GUEST_INSTAGRAM?: string;
  GUEST_WEBSITE?: string;

  QR_CODE_URL?: string;
  HIGHLEVEL_QR_URL?: string;
  QR_CODE_MESSAGE?: string;

  SHOW_SCRIPT?: ShowScriptSegment[];

  YOUTUBE_TITLE?: string;
  YOUTUBE_DESCRIPTION?: string;
  YOUTUBE_TAGS?: string;
  INSTAGRAM_CAPTION?: string;
  INSTAGRAM_HASHTAGS?: string;
  LINKEDIN_POST?: string;
  NEWSLETTER_TOPIC?: string;
  NEWSLETTER_CTA?: string;
  GENERATION_DATE?: string;
}

// ── Tape Types ───────────────────────────────────────────────────────

export type TapeType =
  | 'interview'
  | 'text-qa'
  | 'panel'
  | 'variety'
  | 'education'
  | 'clips'
  | 'promo'
  | 'sponsor'
  | 'ad';

export type TapeStatus = 'opportunity' | 'collecting' | 'review' | 'complete' | 'archived';

export type VarietyVariant =
  | 'critique'
  | 'who-tattooed-it'
  | 'drawing-exercise'
  | 'call-a-friend'
  | 'hot-takes'
  | 'tattoo-roulette'
  | 'before-after'
  | 'viewer-spotlight';

// ── Media ────────────────────────────────────────────────────────────

export interface MediaItem {
  url: string;
  localPath?: string;
  description: string;
  aspect: string;
  source?: string;
  width?: number;
  height?: number;
  tags?: string[];
}

export interface VideoItem extends MediaItem {
  duration: number;
  trimStart?: string;
  trimEnd?: string;
  sourceUrl?: string;
}

export interface TapeMedia {
  images: MediaItem[];
  videos: VideoItem[];
}

// ── Audio ────────────────────────────────────────────────────────────

export interface AudioTrack {
  url: string;
  title?: string;
  license?: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  notes?: string;
  usage?: string;
}

export interface SoundEffect {
  id: string;
  url: string;
  trigger: string;
  notes?: string;
}

export interface VoiceoverCue {
  cue: string;
  text: string;
  voice: string;
  notes?: string;
}

export interface TapeAudio {
  backgroundMusic?: AudioTrack;
  voiceover?: {
    script: VoiceoverCue[];
    preRecorded: boolean;
    notes?: string;
  };
  soundEffects?: SoundEffect[];
}

// ── Subject (for interview / text-qa) ────────────────────────────────

export interface TapeSubject {
  name: string;
  title: string;
  bio: string;
  style: string;
  location: string;
  instagram: string;
  website?: string;
}

// ── Panelist (for panel tape) ────────────────────────────────────────

export interface Panelist {
  name: string;
  title: string;
  bio: string;
  instagram: string;
  location: string;
  headshot?: string;
  portfolio?: string[];
  pricingModel?: string;
  perspective?: string;
}

// ── Content shapes per tape type ─────────────────────────────────────

export interface InterviewContent {
  talkingPoints: string[];
  presenterNotes: string;
}

export interface TextQAEntry {
  question: string;
  answer: string;
  pullQuote?: string;
  displayImages?: number[];
  voiceoverCue?: string;
}

export interface TextQAContent {
  textInterview: TextQAEntry[];
  presenterNotes: string;
}

export interface PanelContent {
  topic: string;
  topicDescription: string;
  talkingPoints: string[];
  presenterNotes: string;
}

export interface EducationSlide {
  title: string;
  subtitle?: string;
  keyPoints: string[];
  stats?: Array<{ value: string; label: string }>;
  layout?: string;
}

export interface EducationContent {
  source?: {
    type: string;
    title: string;
    url: string;
    author: string;
    publishDate: string;
  };
  slides: EducationSlide[];
  presenterNotes: string;
}

export interface ClipEntry {
  sourceEpisode: string;
  sourceTitle: string;
  sourceGuest: string;
  timeStart: string;
  timeEnd: string;
  duration: number;
  description: string;
  transcriptSnippet: string;
  hostBridge?: string;
}

export interface HostScript {
  script: string[];
  presenterNotes: string;
}

export interface ClipsContent {
  hostIntro: HostScript;
  clips: ClipEntry[];
  hostOutro: HostScript;
  presenterNotes: string;
}

export interface SponsorInfo {
  name: string;
  type?: string;
  logo?: string;
  website?: string;
  instagram?: string;
  qrUrl?: string;
  qrMessage?: string;
  highlevelUrl?: string;
  adCopy?: string;
  eventDates?: string;
  eventLocation?: string;
  featuredArtists?: Array<{
    name: string;
    instagram: string;
    image?: string;
  }>;
}

export interface PromoContent {
  presenterNotes: string;
}

// ── Variety content (varies by variant) ──────────────────────────────

export interface WhoTattooedItRound {
  image: string;
  imageDescription: string;
  hints: string[];
  answer: string;
  answerInstagram: string;
  revealImage?: string;
  revealNote?: string;
}

export interface VarietyContent {
  hostIntro?: HostScript;
  hostOutro?: HostScript;
  rounds?: WhoTattooedItRound[];
  presenterNotes: string;
  [key: string]: unknown; // variant-specific fields
}

// ── Tape (union) ─────────────────────────────────────────────────────

export interface TapeBase {
  id: string;
  type: TapeType;
  status: TapeStatus;
  createdBy: string;
  createdDate: string;
  estimatedDuration: number;
  tags: string[];
  media?: TapeMedia;
  audio?: TapeAudio;
}

export interface InterviewTape extends TapeBase {
  type: 'interview';
  subject: TapeSubject;
  content: InterviewContent;
}

export interface TextQATape extends TapeBase {
  type: 'text-qa';
  subject: TapeSubject;
  content: TextQAContent;
}

export interface PanelTape extends TapeBase {
  type: 'panel';
  panelists: Panelist[];
  content: PanelContent;
}

export interface VarietyTape extends TapeBase {
  type: 'variety';
  variant: VarietyVariant;
  content: VarietyContent;
}

export interface EducationTape extends TapeBase {
  type: 'education';
  content: EducationContent;
}

export interface ClipsTape extends TapeBase {
  type: 'clips';
  content: ClipsContent;
}

export interface PromoTape extends TapeBase {
  type: 'promo';
  sponsor: SponsorInfo;
  content: PromoContent;
}

export interface SponsorTape extends TapeBase {
  type: 'sponsor';
  sponsor: SponsorInfo;
  content: PromoContent;
}

export interface AdTape extends TapeBase {
  type: 'ad';
  sponsor: SponsorInfo;
  content: PromoContent;
}

export type Tape =
  | InterviewTape
  | TextQATape
  | PanelTape
  | VarietyTape
  | EducationTape
  | ClipsTape
  | PromoTape
  | SponsorTape
  | AdTape;

// ── Show (assembled from format + tapes) ─────────────────────────────

export interface RundownEntry {
  timeCode: string;
  duration: string;
  type: string;
  label?: string;
  tapeId?: string;
  tapeType?: TapeType;
  talkingPoints?: string[];
  presenterNotes?: string;
  config?: {
    overlays?: string[];
    persistQR?: boolean;
    mediaType?: string;
    range?: [number, number];
    interleavePortfolio?: boolean;
    showAllPanelists?: boolean;
  };
  optional?: boolean;
}

export interface Show {
  id: string;
  version: string;
  episode: {
    number: number;
    title: string;
    airDate: string;
    duration: number;
    host: string;
  };
  rundown: RundownEntry[];
  showQRCodes?: Record<string, {
    url: string;
    message: string;
    highlevelUrl?: string;
  }>;
  social?: {
    youtube?: { title: string; description: string; tags: string[] };
    instagram?: { caption: string; hashtags: string };
    linkedin?: { post: string };
    newsletter?: { topic: string; cta: string };
  };
}

// ── Show Formats ─────────────────────────────────────────────────────

export interface SkeletonSegment {
  id: string;
  type: string;
  label: string;
  duration: string;
  position: string;
  content?: Record<string, unknown>;
  hostScript?: Record<string, unknown>;
  slots?: Array<{ type: string; duration: string; label: string }>;
}

export interface TapeSlotSpec {
  count: number;
  label: string;
}

export type RundownTemplateEntry = string | {
  type: string;
  duration: string;
  tapeSlot: string;
  config?: Record<string, unknown>;
  label?: string;
  optional?: boolean;
};

export interface ShowFormat {
  id: string;
  name: string;
  description: string;
  targetDuration: number;
  availableForTapes: number;
  bestFor: string;
  analytics: { trackAs: string; hypothesis: string };
  requiredTapeSlots: Record<string, TapeSlotSpec>;
  optionalTapeSlots: Record<string, TapeSlotSpec>;
  rundownTemplate: RundownTemplateEntry[];
}

export interface ShowFormatsFile {
  skeleton: {
    segments: SkeletonSegment[];
    totalRigidTime: string;
    note: string;
  };
  formats: Record<string, ShowFormat>;
}

// ── Talent Pool ──────────────────────────────────────────────────────

export type TalentRole = 'interview' | 'text-qa' | 'panelist' | 'variety';
export type TalentStatus = 'available' | 'contacted' | 'confirmed' | 'declined' | 'appeared' | 'recurring';

export interface TalentAppearance {
  episode: number;
  tapeType: string;
  date: string;
}

export interface TalentMember {
  id: string;
  name: string;
  instagram: string;
  location: string;
  style: string;
  roles: TalentRole[];
  status: TalentStatus;
  tags: string[];
  notes: string;
  appearances: TalentAppearance[];
  contactMethod: string;
  availability: string;
}

export interface TalentPool {
  roles: Record<string, string>;
  statuses: Record<string, string>;
  talent: TalentMember[];
  agentNotes: Record<string, string>;
}

// ── Seasons & Themes ─────────────────────────────────────────────────

export interface SeasonArc {
  name: string;
  episodes: number[];
  description: string;
  tags: string[];
}

export interface Season {
  id: string;
  name: string;
  description: string;
  episodeRange: [number, number];
  dateRange: [string, string];
  overallTheme: string;
  status: 'active' | 'planned' | 'completed';
  arcs: SeasonArc[];
  talentStrategy: string;
}

export interface Theme {
  label: string;
  subthemes: string[];
  talentTags: string[];
  educationSources: string[];
  varietyFit: string[];
}

export interface ThemesSeasonsFile {
  seasons: Season[];
  themes: Record<string, Theme>;
  agentUsage: Record<string, string>;
}

// ── Teleprompter ─────────────────────────────────────────────────────

export interface TeleprompterLine {
  text: string;
  isTitle: boolean;
  segmentIndex?: number;
  lineType?: 'segment-title' | 'talking-point' | 'presenter-note' | 'cue';
}
