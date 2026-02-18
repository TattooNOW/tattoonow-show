# TattooNOW Weekly Show - Production Deployment Guide

Complete step-by-step guide to deploy the show system to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [n8n Workflows](#n8n-workflows)
5. [React Slideshow App](#react-slideshow-app)
6. [HighLevel Integration](#highlevel-integration)
7. [OBS Studio Setup](#obs-studio-setup)
8. [Stream Deck Configuration](#stream-deck-configuration)
9. [Testing](#testing)
10. [Go-Live Checklist](#go-live-checklist)

---

## Prerequisites

### Required Accounts

- ✅ **Supabase** (https://supabase.com) - Database backend
- ✅ **n8n** (https://n8n.io) - Workflow automation (self-hosted or cloud)
- ✅ **HighLevel** (https://gohighlevel.com) - CRM & forms (also hosts portfolio images)
- ✅ **Slack** (optional) - Team notifications
- ✅ **OpenAI** (https://openai.com) - AI slide generation from blog posts
- ✅ **Vercel/Netlify** (optional) - Host React slideshow app

### Software Installed

- Node.js 18+ & npm
- Git
- OBS Studio 29+
- Elgato Stream Deck software (if using Stream Deck)

---

## Infrastructure Setup

### 1. Clone Repository

```bash
git clone https://github.com/TattooNOW/tattoonow-show.git
cd tattoonow-show
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# HighLevel
HIGHLEVEL_API_KEY=your-api-key
HIGHLEVEL_LOCATION_ID=your-location-id

# OpenAI (for RSS → slides)
OPENAI_API_KEY=sk-your-key

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-webhook

# TattooNOW Blog
TATTOONOW_BLOG_RSS_URL=https://tattoonow.com/blog/feed

# Stream Deck WebSocket
STREAMDECK_WEBSOCKET_PORT=9000
```

---

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Project details:
   - Name: `tattoonow-weekly`
   - Database password: (save this!)
   - Region: Choose closest to your location
4. Wait ~2 minutes for provisioning

### 2. Run Database Schema

1. Open Supabase SQL Editor
2. Copy contents of `show-system/supabase/schema.sql`
3. Run the script
4. Verify tables created:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
   Should show: `episodes`, `guests`, `segments`, `analytics`, `social_posts`

### 3. Get API Credentials

1. Go to **Settings → API**
2. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 4. Test Connection

```bash
# From project root
npm run dev

# In another terminal
curl "http://localhost:5173/api/test-supabase"
```

Expected: `{"status": "connected", "tables": 5}`

---

## n8n Workflows

### Option 1: Self-Hosted n8n (Recommended for full control)

#### Install n8n

```bash
npm install -g n8n

# Start n8n
n8n start
```

Open http://localhost:5688

#### Import Workflows

1. Go to **Workflows → Import**
2. Import `workflows/highlevel-guest-intake.json`
3. Import `workflows/rss-blog-to-segments.json`

#### Configure Credentials

**Supabase:**
- Type: HTTP Header Auth
- Name: `Authorization`
- Value: `Bearer YOUR_SERVICE_ROLE_KEY`

**OpenAI:**
- Type: OpenAI API
- API key: `sk-...`

**Slack:**
- Type: Slack API
- OAuth token or webhook URL

### Option 2: n8n Cloud

1. Sign up at https://n8n.io
2. Create workspace
3. Import workflows (same as above)
4. Configure credentials in cloud UI

### Activate Workflows

1. Open each workflow
2. Click **Activate** toggle (top right)
3. Note webhook URLs for HighLevel integration

---

## React Slideshow App

### Development Mode

```bash
npm run dev
```

Open http://localhost:5173/slideshow?episode=1

### Production Build

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Or connect GitHub repo to Vercel dashboard for auto-deploy.

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Environment Variables (Production)

In Vercel/Netlify dashboard, add:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** Only use `ANON_KEY` in React app, never `SERVICE_ROLE_KEY`!

### Test Production URL

```
https://your-app.vercel.app/slideshow?episode=1
```

---

## HighLevel Integration

### 1. Create Custom Fields

Go to **Settings → Custom Fields** and create:

| Field Name | Type | Options |
|------------|------|---------|
| `custom_field_artist_title` | Text | - |
| `custom_field_tattoo_style` | Text | - |
| `custom_field_location` | Text | - |
| `custom_field_instagram` | Text | - |
| `custom_field_website` | URL | - |
| `custom_field_bio` | Textarea | Max 1000 chars |
| `custom_field_topics` | Checkbox | 20 options (see schema) |
| `custom_field_custom_topics` | Textarea | Max 1000 chars |
| `custom_field_preferred_date` | Date | - |
| `custom_field_booking_pref` | Dropdown | 6 options |
| `custom_field_portfolio` | File Upload | Multiple files, max 15 |

### 2. Create Guest Intake Form

1. Go to **Sites → Forms**
2. Create new form: "TattooNOW Weekly Guest Intake"
3. Add fields (drag from left sidebar)
4. Map to custom fields created above
5. **Topics field:** Add 20 checkboxes with labels from `show-system/integrations/highlevel/guest-intake-form-schema.json`

### 3. Configure Form Webhook

1. Go to **Settings → Integrations → Webhooks**
2. Add webhook:
   - Name: `TattooNOW Guest Intake`
   - Trigger: `Form Submission`
   - Form: Select "TattooNOW Weekly Guest Intake"
   - Webhook URL: Your n8n webhook URL
     - Self-hosted: `https://your-n8n.com/webhook/highlevel-guest-intake`
     - n8n Cloud: `https://your-workspace.app.n8n.cloud/webhook/highlevel-guest-intake`
   - Method: `POST`
   - Headers: None needed
3. Save webhook

### 4. Test Form Submission

1. Fill out form with test data
2. Submit
3. Check n8n execution log
4. Verify:
   - Guest created in Supabase
   - Images uploaded to Cloudinary
   - Confirmation email sent
   - Slack notification received

---

## OBS Studio Setup

### 1. Install OBS

Download from https://obsproject.com

### 2. Create Scene for Slideshow

1. Open OBS
2. **Scenes** → Add new scene: "TattooNOW Slideshow"
3. **Sources** → Add **Browser Source**:
   - Name: `Slideshow`
   - URL: `http://localhost:5173/slideshow?episode=1` (dev) or `https://your-app.vercel.app/slideshow?episode=1` (prod)
   - Width: `1920`
   - Height: `1080`
   - FPS: `60`
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

### 3. Add Webcam Overlay (Optional)

1. **Sources** → Add **Video Capture Device**
2. Select your webcam
3. Resize/position in bottom-right corner
4. Add circle mask for professional look

### 4. Configure Stream Settings

**Settings → Stream:**
- Service: `Custom...`
- Server: Restream RTMP URL (e.g., `rtmps://live.restream.io/live`)
- Stream Key: Your Restream key

**Settings → Output:**
- Output Mode: `Advanced`
- Encoder: `NVIDIA NVENC H.264` (if available) or `x264`
- Rate Control: `CBR`
- Bitrate: `6000 Kbps`
- Keyframe Interval: `2`
- Preset: `Quality`

**Settings → Video:**
- Base Resolution: `1920x1080`
- Output Resolution: `1920x1080`
- FPS: `60` (or `30` for lower bandwidth)

---

## Stream Deck Configuration

### 1. Install Stream Deck Software

Download from https://www.elgato.com/stream-deck

### 2. Create TattooNOW Profile

1. Open Stream Deck app
2. Create new profile: "TattooNOW Weekly"
3. Add buttons:

**Row 1: Episode Control**
- `Previous Slide` → System → Website → URL: `http://localhost:9000/prev`
- `Next Slide` → System → Website → URL: `http://localhost:9000/next`
- `Title Card` → System → Website → URL: `http://localhost:9000/goto/title`

**Row 2: Slide Types**
- `Portfolio` → System → Website → URL: `http://localhost:9000/goto/portfolio`
- `Education` → System → Website → URL: `http://localhost:9000/goto/education`
- `Lower Third` → System → Website → URL: `http://localhost:9000/toggle/lowerthird`

**Row 3: Overlays**
- `QR Code` → System → Website → URL: `http://localhost:9000/toggle/qr`
- `Guest Info` → System → Website → URL: `http://localhost:9000/toggle/guest`

### 3. Start WebSocket Server

```bash
# In project root
npm run streamdeck
```

Expected output:
```
Stream Deck WebSocket server running on ws://localhost:9000
```

### 4. Test Buttons

Click buttons on Stream Deck → slides should change in OBS browser source

---

## Testing

### Test Checklist

#### ✅ Supabase Connection

```bash
curl "https://your-project.supabase.co/rest/v1/episodes?episode_number=eq.1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected: Episode 1 data (or empty array if no data yet)

#### ✅ React Slideshow

1. Open `http://localhost:5173/slideshow?episode=1`
2. Test keyboard controls:
   - `→` Next slide
   - `←` Previous slide
   - `Q` Toggle QR code
   - `L` Toggle lower third
   - `G` Go to slide number (prompt)

#### ✅ HighLevel Form → n8n → Supabase

1. Fill out HighLevel form
2. Submit
3. Check n8n execution (should be green checkmark)
4. Query Supabase:
   ```sql
   SELECT * FROM guests ORDER BY created_at DESC LIMIT 1;
   ```
   Should show newly created guest

#### ✅ RSS Feed → Education Segments

1. Trigger n8n workflow manually (or wait for scheduled run)
2. Check workflow execution log
3. Query Supabase:
   ```sql
   SELECT * FROM segments WHERE segment_type = 'education' ORDER BY created_at DESC LIMIT 1;
   ```
   Should show newly created education segment with slides

#### ✅ OBS Browser Source

1. Open OBS
2. Select "TattooNOW Slideshow" scene
3. Browser source should load slideshow
4. Test keyboard controls (while OBS window is focused)

#### ✅ Stream Deck

1. Start WebSocket server: `npm run streamdeck`
2. Click Stream Deck buttons
3. Verify slides change in OBS

---

## Go-Live Checklist

### 1 Week Before Show

- [ ] Verify guest info in Supabase
- [ ] Review education slides from RSS feed
- [ ] Test all slides in slideshow (no broken images)
- [ ] Generate QR code in HighLevel for episode
- [ ] Create social media countdown graphics (Placid)
- [ ] Schedule countdown posts (3 days, 1 day, 3 hours before)

### 1 Day Before Show

- [ ] Test OBS → Restream connection
- [ ] Verify all Stream Deck buttons work
- [ ] Run full rehearsal with guest (Zoom/StreamYard)
- [ ] Update episode status to `scheduled` in Supabase
- [ ] Post "1 day" countdown on social media

### 3 Hours Before Show

- [ ] Final mic/camera check
- [ ] Start OBS, load slideshow scene
- [ ] Connect to Restream
- [ ] Test Stream Deck controls
- [ ] Post "3 hours" countdown on social media
- [ ] Send reminder email to guest

### 30 Minutes Before Show

- [ ] Start streaming to Restream (but not broadcasting yet)
- [ ] Test slideshow transitions
- [ ] Guest joins call
- [ ] Final audio levels check
- [ ] Queue up title card

### Go Live!

- [ ] Start broadcast on Restream dashboard
- [ ] Display title card for 2 minutes (countdown timer)
- [ ] Ryan introduces show
- [ ] Begin Segment 1 (interview)
- [ ] Toggle QR code during transitions
- [ ] Take notes for post-show analytics

### Post-Show

- [ ] Stop broadcast
- [ ] Update episode status to `completed` in Supabase
- [ ] Insert analytics data (viewers, engagement, QR scans)
- [ ] Download recording from Restream
- [ ] Import to Descript for editing
- [ ] Schedule post-show clips for social media

---

## Troubleshooting

### Supabase "403 Forbidden"

**Cause:** Using wrong API key or RLS policies blocking request

**Fix:**
- n8n workflows: Use `SUPABASE_SERVICE_ROLE_KEY`
- React app: Use `VITE_SUPABASE_ANON_KEY`
- Verify RLS policies allow public read access

### OBS Browser Source Blank

**Cause:** URL incorrect or React app not running

**Fix:**
1. Check React app is running: `npm run dev`
2. Verify URL in browser first
3. In OBS, right-click browser source → Interact → Check for errors in console

### Stream Deck Buttons Not Working

**Cause:** WebSocket server not running

**Fix:**
```bash
npm run streamdeck
```

Verify server running on `ws://localhost:9000`

### n8n Workflow Fails

**Cause:** Missing credentials or API rate limits

**Fix:**
1. Check workflow execution log
2. Verify all credentials configured
3. Test API endpoints manually (Postman/curl)
4. Check rate limits (OpenAI, Cloudinary, etc.)

### HighLevel Webhook Not Triggering

**Cause:** Webhook URL incorrect or form not mapped to webhook

**Fix:**
1. Verify webhook URL is correct n8n endpoint
2. Check webhook is enabled in HighLevel
3. Ensure form is selected in webhook settings
4. Test with manual webhook trigger in n8n

---

## Support

- **Documentation:** See `/show-system/` directory
- **Issues:** https://github.com/TattooNOW/tattoonow-show/issues
- **Slack:** #tattoonow-tech (internal)

---

## Next Steps After Deployment

1. ✅ Run first test episode with sample data
2. ✅ Invite guest for dry-run rehearsal
3. ✅ Go live with Episode 1!
4. ⬜ Collect feedback from viewers
5. ⬜ Iterate on slide designs based on analytics
6. ⬜ Build admin dashboard for episode management (optional)
7. ⬜ Integrate Placid for automated social graphics
