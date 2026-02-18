#HighLevel Guest Intake Form Integration

Complete guide for setting up HighLevel forms, processing guest submissions, and storing data in Supabase.

## Table of Contents

1. [Form Setup](#form-setup)
2. [Field Naming Conventions](#field-naming-conventions)
3. [n8n Workflow](#n8n-workflow)
4. [Social Media Content Generation](#social-media-content-generation)

---

## Form Setup

### 1. Create HighLevel Form

1. Log in to **HighLevel** (https://app.gohighlevel.com)
2. Go to **Sites → Funnels → Forms**
3. Create new form: **"TattooNOW Weekly Guest Intake"**
4. Add fields based on `guest-intake-form-schema.json`

### 2. Form Fields Configuration

#### Basic Information

| Field Label | HighLevel Field Name | Type | Required |
|-------------|---------------------|------|----------|
| Full Name | `full_name` | Text | ✅ |
| Email Address | `email` | Email | ✅ |
| Phone Number | `phone` | Phone | |
| Artist Bio | `bio` | Textarea | ✅ |
| Artist Title/Specialization | `artist_title` | Text | ✅ |
| Primary Tattoo Style | `tattoo_style` | Text | ✅ |
| Studio Location | `location` | Text | ✅ |
| Instagram Handle | `instagram` | Text | ✅ |
| Website URL | `website` | URL | |
| Booking Preference | `custom_field_booking_pref` | Dropdown | |

#### Portfolio Images

| Field Label | HighLevel Field Name | Type | Required |
|-------------|---------------------|------|----------|
| Portfolio Images | `custom_field_portfolio` | File Upload (Multiple) | ✅ |

**Settings:**
- Min files: 6
- Max files: 15
- Allowed types: JPG, PNG, WebP
- Max file size: 10MB each

#### Discussion Topics (20 Checkboxes)

**Field Name:** `custom_field_topics`
**Type:** Checkbox (Multiple Select)
**Label:** "Which topics would you love to discuss on the show? (Select 3-10)"

**Options:**

1. ✅ Building Your Online Presence as a Tattoo Artist
2. ✅ Instagram Marketing & Growth Strategies
3. ✅ Website Design & SEO for Tattoo Artists
4. ✅ Mastering Client Consultations
5. ✅ Pricing Your Tattoo Work for Profitability
6. ✅ Building a Killer Tattoo Portfolio
7. ✅ Streamlining Your Booking Process
8. ✅ Email Marketing for Tattoo Artists
9. ✅ Client Retention & Repeat Business
10. ✅ Dealing with Difficult Clients & Red Flags
11. ✅ Health, Safety & Hygiene Standards
12. ✅ Equipment, Supplies & Product Recommendations
13. ✅ Business Licenses, Permits & Legal Compliance
14. ✅ Apprenticeships, Mentorship & Training New Artists
15. ✅ Networking & Collaboration in the Tattoo Community
16. ✅ Tattoo Conventions, Trade Shows & Events
17. ✅ Mental Health, Burnout & Self-Care
18. ✅ Work-Life Balance for Tattoo Artists
19. ✅ Scaling & Expanding Your Tattoo Business
20. ✅ Financial Planning & Retirement for Tattoo Artists

**Validation:**
- Minimum selections: 3
- Maximum selections: 10
- Help text: "Choose topics you're passionate about! These will help us create targeted social content before your episode."

#### Custom Topics (Open-Ended)

| Field Label | HighLevel Field Name | Type | Required |
|-------------|---------------------|------|----------|
| Additional Topics or Questions | `custom_field_custom_topics` | Textarea | |
| Preferred Air Date | `custom_field_preferred_date` | Date Picker | |

---

## Field Naming Conventions

### Use Airtable HighLevel Snapshot Tool

To get exact field naming conventions from your HighLevel instance:

1. **Install HighLevel Snapshot Tool** in Airtable
2. **Connect to your HighLevel account**
3. **Export form fields** to see exact field names
4. **Map fields** to schema in `guest-intake-form-schema.json`

### Standard Fields (Built-in)

These are built into HighLevel contacts:

```javascript
{
  "full_name": "Sarah Chen",
  "email": "sarah@example.com",
  "phone": "+1-555-123-4567",
  "address1": "123 Main St", // Optional
  "city": "Portland",
  "state": "OR",
  "country": "USA"
}
```

### Custom Fields (Create in HighLevel)

These need to be created as custom fields:

```javascript
{
  "custom_field_artist_title": "Award-Winning Watercolor Artist",
  "custom_field_tattoo_style": "Watercolor & Botanical",
  "custom_field_location": "Portland, OR",
  "custom_field_instagram": "sarahchen.ink",
  "custom_field_website": "https://sarahchen.ink",
  "custom_field_bio": "Long bio text...",
  "custom_field_topics": ["building_online_presence", "instagram_marketing", "pricing_strategies"],
  "custom_field_custom_topics": "I'd also love to talk about...",
  "custom_field_preferred_date": "2026-03-15",
  "custom_field_booking_pref": "Website booking form",
  "custom_field_portfolio": ["url1", "url2", "url3"]
}
```

---

## n8n Workflow

### Workflow: HighLevel Form Submission → Supabase

**File:** `/home/user/tattoonow-show/workflows/highlevel-guest-intake.json`

#### Workflow Nodes:

```
1. Webhook (HighLevel Trigger)
    ↓
2. Extract Form Data
    ↓
3. Format Portfolio Image URLs (HighLevel-hosted)
    ↓
4. Insert Guest into Supabase
    ↓
5. Create Episode Draft (if scheduled)
    ↓
6. Generate HighLevel QR Code
    ↓
7. Send Confirmation Email
    ↓
8. Notify Team (Slack)
```

**Note:** Portfolio images uploaded to HighLevel are already hosted and accessible via URLs. We store these URLs directly in Supabase - no need to re-upload to a separate image hosting service.

### Node 1: HighLevel Webhook

**Webhook URL:** `https://your-n8n.com/webhook/highlevel-guest-intake`

**HighLevel Setup:**
1. Go to **Settings → Integrations → Webhooks**
2. Add webhook: Form Submission
3. Select form: "TattooNOW Weekly Guest Intake"
4. Webhook URL: Your n8n webhook URL
5. Events: `form_submission`

### Node 2: Extract Form Data

**Function Node:**

```javascript
const formData = $input.item.json.body;

return {
  json: {
    guest_name: formData.full_name,
    guest_email: formData.email,
    guest_phone: formData.phone,
    artist_title: formData.custom_field_artist_title,
    tattoo_style: formData.custom_field_tattoo_style,
    location: formData.custom_field_location,
    instagram: formData.custom_field_instagram,
    website: formData.custom_field_website,
    bio: formData.custom_field_bio,
    discussion_topics: formData.custom_field_topics, // Array
    custom_topics: formData.custom_field_custom_topics,
    preferred_date: formData.custom_field_preferred_date,
    booking_preference: formData.custom_field_booking_pref,
    portfolio_urls: formData.custom_field_portfolio, // Array of URLs
    highlevel_contact_id: formData.contact_id
  }
};
```

### Node 3: Format Portfolio Images

**No re-upload needed! HighLevel already hosts the images.**

```javascript
// Format portfolio images from HighLevel URLs
const portfolioUrls = $json.portfolio_urls;
const portfolioImages = [];

for (let i = 0; i < portfolioUrls.length; i++) {
  const imageUrl = portfolioUrls[i];

  // Skip empty URLs
  if (!imageUrl || imageUrl.trim() === '') continue;

  portfolioImages.push({
    url: imageUrl, // HighLevel-hosted URL
    description: '', // Guest can add descriptions later
    order: i + 1,
    source: 'highlevel'
  });
}

return {
  json: {
    ...$json,
    portfolio_images: portfolioImages,
    image_count: portfolioImages.length
  }
};
```

### Node 4: Insert Guest into Supabase

**HTTP Request Node:**

**Method:** POST
**URL:** `{{ $env.VITE_SUPABASE_URL }}/rest/v1/guests`

**Headers:**
```json
{
  "apikey": "{{ $env.SUPABASE_SERVICE_ROLE_KEY }}",
  "Authorization": "Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}",
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}
```

**Body:**
```json
{
  "name": "{{ $json.guest_name }}",
  "bio": "{{ $json.bio }}",
  "title": "{{ $json.artist_title }}",
  "style": "{{ $json.tattoo_style }}",
  "location": "{{ $json.location }}",
  "instagram": "{{ $json.instagram }}",
  "website": "{{ $json.website }}",
  "email": "{{ $json.guest_email }}",
  "phone": "{{ $json.guest_phone }}",
  "portfolio_images": {{ $json.portfolio_images }},
  "highlevel_contact_id": "{{ $json.highlevel_contact_id }}"
}
```

**Returns:** Guest record with `id`

### Node 5: Create Episode Draft (Optional)

If guest selected a preferred air date, create episode:

**HTTP Request Node:**

**Method:** POST
**URL:** `{{ $env.VITE_SUPABASE_URL }}/rest/v1/episodes`

**Body:**
```json
{
  "episode_number": {{ $json.next_episode_number }},
  "title": "Interview with {{ $json.guest_name }}",
  "air_date": "{{ $json.preferred_date }}T19:00:00Z",
  "host": "Ryan Pierce",
  "status": "draft"
}
```

### Node 6: Generate HighLevel QR Code

**HTTP Request to HighLevel API:**

```javascript
const qrCodeResponse = await $http.request({
  method: 'POST',
  url: 'https://rest.gohighlevel.com/v1/qr-codes',
  headers: {
    'Authorization': `Bearer ${$env.HIGHLEVEL_API_KEY}`
  },
  body: {
    url: 'https://tattoonow.com/book',
    campaign: `episode-${$json.episode_number}-${$json.guest_name}`,
    type: 'url'
  }
});

return {
  json: {
    qr_code_url: qrCodeResponse.data.url,
    highlevel_qr_url: qrCodeResponse.data.qr_image_url
  }
};
```

### Node 7: Send Confirmation Email

**Send Email Node:**

**To:** `{{ $json.guest_email }}`
**Subject:** "Welcome to TattooNOW Weekly Show!"

**Body:**
```html
Hi {{ $json.guest_name }},

Thank you for submitting your guest application for TattooNOW Weekly!

We've received your portfolio and discussion topics. Our team will review your submission and get back to you within 3-5 business days.

In the meantime:
- Follow us on Instagram: @tattoonow
- Check out previous episodes: https://youtube.com/@tattoonow

Topics you selected:
{{ $json.discussion_topics.join(', ') }}

Looking forward to connecting!

Best,
Ryan Pierce & the TattooNOW Team
```

### Node 8: Notify Team (Slack)

**Slack Node:**

**Channel:** `#show-bookings`

**Message:**
```
🎨 New Guest Application!

**Name:** {{ $json.guest_name }}
**Style:** {{ $json.tattoo_style }}
**Location:** {{ $json.location }}
**Instagram:** @{{ $json.instagram }}

**Topics:** {{ $json.discussion_topics.join(', ') }}

**Portfolio:** {{ $json.portfolio_images.length }} images uploaded

**Review:** [Supabase Dashboard](https://app.supabase.com)
```

---

## Social Media Content Generation

### Using Topics for Pre-Show Posts

The 20 checkboxable topics are SEO-optimized for generating targeted social media content in the 3 days before the episode.

**Example:**

Guest selects:
- Building Your Online Presence
- Instagram Marketing
- Pricing Strategies

**Auto-Generated Social Posts:**

**3 Days Before:**
```
📅 This Thursday on TattooNOW Weekly!

Join us for an in-depth conversation with @sarahchen.ink about:
✅ Building Your Online Presence as a Tattoo Artist
✅ Instagram Marketing & Growth Strategies
✅ Pricing Your Tattoo Work for Profitability

Set a reminder → [link]
#TattooArtist #InstagramMarketing #TattooBusinessTips
```

**1 Day Before:**
```
🔥 TOMORROW: @sarahchen.ink drops knowledge on Instagram growth!

If you've ever wondered how to:
• Get more followers without buying bots
• Turn IG engagement into real bookings
• Price your work for maximum profit

You don't want to miss this one.

Thursday 7PM EST → [link]
```

**3 Hours Before:**
```
⏰ 3 HOURS until we go live with @sarahchen.ink!

Tonight's topics hit different:
1️⃣ Building your online presence (no fluff, just strategy)
2️⃣ Instagram growth hacks that actually work
3️⃣ Pricing strategies to stop undervaluing yourself

Going live at 7PM EST → [link]
```

### SEO Keywords Mapping

Each topic includes pre-mapped SEO keywords for YouTube descriptions, blog posts, and podcast show notes:

```json
{
  "instagram_marketing": {
    "seo_keywords": [
      "tattoo instagram marketing",
      "grow tattoo instagram",
      "instagram for tattoo artists"
    ]
  }
}
```

**Auto-Generated YouTube Description:**
```
In this episode, we sit down with Sarah Chen (@sarahchen.ink) to discuss Instagram marketing for tattoo artists, including proven strategies to grow your tattoo Instagram following and convert followers into paying clients.

Topics Covered:
• Building Your Online Presence as a Tattoo Artist
• Instagram Marketing & Growth Strategies
• Pricing Your Tattoo Work for Profitability

#TattooArtist #InstagramMarketing #TattooBusinessTips #TattooOnlinePresence
```

---

## Testing

### Test Form Submission

1. Fill out HighLevel form
2. Submit
3. Check n8n execution log
4. Verify guest in Supabase:
   ```sql
   SELECT * FROM guests WHERE email = 'test@example.com';
   ```
5. Check Slack notification

### Test Webhook Manually

```bash
curl -X POST https://your-n8n.com/webhook/highlevel-guest-intake \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": "test123",
    "full_name": "Test Artist",
    "email": "test@example.com",
    "custom_field_topics": ["instagram_marketing", "pricing_strategies"]
  }'
```

---

## Next Steps

1. ✅ Review `guest-intake-form-schema.json`
2. ⬜ Create HighLevel form with 20 topic checkboxes
3. ⬜ Set up custom fields in HighLevel
4. ⬜ Configure webhook in HighLevel
5. ⬜ Build n8n workflow
6. ⬜ Test form submission end-to-end
7. ⬜ Generate sample social media posts from topics
