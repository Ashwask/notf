/**
 * Seed Script: Insert 3 Bengaluru community stories into Supabase
 *
 * HOW TO RUN:
 * ===========
 * Option A - Browser Console (Recommended):
 *   1. Log into the admin panel at /admin/login.html
 *   2. Navigate to /admin/stories.html
 *   3. Open browser DevTools (F12) -> Console tab
 *   4. Copy-paste this entire script and press Enter
 *
 * Option B - Node.js with Service Role Key:
 *   1. Set environment variable: export SUPABASE_SERVICE_ROLE_KEY="your-key-here"
 *   2. Run: cd website && node ../scripts/seed-bengaluru-stories.js
 *
 * Source: "Stories for NOTF.pdf" from /supporting documents/catalogue/
 */

const STORIES = [
  {
    title: "Rethinking Urban Waste",
    city: "Bengaluru",
    community: "Hebbagodi",
    location: "Hebbagodi",
    themes: ["Waste Management", "Community Design", "Urban Infrastructure", "Neighbourhood Improvement"],
    youtube_url: null,
    excerpt: "In Hebbagodi, early-morning workers had no way to dispose of waste before municipal collection vehicles arrived, creating persistent dumping black spots. The Kasa Kiosk program transformed these neglected sites into beautified, 24/7 waste collection points, turning a logistical burden into shared community pride.",
    status: "active",
    content: `## Case Study: Rethinking Urban Waste in the 'Neighbourhoods of the Future'

### The Challenge: The Gap Between Work and Waste

In the vibrant neighborhood of Hebbagodi, a significant challenge emerged from the intersection of modern work schedules and traditional municipal services.

A large portion of the local workforce must depart for their jobs early in the morning, often long before the scheduled waste collection vehicles arrive. Without a viable alternative, many residents were forced to dispose of their waste in public spaces, leading to the formation of "black spots" - persistent areas of street dumping that degraded the local environment.

### The Strategy: A Localised, Human-Centric Approach

Rather than applying a generic city-wide fix, the initiative adopted a strategy centered on the specific rhythms of the Hebbagodi community. The goal was to transform these "black spots" from areas of neglect into assets for the neighbourhood. This approach focused on deep local identification: finding the exact spots where dumping occurred and understanding the underlying reason - the mismatch in timing, rather than simply blaming the residents.

### The Solution: The Kasa Kiosk

To bridge this gap, the program introduced the Kasa Kiosk. These kiosks were strategically placed at the identified dumping sites to provide a 24/7 accessible collection point for workers leaving at dawn.

The intervention went beyond mere infrastructure; it focused on aesthetic and social transformation:

- **Site Reclamation:** Each "black spot" was thoroughly cleaned and prepared before the installation of the kiosk.
- **Beautification as Acceptance:** To counter the common perception that waste centers are "dirty" or undesirable in a neighborhood, the exteriors of the collection points and kiosks were beautified with professional drawings and paintings. This helped shift the community's view of waste infrastructure from an eyesore to an aesthetically pleasing part of the streetscape.
- **Community Awareness:** Parallel to the physical installation, the team conducted outreach to inform residents that these new facilities were available for their convenience, ensuring the transition from street dumping to kiosk use was seamless.

### Impact and Future Outlook

Within a single month, four of these transformed sites have been successfully executed. By addressing the "Not In My Backyard" (NIMBY) sentiment through art and design, the project has successfully reduced community complaints regarding the presence of waste workers and collection centers.

The 'Neighbourhoods of the Future' program is now monitoring these sites to evaluate the long-term response and the permanence of these cleaner, more beautiful public spaces.

This model demonstrates that when urban solutions are tailored to the specific daily lives of residents, environmental management becomes a shared community pride rather than a logistical burden.`
  },
  {
    title: "The Corner That Became a Home",
    city: "Bengaluru",
    community: "Women of Wisdom (WoW)",
    location: "JP Nagar Ward 42",
    themes: ["Dignity of Labour", "Women Empowerment", "Community Space", "Waste Workers", "Neighbourhood Improvement"],
    youtube_url: null,
    excerpt: "In JP Nagar Ward 42, Pourakarmikas worked for nineteen years without a place to sit, rest, or store their tools. Women of Wisdom (WoW) and the Socratus Foundation listened, learned, and built Namma Hasiru Gynan Kalika Kendra - a dignified workspace that transformed invisible workers into respected knowledge-holders in their neighbourhood.",
    status: "active",
    content: `## The Corner That Became a Home

**Program:** Neighbourhoods of the Future
**Told through the voices of:** Women of Wisdom (WoW), the Socratus Foundation, and the Pourakarmikas of Ward 42

### Before: The Invisibles

Lakshmi wakes at 4:00 a.m. every day. Not because she loves the dark, but because the city needs to be clean before it wakes up. She has been a Pourakarmika for nineteen years. She knows which bins overflow on Tuesdays, which lane collects the most leaves, and which apartment complex still mixes wet and dry waste despite the pamphlets.

What she did not have, for nineteen years, was a place to sit.

She would arrive at the ward, pull her cart to the curb, and crouch there, sorting metal from plastic, glass from paper. If it rained, she pressed herself against the wall of a closed shop. If she needed water, she asked. If she needed to use the toilet, she walked fifteen minutes. If she wanted to eat her tiffin without dust settling on it, she ate quickly, standing. And the washroom?

Her daughter, Meena, once asked: *Amma, where is your office?*

Lakshmi laughed. But later, the question stayed.

### The Question

Swetha along with the WoW team heard this question too, in a hundred different forms. They spent months listening to the Pourakarmikas. Not surveying them - just sitting with them, sharing chai, learning names, learning which knee hurt, whose child was preparing for exams.

She learned that the workers did not just need a toilet. They needed a place. A place where they were not guests. A place where the brooms could lean against the wall without being stolen. A place where a woman could rest during her period without explaining herself. A place where the residents of the neighbourhood could finally see who cleaned up after them.

But WoW was a collective of women with more will than wallet. They had the relationships, the trust, the knowledge. They did not have four walls.

### The Knock on the Door

That is when the Socratus Foundation entered the story. Not with a grand announcement or a rigid blueprint. Just a question: *What would you build, if you could?*

Swetha and her team drew it on paper first. A rough sketch, really. A room. A tap. A shelf. Then they drew more. A low step so the older workers could sit comfortably. A board where children from the neighbourhood could pin drawings. A corner to display the things residents throw away - transformed into something beautiful, something instructive.

The Socratus team did not say: Here is our model, implement it. They said: Show us the place. Let us find it together.

### The Building

Construction took weeks. The women visited every day. They watched the walls rise. They argued about the colour of the door (green, like the bins).

When it was done, they did not call it a centre. They called it **Namma Hasiru Gynan Kalika Kendra** - "Our Place."

### The Life Inside

Now, if you visit just after dawn, you will see Lakshmi sitting on the low step, her tiffin box open on her lap. The dust does not settle on it anymore. There is a roof. There is shade.

Inside, the walls are not bare. One wall holds photographs of the workers themselves, taken by a local college student. Residents stop by to look at it. Some bring their children. They ask questions.

*Where does this plastic go?*
*How long does it take to decompose?*
*What happens after we put it in the bin?*

And the Pourakarmikas - who for years were avoided, looked through, spoken about but never to - become the answer-givers.

This is not a story about infrastructure. It is a story about the countless men and women who worked for generations without a place to sit, and now they have one. It is a story about a neighbourhood that learned, slowly, that the person who holds the broom also holds the knowledge and dignity.

### What Remains

The Neighbourhoods of the Future program did not arrive in JP Nagar with a grand theory of change. It arrived with a willingness to listen.

That is the future. Not a smart city. Just a corner that became a home.`
  },
  {
    title: "Prakruthi Shaale: A Nature School Blooms at C.V. Raman's Panchavati",
    city: "Bengaluru",
    community: "Prakruthi Shaale",
    location: "Malleshwaram",
    themes: ["Community", "Waste Management", "Green Cover", "Education"],
    youtube_url: "https://www.youtube.com/watch?v=-MuaNC964Rw",
    excerpt: "At Panchavati, the historic Malleshwaram home of Nobel laureate Sir C.V. Raman, a community-run nature school is helping neighbours of all ages reconnect with nature — from composting temple flower waste to raising the city's next Earth Scouts.",
    status: "active",
    content: `## Prakruthi Shaale: A Nature School Blooms at C.V. Raman's Panchavati

**Program:** Neighbourhoods of the Future
**Community:** Prakruthi Shaale ([@prakruthishaale](https://instagram.com/prakruthishaale))
**Location:** Panchavati, 15th Cross, Malleshwaram, Bengaluru

### A Heritage Space Reborn as a Living Classroom

Tucked behind the trees of 15th Cross, Malleshwaram, sits Panchavati - the 2.5-acre home where Sir C.V. Raman lived and planted fruit trees by hand. Today, this heritage space hosts **Prakruthi Shaale**, a community nature school where the neighbourhood comes to rediscover the joy of learning outdoors.

### The Neighbourhood at Play and Purpose

On any given day you might find children sewing and crafting under the trees, school groups turning temple flower waste into compost, families pitching tents under the open sky, or young Earth Scouts learning to observe, question, and care for the world around them.

### Led by the Community, for the Community

What makes Prakruthi Shaale special is that it's led by the community itself. Waste that would have gone to landfill becomes soil. A historic space becomes a living classroom. And a neighbourhood becomes a little more connected, curious, and climate-resilient - one activity at a time.

*Everyone is welcome. Come embrace the child within you.*

Panchavati, 15th Cross, Malleshwaram, Bengaluru
Instagram: [@prakruthishaale](https://instagram.com/prakruthishaale)`
  }
];

// ============================================================
// Execution logic
// ============================================================

/**
 * Option A: Browser Console (uses edge function with admin auth)
 * - Handles both Storage upload and DB insert via the update-file edge function
 */
async function seedViaEdgeFunction(supabase) {
  for (const story of STORIES) {
    const slug = story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const citySlug = story.city.toLowerCase().replace(/\s+/g, '-');
    const filePath = `stories/${citySlug}/${slug}.md`;

    const metadata = {
      title: story.title,
      type: 'story',
      city: story.city,
      community: story.community,
      location: story.location,
      themes: story.themes,
      youtube_url: story.youtube_url,
      excerpt: story.excerpt,
      content: story.content,
      status: story.status,
      last_updated: new Date().toISOString().split('T')[0]
    };

    console.log(`Creating: "${story.title}" -> ${filePath}`);

    try {
      const { data, error } = await supabase.functions.invoke('update-file', {
        body: {
          file_path: filePath,
          file_type: 'story',
          updates: metadata,
          markdown_body: story.content || ''
        }
      });

      if (error) {
        console.error(`  FAILED (invoke error): ${error.message}`);
        continue;
      }

      if (data?.error) {
        console.error(`  FAILED (function error): ${data.error}`);
        continue;
      }

      console.log(`  SUCCESS: ${data?.message || 'Created'} (version: ${data?.version})`);
    } catch (err) {
      console.error(`  FAILED (exception): ${err.message}`);
    }
  }
}

/**
 * Option B: Node.js with service role key (direct DB insert, bypasses RLS)
 * - Inserts directly into file_metadata table
 * - Also uploads markdown to Supabase Storage
 */
async function seedDirectInsert(supabase) {
  for (const story of STORIES) {
    const slug = story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const citySlug = story.city.toLowerCase().replace(/\s+/g, '-');
    const filePath = `stories/${citySlug}/${slug}.md`;

    const metadata = {
      title: story.title,
      type: 'story',
      city: story.city,
      community: story.community,
      location: story.location,
      themes: story.themes,
      youtube_url: story.youtube_url,
      excerpt: story.excerpt,
      content: story.content,
      status: story.status,
      last_updated: new Date().toISOString().split('T')[0],
      version: 1
    };

    console.log(`Creating: "${story.title}" -> ${filePath}`);

    try {
      // Step 1: Upload markdown file to Supabase Storage
      const markdownContent = `---
title: "${story.title}"
type: story
city: "${story.city}"
community: "${story.community}"
location: "${story.location}"
themes:
${story.themes.map(t => `  - "${t}"`).join('\n')}
youtube_url: ${story.youtube_url || 'null'}
excerpt: "${story.excerpt.replace(/"/g, '\\"')}"
status: "${story.status}"
last_updated: "${new Date().toISOString().split('T')[0]}"
version: 1
---
${story.content}`;

      const { error: uploadError } = await supabase
        .storage
        .from('notf')
        .upload(filePath, markdownContent, {
          contentType: 'text/markdown',
          upsert: true
        });

      if (uploadError) {
        console.error(`  Storage upload failed: ${uploadError.message}`);
        // Continue anyway - DB insert is more important
      } else {
        console.log(`  Storage: uploaded ${filePath}`);
      }

      // Step 2: Upsert into file_metadata table
      const dbRecord = {
        slug,
        file_path: filePath,
        file_type: 'story',
        city: story.city,
        status: story.status,
        metadata,
        version: 1,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('file_metadata')
        .upsert(dbRecord, { onConflict: 'file_path' })
        .select();

      if (error) {
        console.error(`  DB insert FAILED: ${error.message}`);
        continue;
      }

      console.log(`  SUCCESS: DB record created (id: ${data?.[0]?.id || 'unknown'})`);
    } catch (err) {
      console.error(`  FAILED (exception): ${err.message}`);
    }
  }
}

async function seedStories() {
  let supabase;
  let useDirect = false;

  // Detect environment: browser (admin panel) or Node.js
  if (typeof window !== 'undefined' && window.authUtils) {
    // Browser: use the admin panel's authenticated Supabase client + edge function
    console.log('Running in browser with admin auth (via edge function)...');
    supabase = window.authUtils.supabase;

    if (!supabase) {
      console.error('Supabase client not available. Are you logged into the admin panel?');
      return;
    }
  } else if (typeof process !== 'undefined' && process.env) {
    // Node.js: use service role key for direct insert
    console.log('Running in Node.js with service role key (direct insert)...');
    useDirect = true;

    // Try to load .env from scripts directory
    const path = await import('path');
    const fs = await import('fs');
    const url = await import('url');
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const envPath = path.join(__dirname, '.env');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const match = line.match(/^(\w+)=(.+)$/);
        if (match) {
          process.env[match[1]] = match[2].trim();
        }
      }
      console.log('Loaded .env from scripts directory');
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL || 'https://abblyaukkoxmgzwretvm.supabase.co';

    if (!serviceRoleKey) {
      console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY in scripts/.env or as environment variable.');
      process.exit(1);
    }

    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } else {
    console.error('Unknown environment. Run this in a browser console or Node.js.');
    return;
  }

  console.log(`Seeding ${STORIES.length} Bengaluru stories...`);
  console.log('---');

  if (useDirect) {
    await seedDirectInsert(supabase);
  } else {
    await seedViaEdgeFunction(supabase);
  }

  console.log('---');
  console.log('Done! Refresh the Stories admin page to see the new entries.');
}

// Auto-run
seedStories();
