#!/usr/bin/env node
/**
 * Index Community Content for Search
 *
 * Extracts searchable text from community markdown files and stores
 * it in file_metadata.metadata.searchable_content for fast fuzzy search.
 *
 * Usage:
 *   node scripts/index-community-content.js
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_KEY - Supabase service role key (for admin operations)
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase config (use service role key for write access)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://abblyaukkoxmgzwretvm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY environment variable required');
    console.error('   Set it to your Supabase service role key (from dashboard > Settings > API)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Extract searchable text from markdown content
 */
function extractSearchableContent(markdownText) {
    if (!markdownText) return '';

    // Remove markdown syntax but keep meaningful content
    let text = markdownText
        // Remove YAML frontmatter
        .replace(/^---[\s\S]*?---/m, '')
        // Remove HTML tags
        .replace(/<[^>]+>/g, ' ')
        // Remove headers (but keep text)
        .replace(/^#+\s+/gm, '')
        // Remove bold/italic markers (keep text)
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        // Extract link text, remove URLs
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, ' ')
        // Remove inline code
        .replace(/`([^`]+)`/g, '$1')
        // Remove blockquotes
        .replace(/^>\s+/gm, '')
        // Remove list markers
        .replace(/^[\*\-\+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        // Remove multiple spaces/newlines
        .replace(/\s+/g, ' ')
        .trim();

    // Extract important keywords (filter stop words)
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these',
        'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their'
    ]);

    const words = text
        .toLowerCase()
        .split(/\s+/)
        .filter(w => {
            // Keep words that are:
            // - At least 3 characters
            // - Not stop words
            // - Alphanumeric (allow hyphens)
            return w.length >= 3 &&
                   !stopWords.has(w) &&
                   /^[a-z0-9\-]+$/.test(w);
        });

    // Deduplicate and limit to ~300 most important words
    // (weighted by frequency - words appearing multiple times are more important)
    const wordFreq = {};
    words.forEach(w => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
    });

    // Sort by frequency, take top 300
    const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 300)
        .map(([word]) => word);

    return topWords.join(' ');
}

/**
 * Index all communities
 */
async function indexAllCommunities() {
    console.log('🔍 Fetching communities from database...\n');

    // Fetch all active communities
    const { data: communities, error: fetchError } = await supabase
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'community')
        .eq('status', 'active')
        .order('slug');

    if (fetchError) {
        console.error('❌ Error fetching communities:', fetchError);
        process.exit(1);
    }

    console.log(`Found ${communities.length} communities to index\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const community of communities) {
        const slug = community.slug;
        const name = community.metadata?.name || slug;

        // Get city from metadata to construct correct path
        const city = (community.metadata?.city || community.city || 'bengaluru').toLowerCase();

        try {
            // Try to fetch markdown from Storage
            // Path format: communities/{city}/{slug}.md
            const { data: markdownFile, error: downloadError } = await supabase.storage
                .from('notf')
                .download(`communities/${city}/${slug}.md`);

            if (downloadError || !markdownFile) {
                console.log(`⚠️  ${name} - No markdown file found, skipping`);
                skippedCount++;
                continue;
            }

            // Read markdown content
            const markdownText = await markdownFile.text();

            // Extract searchable content
            const searchableContent = extractSearchableContent(markdownText);

            if (!searchableContent || searchableContent.length < 10) {
                console.log(`⚠️  ${name} - No meaningful content extracted, skipping`);
                skippedCount++;
                continue;
            }

            // Update metadata with searchable content
            const { error: updateError } = await supabase
                .from('file_metadata')
                .update({
                    metadata: {
                        ...community.metadata,
                        searchable_content: searchableContent,
                        indexed_at: new Date().toISOString(),
                        indexed_words: searchableContent.split(' ').length
                    }
                })
                .eq('id', community.id);

            if (updateError) {
                console.error(`❌ ${name} - Update error:`, updateError.message);
                errorCount++;
            } else {
                const wordCount = searchableContent.split(' ').length;
                console.log(`✅ ${name} - Indexed ${wordCount} keywords`);
                successCount++;
            }

        } catch (error) {
            console.error(`❌ ${name} - Error:`, error.message);
            errorCount++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Indexing Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successfully indexed:  ${successCount}`);
    console.log(`⚠️  Skipped (no content): ${skippedCount}`);
    console.log(`❌ Failed:               ${errorCount}`);
    console.log(`📝 Total processed:      ${communities.length}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
        console.log('🎉 Content indexing complete!');
        console.log('   The discovery search will now search markdown content.\n');
    }
}

/**
 * Test extraction on a sample
 */
async function testExtraction(slug, city = 'bengaluru') {
    console.log(`🧪 Testing extraction for: ${slug} (${city})\n`);

    const { data: markdownFile, error } = await supabase.storage
        .from('notf')
        .download(`communities/${city.toLowerCase()}/${slug}.md`);

    if (error || !markdownFile) {
        console.error('❌ Could not fetch markdown file:', error);
        return;
    }

    const markdownText = await markdownFile.text();
    const searchableContent = extractSearchableContent(markdownText);

    console.log('Original markdown length:', markdownText.length);
    console.log('Extracted keywords:', searchableContent.split(' ').length);
    console.log('\nFirst 500 chars of searchable content:');
    console.log(searchableContent.substring(0, 500));
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args[0] === '--test' && args[1]) {
        // Test mode: node scripts/index-community-content.js --test <slug>
        testExtraction(args[1])
            .then(() => process.exit(0))
            .catch(error => {
                console.error('Error:', error);
                process.exit(1);
            });
    } else if (args[0] === '--help' || args[0] === '-h') {
        console.log(`
Usage:
  node scripts/index-community-content.js         # Index all communities
  node scripts/index-community-content.js --test <slug>  # Test extraction for one community

Environment Variables:
  SUPABASE_URL          Supabase project URL (default: abblyaukkoxmgzwretvm.supabase.co)
  SUPABASE_SERVICE_KEY  Supabase service role key (required)

Example:
  SUPABASE_SERVICE_KEY=your-key-here node scripts/index-community-content.js
        `);
        process.exit(0);
    } else {
        // Index all communities
        indexAllCommunities()
            .then(() => process.exit(0))
            .catch(error => {
                console.error('Fatal error:', error);
                process.exit(1);
            });
    }
}

module.exports = {
    extractSearchableContent,
    indexAllCommunities
};
