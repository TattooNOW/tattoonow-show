# TattooNOW Weekly Show Production System

A complete production system for managing the TattooNOW Weekly Show - a 52-week business education series for tattoo artists.

## 📁 System Overview

This system provides infrastructure for producing weekly episodes including:
- ✅ Script generation from templates
- ✅ Episode data management
- ✅ Content calendar planning
- ✅ Presentation slide decks
- ✅ Social media asset planning
- ✅ Newsletter integration

## 🗂️ Directory Structure

```
show-system/
├── templates/              # Script templates
│   └── episode-script.md   # Master episode script template
├── scripts/                # Automation scripts
│   └── generate-script.js  # Script generator (placeholder replacement)
├── sample/                 # Sample episode data
│   └── episode-1.json      # Complete Episode 1 sample data
├── schemas/                # JSON schemas
│   └── calendar-schema.json # Content calendar schema
├── presentations/          # Presentation slide decks
│   └── P1-website-fundamentals.md # Episode 1 presentation
├── output/                 # Generated outputs
│   ├── scripts/            # Generated episode scripts
│   │   └── episode-1.md    # Generated Episode 1 script
│   └── calendars/          # Content calendars
│       └── 2026-content-calendar.json # Full year calendar
├── SYSTEM_PROMPT.md        # AI guidance for content creation
└── README.md               # This file
```

## 🚀 Quick Start

### Generate Episode 1 Script

```bash
cd show-system
node scripts/generate-script.js --data sample/episode-1.json
```

Output: `output/scripts/episode-1.md`

### Generate Custom Episode

1. Create episode data JSON file (use `sample/episode-1.json` as template)
2. Run generator:
   ```bash
   node scripts/generate-script.js --data path/to/your-episode.json --output custom-name.md
   ```

## 📋 Episode Production Workflow

### 1. Content Planning
- Review content calendar: `output/calendars/2026-content-calendar.json`
- Identify episode topic, category, and presentation alignment
- Confirm guest and air date

### 2. Create Episode Data
- Copy `sample/episode-1.json` as starting template
- Fill in all placeholder fields with episode-specific content:
  - Episode metadata (title, date, guest info)
  - Scripts for each segment
  - Presentation slide references
  - Social media assets
  - Newsletter topic

Refer to `SYSTEM_PROMPT.md` for content guidelines and quality standards.

### 3. Generate Script
```bash
node scripts/generate-script.js --data sample/episode-X.json
```

### 4. Review & Refine
- Review generated script in `output/scripts/`
- Verify all placeholders filled
- Check timing for each segment
- Ensure presentation slide references are accurate

### 5. Prepare Presentation
- Reference corresponding presentation (P1-P4)
- Prepare slides mentioned in script
- Create any custom graphics needed

### 6. Production
- Share script and presentation with host and guest
- Prepare technical setup (cameras, lighting, audio)
- Record episode following script structure
- Capture all segments (40 min total)

### 7. Post-Production
- Edit video (transitions, graphics, captions)
- Export for multiple platforms
- Create social media clips
- Prepare newsletter content
- Upload and schedule

## 📝 Template System

### Episode Script Template

Location: `templates/episode-script.md`

The template uses `{{PLACEHOLDER}}` format for all variable content:
- `{{EPISODE_NUMBER}}` - Episode number
- `{{EPISODE_TITLE}}` - Episode title
- `{{GUEST_NAME}}` - Guest name
- `{{OPENING_SCRIPT}}` - Opening segment script
- And 50+ more placeholders

### How Placeholders Work

The script generator (`generate-script.js`) performs simple find-and-replace:
1. Reads template file
2. Loads episode data JSON
3. Replaces all `{{PLACEHOLDER}}` with corresponding JSON values
4. Outputs completed script

**No AI expansion** - Pure placeholder replacement ensures consistency and control.

## 🎨 Presentations

### Master Presentations

Four core presentations that episodes draw from:

| ID | Title | Theme | Slides |
|----|-------|-------|--------|
| **P1** | Website & Digital Presence Fundamentals | Building Your Online Foundation | 30 |
| **P2** | Business Operations & Client Management | Running a Professional Business | 28 |
| **P3** | Marketing & Growth Strategies | Growing Your Artist Brand | 32 |
| **P4** | Advanced Business & Scaling | Building a Sustainable Career | 26 |

### Presentation Format

Presentations integrate the **run of show** directly into the slide deck. Each presentation includes:
- Timing markers for each segment
- Ad break indicators
- Visual descriptions for each slide
- On-screen text and graphics specs
- Complete speaker notes/scripts
- Episode summary

Structure:
```markdown
## 🎬 SEGMENT NAME (Time Range)

### Slide X: Slide Title

**Visual:**
[Description of what's shown on screen]

**On-Screen Text/Stats:**
- Key data points
- Bullet points

**Speaker Notes:**
[Complete talking points and script]
```

## 📅 Content Calendar

### Structure

The content calendar (`output/calendars/2026-content-calendar.json`) organizes:
- **52 weeks** of episodes
- **4 quarterly themes**
- **13 content categories** (rotated throughout year)
- **4 master presentations** (referenced across episodes)
- **Guest assignments**
- **Newsletter topics**
- **Meeting focus areas**

### Quarterly Themes

- **Q1 (Weeks 1-13):** Foundation & Setup
- **Q2 (Weeks 14-26):** Growth & Marketing
- **Q3 (Weeks 27-39):** Operations & Optimization
- **Q4 (Weeks 40-52):** Scaling & Advanced Topics

### Episode Categories (13 Total)

Episodes cycle through these categories to ensure balanced coverage:

1. Website & Digital Presence
2. Pricing & Finance
3. Client Management
4. Social Media Marketing
5. Booking & Scheduling
6. Personal Branding
7. Portfolio Development
8. Studio Operations
9. Legal & Compliance
10. Networking & Partnerships
11. Customer Experience
12. Email & Newsletter Marketing
13. Analytics & Data

## 🎯 Episode Anatomy

### Timing Breakdown

| Segment | Time | Duration | Purpose |
|---------|------|----------|---------|
| Opening | 0:00 - 3:00 | 3 min | Hook, introduce topic and guest |
| Ad Break 1 | 3:00 - 4:00 | 1 min | Sponsor/product message |
| Segment 1 | 4:00 - 14:00 | 10 min | First major topic (2-4 slides) |
| Ad Break 2 | 14:00 - 15:00 | 1 min | Sponsor/product message |
| Segment 2 | 15:00 - 25:00 | 10 min | Second major topic (2-4 slides) |
| Ad Break 3 | 25:00 - 26:00 | 1 min | Sponsor/product message |
| Segment 3 | 26:00 - 36:00 | 10 min | Third major topic (2-4 slides) |
| Closing | 36:00 - 40:00 | 4 min | Recap, action plan, CTAs, next week preview |

**Total: 40 minutes**
**Slides per episode: 10-14 slides** (including title and closing)

### Required Content Components

Every episode includes:
- ✅ Episode metadata (number, title, date, duration)
- ✅ Guest information (name, title, bio, social, website)
- ✅ Opening script (3 min)
- ✅ 3 segment scripts with slide references (10 min each)
- ✅ 3 ad break placeholders
- ✅ Closing script with action plan (4 min)
- ✅ Presentation deck (10-14 slides total)
- ✅ Production notes (technical setup)
- ✅ Social media assets (YouTube, Instagram, LinkedIn)
- ✅ Newsletter topic and CTA

## 🤖 AI-Assisted Content Creation

### Using AI to Create Episode Data

While the script generator itself does NOT use AI (just template replacement), you can use AI to help CREATE the episode data JSON files.

Refer to: `SYSTEM_PROMPT.md`

This comprehensive system prompt guides AI assistants in:
- Understanding show format and structure
- Writing in appropriate tone and style
- Creating actionable, valuable content
- Integrating guests naturally
- Optimizing for each platform
- Maintaining quality standards

### Workflow with AI

1. Provide AI with `SYSTEM_PROMPT.md`
2. Give episode topic, guest, and presentation assignment
3. AI generates complete episode data JSON
4. You review and refine
5. Run through script generator
6. Final human polish

## 📊 Schema Validation

### Calendar Schema

Location: `schemas/calendar-schema.json`

Validates content calendar structure including:
- Year and presentation definitions
- Quarterly themes and week assignments
- Episode categories (13 types)
- Weekly episode data (all 52 weeks)

Use JSON schema validators to ensure calendar data integrity.

## 🎬 Episode 1 Example

**Title:** "Why Your Website Is Losing You Clients"

**Guest:** Mike DeVries (Award-Winning Tattoo Artist & Studio Owner)

**Topic:** Website fundamentals and conversion optimization

**Presentation:** P1 - Website & Digital Presence Fundamentals (Slides 1, 5, 7, 9, 12, 14, 16, 18, 20, 24)

**Files:**
- Data: `sample/episode-1.json`
- Generated Script: `output/scripts/episode-1.md`
- Presentation: `presentations/P1-website-fundamentals.md`

**Key Takeaways:**
- 7-second first impression rule
- Mobile optimization (80%+ traffic)
- Portfolio strategies that convert
- Booking funnel optimization

## 🔧 Script Generator Technical Details

### Usage

```bash
node scripts/generate-script.js [options]

Options:
  --data <file>      Episode data JSON file (required)
  --output <file>    Output file path (optional, defaults to output/scripts/<data-filename>.md)
  --template <file>  Custom template file (optional, defaults to templates/episode-script.md)
```

### Examples

Basic usage:
```bash
node scripts/generate-script.js --data sample/episode-1.json
```

Custom output:
```bash
node scripts/generate-script.js --data sample/episode-1.json --output my-script.md
```

Custom template:
```bash
node scripts/generate-script.js --data sample/episode-1.json --template custom-template.md
```

### How It Works

1. **Parses command-line arguments** to get data file, output path, template path
2. **Loads JSON data** from specified file
3. **Loads template** markdown file
4. **Finds all placeholders** matching `{{PLACEHOLDER}}` pattern
5. **Replaces placeholders** with corresponding data values
6. **Handles arrays** by joining with appropriate formatting (bullets for lists, commas for tags)
7. **Writes output** to specified location

### Placeholder Matching

- Format: `{{PLACEHOLDER_NAME}}`
- Case-sensitive (all caps recommended)
- Underscores for multi-word placeholders
- Can reference nested JSON: `GUEST.NAME` → `{{GUEST_NAME}}`

## 📦 Dependencies

### Node.js
- **Version:** 16+ recommended
- **Modules:** ES modules (import/export)

### Required Packages
None! The script generator uses only Node.js built-in modules:
- `fs` - File system operations
- `path` - Path manipulation
- `url` - URL and file path conversion

## 🎥 Presenter Mode (Google Slides-Style Dual View)

### Overview

The React slideshow system now includes a **Presenter Mode** - a dual-window setup similar to Google Slides presenter view:

- **Audience View** (OBS): Clean slides displayed to viewers
- **Presenter View** (Host monitor): Notes, timer, next slide preview, controls

Both windows stay perfectly synchronized using BroadcastChannel API.

### Setup for Live Show

1. **Start React dev server:**
   ```bash
   cd /home/user/n8n
   npm run dev
   ```

2. **Open Audience View in OBS:**
   - Add Browser Source
   - URL: `http://localhost:5173/slideshow?episode=2-with-script`
   - Resolution: 1920x1080
   - This is what viewers see (clean slides, no notes)

3. **Open Presenter View (Host's Monitor):**
   - Open browser: `http://localhost:5173/slideshow?episode=2-with-script&mode=presenter`
   - Position on host's monitor (not visible to audience)
   - This shows: current slide, next slide, presenter notes, timer, controls

### Presenter View Features

**Layout:**
- **Top Row**: Current slide (60%) + Next slide preview (40%)
- **Middle**: Presenter notes panel (scrollable, large text)
- **Bottom Toolbar**:
  - Timer (elapsed/remaining with color warnings)
  - Current time (wall clock)
  - Slide counter (3/25)
  - Navigation controls (Prev/Next buttons)
  - Overlay toggles (QR Code, Lower-Third)

**Sync:**
- Navigate in presenter view → audience view updates instantly
- Keyboard shortcuts work in both views
- Stream Deck controls sync to both windows
- BroadcastChannel API (< 100ms latency)

### Keyboard Shortcuts

**Both Views:**
- `← →` or `PgUp/PgDn`: Previous/Next slide
- `Q`: Toggle QR code
- `L`: Toggle lower-third overlay
- `G`: Toggle portfolio grid/fullscreen
- `Home`: Jump to first slide
- `End`: Jump to last slide

**Presenter View Only:**
- `T`: Start/Pause timer
- `R`: Reset timer

### Episode Data Format with Presenter Notes

To use presenter mode, your episode JSON must include `presenterNotes` in the `SHOW_SCRIPT` array:

```json
{
  "SHOW_SCRIPT": [
    {
      "segment": "INTRO",
      "timeCode": "0:00",
      "title": "Show Open & Episode Overview",
      "type": "intro",
      "talkingPoints": [
        "Welcome to TattooNOW Weekly Show",
        "Today: Pricing psychology"
      ],
      "presenterNotes": "Energy: HIGH. Make eye contact. Emphasize how common underpricing is. Build anticipation for guest reveal.",
      "cue": "CUE: Transition to Segment 1 after intro"
    }
  ]
}
```

**Key Difference:**
- `talkingPoints` (array): Bullet points shown to audience in OBS
- `presenterNotes` (string): Detailed notes ONLY visible in presenter view

**Example Files:**
- `/home/user/tattoonow-show/public/data/episode-2-with-script.json` - Full example with presenterNotes
- `/home/user/tattoonow-show/public/data/episode-3-with-script.json` - Uses legacy `notes` field (still works)

### Benefits

**For Host:**
- Never forget talking points (detailed notes always visible)
- Time management (elapsed/remaining at a glance)
- Smooth transitions (see next slide before advancing)
- Professional confidence

**For Viewers:**
- Clean, distraction-free slides
- Easy to read bullet points
- Professional presentation

**For Production:**
- Automatic window sync (no manual coordination)
- Flexible control (Stream Deck, keyboard, or mouse)
- Easy setup (just two browser windows)

## 🚀 Future Enhancements

Potential additions to the system:

- [ ] Episode validation script (check all required fields)
- [ ] Batch script generation (all episodes at once)
- [ ] Social media asset generator (images, clips)
- [ ] Newsletter template and generator
- [ ] Analytics tracking integration
- [ ] Guest management system
- [ ] Presentation slide export to PDF/PowerPoint
- [ ] Video chapter marker generation
- [ ] Automated thumbnail creation
- [ ] SEO metadata generator

## 📖 Additional Resources

### File Locations
- **System Prompt:** `SYSTEM_PROMPT.md` - AI content creation guidelines
- **Calendar Schema:** `schemas/calendar-schema.json` - Calendar validation
- **Sample Data:** `sample/episode-1.json` - Reference for creating new episodes
- **Sample Output:** `output/scripts/episode-1.md` - Example generated script
- **Sample Presentation:** `presentations/P1-website-fundamentals.md` - Slide deck example

### Getting Help

For questions or issues:
1. Review this README
2. Check `SYSTEM_PROMPT.md` for content guidelines
3. Examine `sample/episode-1.json` for data structure
4. Review generated `output/scripts/episode-1.md` for expected output

## 📄 License

Internal TattooNOW production system. Not for public distribution.

---

**Built for TattooNOW** - Helping tattoo artists build thriving businesses, one episode at a time.
