# WhatsApp Integration Plan for NOTF

## Decision Summary (2026-01-20)

**Selected Approach:** Phased MVP - Custom Lightweight Bridge (Serverless)

**Key Decisions:**
- **Primary Use Case:** Discovery Bot (search communities/providers) → Expand to all features
- **Expected Volume:** 100-500 messages/day (medium)
- **Infrastructure:** Serverless only (Vercel + Supabase) - $0 infrastructure cost
- **Meta Setup Status:** Need to set up Meta WhatsApp Business API account

---

## Implementation Phases

### Phase 1: Discovery Bot MVP (Weeks 1-3)
**Goal:** Enable users to search for communities and solution providers via WhatsApp

**Features:**
- ✅ Search for communities by keyword ("waste management malleswaram")
- ✅ Search for solution providers by domain/focus area
- ✅ Location-based filtering (city, neighborhood)
- ✅ Session management for multi-message conversations

**Technical Approach:**
- Reuse 90% of `/website/public/assets/chat/discovery-engine.js` (380 lines)
- Adapt Fuse.js search logic for WhatsApp text responses
- Create serverless webhook handlers in Vercel Edge Functions
- Store session state in Supabase `whatsapp_sessions` table

**Deliverables:**
1. Meta WhatsApp Business API setup guide
2. Supabase database migration (session tables)
3. Vercel Edge Functions for webhook handling
4. WhatsApp message formatter (HTML → WhatsApp markdown)
5. Beta testing with 10-20 users

---

### Phase 2: Complaint Filing (Weeks 4-6)
**Goal:** Enable civic complaint filing via WhatsApp

**Features:**
- ✅ Multi-step conversation flow (description → location → phone)
- ✅ GPS location validation using boundary-validator.js
- ✅ Submit to notf-cms API
- ✅ Return ticket ID and tracking link

**Technical Approach:**
- Reuse 80% of `/website/public/assets/chat/complaint-engine.js` (653 lines)
- Implement state machine for multi-step flow
- WhatsApp location message support
- Integrate with existing complaint API

**Deliverables:**
1. Session state machine implementation
2. Location message handling
3. Integration with notf-cms complaint API
4. Error handling and retry logic

---

### Phase 3: Broadcast Updates (Month 2-3)
**Goal:** Enable communities to send updates to subscribers

**Features:**
- ✅ Subscription management (opt-in/opt-out)
- ✅ Broadcast campaigns to community subscribers
- ✅ Template management and Meta approval workflow
- ✅ Rate limit handling (250-1000 messages/day initially)

**Technical Approach:**
- Meta template approval (1-2 weeks lead time)
- Supabase `whatsapp_subscriptions` table
- Broadcast queue with rate limiting
- Admin dashboard integration

**Deliverables:**
1. Template approval workflow
2. Subscription management UI in admin panel
3. Broadcast campaign scheduler
4. Compliance with GDPR/DPDPA (30-day retention, easy opt-out)

---

### Phase 4: Validation & Scale Decision (Month 3)
**Goal:** Measure success and decide whether to migrate to Whatomate

**Metrics to Track:**
- Daily active users
- Messages per day
- Conversation completion rate
- User satisfaction (feedback)
- API costs

**Decision Criteria:**

| Metric | Stay Serverless | Deploy Whatomate |
|--------|----------------|------------------|
| Messages/day | < 500 | > 500 |
| Active users | < 200 | > 200 |
| Broadcast requests | < 20/week | > 20/week |
| Admin inbox needed | No | Yes |

---

## Architecture: Custom Lightweight Bridge

### System Diagram

```
WhatsApp User → Meta WhatsApp API → Vercel Edge Function (/api/whatsapp/webhook)
                                            ↓
                                  Load session (Supabase)
                                            ↓
                      ┌─────────────────────┼─────────────────────┐
                      ↓                     ↓                     ↓
              Discovery Engine      Complaint Engine       Boundary Validator
              (Fuse.js search)     (Multi-step flow)       (GPS validation)
              (90% reusable)       (80% reusable)          (100% reusable)
                      ↓                     ↓                     ↓
                              Format response (WhatsApp markdown)
                                            ↓
                              Send via Meta WhatsApp API
                                            ↓
                          Log message (Supabase whatsapp_messages)
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Webhook Handler | Vercel Edge Function | Receives Meta webhooks |
| Session Storage | Supabase PostgreSQL | Conversation state |
| Search Engine | Fuse.js | Fuzzy search (existing) |
| Boundary Validation | GeoJSON + Turf.js | GPS validation (existing) |
| API Client | Fetch API | Submit complaints (existing) |
| Message Formatting | Custom JS | HTML → WhatsApp markdown |

---

## Database Schema

### New Tables Required

```sql
-- WhatsApp session management
CREATE TABLE whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    mode VARCHAR(20), -- 'discovery' | 'complaint' | 'idle'
    state JSONB, -- { step: 'awaiting_location', complaint_data: {...} }
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX idx_whatsapp_sessions_updated ON whatsapp_sessions(last_message_at);

-- WhatsApp message log (analytics)
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    direction VARCHAR(10), -- 'inbound' | 'outbound'
    message_type VARCHAR(20), -- 'text' | 'image' | 'location'
    text TEXT,
    media_url TEXT,
    meta_message_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at);

-- WhatsApp subscriptions (Phase 3 - broadcasts)
CREATE TABLE whatsapp_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    community_id UUID REFERENCES file_metadata(id) ON DELETE CASCADE,
    opted_in_at TIMESTAMPTZ DEFAULT NOW(),
    opted_out_at TIMESTAMPTZ,
    UNIQUE(phone_number, community_id)
);

CREATE INDEX idx_whatsapp_subscriptions_phone ON whatsapp_subscriptions(phone_number);
CREATE INDEX idx_whatsapp_subscriptions_community ON whatsapp_subscriptions(community_id);

-- Auto-cleanup old sessions (privacy compliance)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM whatsapp_sessions
    WHERE last_message_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily via cron)
-- Note: Set up via Supabase dashboard or pg_cron extension
```

---

## File Structure

### New Files to Create

```
/notf-cms/api/whatsapp/
├── webhook.js              # Receives Meta webhooks (~300 lines)
├── verify.js               # Webhook verification (~50 lines)
├── send-message.js         # Helper to send messages (~100 lines)
└── session-manager.js      # Session state management (~150 lines)

/notf/website/public/assets/chat/
├── whatsapp-formatter.js   # HTML → WhatsApp markdown (~100 lines)
└── whatsapp-handler.js     # Main WhatsApp logic (~200 lines)

/notf/supabase/migrations/
└── 20260120_add_whatsapp_tables.sql  # New tables
```

### Existing Files to Reuse (90-100%)

```
/notf/website/public/assets/chat/
├── discovery-engine.js     # REUSE 90% - Core search logic (380 lines)
├── complaint-engine.js     # REUSE 80% - Complaint flow (653 lines)
├── boundary-validator.js   # REUSE 100% - GPS validation (195 lines)
└── notf-cms-api.js        # REUSE 100% - API client (150 lines)
```

**Total New Code:** ~900 lines
**Total Reusable Code:** ~1,378 lines (60% code reuse)

---

## Meta WhatsApp Business API Setup

### Step 1: Create Meta Business Manager Account

1. Go to https://business.facebook.com/
2. Click "Create Account"
3. Enter business details:
   - Business name: "Neighbourhoods of the Future" or "NOTF"
   - Your name
   - Business email
4. Verify email address

### Step 2: Create WhatsApp Business App

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - App name: "NOTF WhatsApp Integration"
   - App contact email: [your email]
   - Business account: Select your Business Manager
5. Click "Create App"

### Step 3: Add WhatsApp Product

1. In app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. Select your Business Manager account
4. Follow the setup wizard:
   - Create or select a WhatsApp Business Account
   - Add a phone number (can start with Meta's test number)
   - Verify phone number via SMS

### Step 4: Get API Credentials

**Phone Number ID:**
1. In WhatsApp product settings, click "API Setup"
2. Copy the "Phone Number ID" (starts with `1234567890`)

**Access Token:**
1. In WhatsApp API Setup page, find "Temporary access token"
2. Copy the token (starts with `EAAxxxxxxxxxxxx`)
3. **Important:** This is temporary (24 hours). For production:
   - Go to "Settings" → "Basic"
   - Under "App Secret", click "Show"
   - Generate a **System User Token** (never expires):
     - Business Settings → System Users → Add
     - Assign WhatsApp permissions
     - Generate token with `whatsapp_business_messaging` permission

**Webhook Verify Token:**
1. Create a random string (e.g., `notf_webhook_secret_2026`)
2. Store this securely - you'll need it for webhook setup

### Step 5: Configure Webhook

1. In WhatsApp API Setup, click "Configure Webhooks"
2. Click "Edit" next to "Callback URL"
3. Enter:
   - **Callback URL:** `https://notf-cms.vercel.app/api/whatsapp/webhook`
   - **Verify token:** `notf_webhook_secret_2026` (the random string you created)
4. Click "Verify and Save"
5. Subscribe to webhook fields:
   - ✅ messages
   - ✅ message_status (optional - for delivery tracking)

### Step 6: Environment Variables for Vercel

Add these to Vercel project settings (notf-cms):

```bash
META_API_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxx  # From Step 4
META_PHONE_NUMBER_ID=1234567890           # From Step 4
META_WEBHOOK_VERIFY_TOKEN=notf_webhook_secret_2026  # From Step 5
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Example User Flows

### Flow 1: Discovery Search

```
User: "waste management malleswaram"

Bot: "🔍 Found 3 communities:

1️⃣ *Malleswaram Residents Welfare Association*
📍 Malleswaram, Bengaluru
🌱 Focus: SWM, Recycling, Composting
👥 50+ members
📞 +91-9845111117

2️⃣ *Ward 20 Clean Streets Initiative*
📍 Ward 20, Bengaluru
🌱 Focus: Waste segregation

3️⃣ *Waste Warriors Collective*
📍 Citywide
🌱 Focus: Zero waste

Reply with a number (1-3) for details, or send a new search."

User: "1"

Bot: "*Malleswaram Residents Welfare Association*

📝 Description:
Community-led initiative focused on door-to-door waste collection...

🌐 Website: https://mrwa.org
📧 Email: contact@mrwa.org
🗺️ Location: 12.9716, 77.5946

Need help with something else? Send:
- 'search' - New search
- 'complaint' - File civic issue
- 'menu' - Main menu"
```

### Flow 2: Complaint Filing

```
User: "file complaint"

Bot: "📝 *File a Civic Complaint*

Please describe the issue you want to report:"

User: "Garbage not collected for 3 days on MG Road"

Bot: "Got it!

📍 Share your location:
- Tap the '+' button
- Select 'Location'
- Send your current location

Or send your address manually."

User: [Sends GPS: 12.9716, 77.5946]

Bot validates boundary...

Bot: "✅ Location verified: Malleswaram, Bengaluru

📞 Your phone number for updates?"

User: "9845111117"

Bot submits to notf-cms API...

Bot: "✅ *Complaint Filed Successfully!*

🎫 Ticket ID: #COMP-12345
📍 Location: Malleswaram
📝 Issue: Garbage not collected for 3 days on MG Road

Track your complaint:
https://notf-cms.vercel.app/track/COMP-12345

You'll receive updates via WhatsApp.

Need anything else? Send 'menu' for options."
```

### Flow 3: Menu Navigation

```
User: "menu"

Bot: "👋 *NOTF Assistant*

What would you like to do?

1️⃣ Search communities
2️⃣ Search solution providers
3️⃣ File civic complaint
4️⃣ Subscribe to updates
5️⃣ Help

Reply with a number (1-5) or type your request."
```

---

## Cost Estimates

### Infrastructure (Serverless)

| Component | Cost |
|-----------|------|
| Vercel Edge Functions | $0 (included in free tier) |
| Supabase Database | $0 (free tier: 500MB, sufficient for sessions) |
| **Total Infrastructure** | **$0/month** |

### Meta WhatsApp API (India Pricing)

**Conversation-based Pricing:**
- **User-initiated conversations:** FREE ✅ (when user messages first)
- **Business-initiated conversations:** ₹0.18-0.63 per 24-hour window

**Cost Scenarios:**

| Usage Level | Messages/Month | User-initiated (80%) | Business-initiated (20%) | Total Cost |
|-------------|----------------|----------------------|--------------------------|------------|
| **Beta (50 users)** | 500 | 400 (FREE) | 100 (₹50) | ₹50 ($0.60) |
| **Growth (200 users)** | 2,000 | 1,600 (FREE) | 400 (₹200) | ₹200 ($2.40) |
| **Target (500 users)** | 5,000 | 4,000 (FREE) | 1,000 (₹500) | ₹500 ($6) |

**Key Insight:** Discovery search is user-initiated → FREE! Only broadcasts and proactive messages cost money.

---

## Rate Limits

Meta WhatsApp API uses a **tiered rate limit system:**

| Tier | Daily Limit | How to Reach |
|------|-------------|--------------|
| **Tier 1 (New)** | 250 messages/24h | Default for new businesses |
| **Tier 2** | 1,000 messages/24h | After 7 days + good quality rating |
| **Tier 3** | 10,000 messages/24h | Quality-based (low block rate) |
| **Tier 4** | 100,000 messages/24h | High quality, established business |

**Implication:** Start slow, cannot blast 1000s of messages immediately. Perfect for phased rollout.

---

## Privacy & Compliance

### GDPR/DPDPA Requirements

1. **Explicit Opt-in for Broadcasts:**
   - Users must actively subscribe to receive updates
   - Clear opt-in message: "Reply YES to receive community updates"

2. **Easy Opt-out:**
   - Support "STOP" command
   - Unsubscribe link in messages
   - Instant opt-out processing

3. **Data Retention:**
   - Delete sessions older than 30 days
   - Delete message logs after 90 days
   - Support user data deletion requests

4. **Transparency:**
   - Privacy policy link in welcome message
   - Clear explanation of data usage
   - No sharing phone numbers with third parties

### Implementation

```javascript
// Auto-cleanup in webhook handler
if (session && session.last_message_at < Date.now() - 30 * 24 * 60 * 60 * 1000) {
    await supabase.from('whatsapp_sessions').delete().eq('id', session.id);
}

// Opt-out handling
if (message.text.toLowerCase() === 'stop') {
    await supabase
        .from('whatsapp_subscriptions')
        .update({ opted_out_at: new Date() })
        .eq('phone_number', from);

    await sendWhatsAppMessage(from, "✅ You've been unsubscribed. Reply START to re-subscribe.");
}
```

---

## Success Metrics

### Phase 1 (MVP - Weeks 1-3)

**Launch Criteria:**
- [ ] Users can search for communities via WhatsApp
- [ ] Response time < 5 seconds (95th percentile)
- [ ] Zero critical errors in 7 days
- [ ] 80% positive feedback from 10 beta users
- [ ] Message delivery rate > 95%

**Key Metrics:**
- Daily active users (target: 10-20)
- Searches per day (target: 20-50)
- Average response time (target: < 3s)
- Error rate (target: < 1%)

### Phase 2 (Complaints - Weeks 4-6)

**Launch Criteria:**
- [ ] Complaint filing works end-to-end
- [ ] 50+ active users/week
- [ ] 100+ messages/day
- [ ] 40% user retention (7-day)
- [ ] Complaint success rate > 80%

**Key Metrics:**
- Complaints filed per day (target: 10-20)
- Conversation completion rate (target: > 70%)
- Average time to file complaint (target: < 2 min)

### Phase 3 (Broadcasts - Month 2-3)

**Launch Criteria:**
- [ ] Template approved by Meta
- [ ] 100+ subscribers
- [ ] Broadcast delivery rate > 90%
- [ ] Opt-out rate < 5%

**Key Metrics:**
- Subscribers per community (target: 20-50)
- Broadcast open rate (if trackable)
- Opt-out rate (target: < 3%)

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Low WhatsApp adoption** | High | High | Start with beta, measure weekly, pivot if < 20 users after 1 month |
| **Meta rate limits hit early** | Medium | Medium | Queue messages, implement retry logic, upgrade tier quickly |
| **Template approval delays** | High | Medium | Prepare templates early (Week 4), expect 2-week approval time |
| **Session state bugs** | Medium | Medium | Extensive testing, add comprehensive logging, error recovery |
| **Cost overruns** | Low | Medium | Monitor daily, set alerts at ₹1000/month, implement rate limiting |
| **User confusion (text UI)** | Medium | Low | Clear instructions, use emojis/formatting, test with non-tech users |
| **GDPR violations** | Low | High | Implement consent, deletion, 30-day retention from Day 1 |

---

## Development Timeline

### Week 1: Meta Setup & Database
- [ ] Create Meta Business Manager account
- [ ] Set up WhatsApp Business API
- [ ] Get API credentials
- [ ] Create Supabase migration
- [ ] Deploy database tables
- [ ] Configure Vercel environment variables

### Week 2: Core Development
- [ ] Create webhook handler (`/api/whatsapp/webhook.js`)
- [ ] Create webhook verification (`/api/whatsapp/verify.js`)
- [ ] Implement session manager
- [ ] Adapt discovery-engine.js for WhatsApp
- [ ] Create WhatsApp message formatter
- [ ] Implement send-message helper

### Week 3: Testing & Beta Launch
- [ ] Test webhook with Meta test number
- [ ] Test discovery search end-to-end
- [ ] Test session management
- [ ] Test error handling
- [ ] Beta launch with 10 users
- [ ] Monitor and gather feedback

### Week 4-6: Complaint Filing
- [ ] Implement multi-step state machine
- [ ] Adapt complaint-engine.js
- [ ] Test location message handling
- [ ] Test boundary validation
- [ ] Test API integration
- [ ] Expand beta to 50 users

### Month 2-3: Broadcasts (if validated)
- [ ] Prepare Meta templates
- [ ] Submit for approval (wait 1-2 weeks)
- [ ] Implement subscription management
- [ ] Create broadcast queue
- [ ] Test with small group
- [ ] Full rollout

---

## Validation Checkpoints

### Checkpoint 1 (End of Week 3)
**Decision:** Continue or pivot?

**Continue if:**
- ✅ 20+ messages/day
- ✅ 10+ active users
- ✅ 80%+ positive feedback
- ✅ < 5% error rate

**Pivot if:**
- ❌ < 10 messages/day
- ❌ < 5 active users
- ❌ Negative feedback
- ❌ High technical errors

### Checkpoint 2 (End of Week 6)
**Decision:** Expand features or stay lean?

**Expand to broadcasts if:**
- ✅ 100+ messages/day
- ✅ 50+ active users
- ✅ 5+ communities requesting broadcast feature
- ✅ Complaints working smoothly

**Stay lean if:**
- ❌ < 50 messages/day
- ❌ Primarily just discovery search usage
- ❌ No broadcast requests

### Checkpoint 3 (End of Month 2)
**Decision:** Deploy Whatomate or stay serverless?

**Deploy Whatomate if:**
- ✅ 500+ messages/day
- ✅ 200+ active users
- ✅ 20+ broadcast requests/week
- ✅ Admin inbox needed

**Stay serverless if:**
- ❌ < 300 messages/day
- ❌ Manageable with current setup
- ❌ Cost still under ₹1000/month

---

## Support & Documentation

### Resources
- **Meta WhatsApp Docs:** https://developers.facebook.com/docs/whatsapp
- **Fuse.js (for search):** https://fusejs.io
- **Supabase Docs:** https://supabase.com/docs
- **NOTF Architecture:** `/ARCHITECTURE.md`

### Key Code References
- Discovery Engine: `/website/public/assets/chat/discovery-engine.js`
- Complaint Engine: `/website/public/assets/chat/complaint-engine.js`
- Boundary Validator: `/website/public/assets/chat/boundary-validator.js`
- NOTF API Client: `/website/public/assets/chat/notf-cms-api.js`

### Testing Numbers
- **Meta Test Number:** Use Meta's provided test number for initial development
- **Personal Number:** Add your personal WhatsApp to test beta
- **Beta Group:** 10-20 early adopters from existing communities

---

## Next Steps (When Ready to Implement)

1. **Immediate:**
   - Create Meta Business Manager account (10 minutes)
   - Set up WhatsApp Business API (30 minutes)
   - Get API credentials and store securely

2. **Week 1:**
   - Create Supabase migration
   - Deploy database tables
   - Set up Vercel environment variables
   - Create webhook skeleton

3. **Week 2:**
   - Implement core webhook logic
   - Adapt discovery engine
   - Test with Meta test number

4. **Week 3:**
   - Beta test with real users
   - Monitor and iterate
   - Gather feedback

---

## Status: ON HOLD

**Reason:** Prioritizing chatbot community matching bug fix and Excel loading feature testing.

**Resume When:** Community matching is stable and Excel feature is validated.

**Contact:** Sathya (project maintainer)

**Last Updated:** 2026-01-20
