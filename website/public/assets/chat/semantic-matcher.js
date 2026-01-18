/**
 * Semantic Matcher using Transformers.js
 * Provides semantic similarity matching for complaint categorization
 */

class SemanticMatcher {
    constructor() {
        this.pipeline = null;
        this.isLoading = false;
        this.isReady = false;
        this.categoryEmbeddings = null;
        this.categories = [];
    }

    /**
     * Initialize the semantic matcher with Transformers.js
     * Uses all-MiniLM-L6-v2 model (23MB, ~100ms inference)
     */
    async initialize() {
        if (this.isReady) return true;
        if (this.isLoading) return false;

        try {
            this.isLoading = true;
            console.log('[SemanticMatcher] Loading Transformers.js model...');

            // Dynamically import Transformers.js from CDN
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');

            // Configure to use Hugging Face CDN for models
            env.allowRemoteModels = true;
            env.allowLocalModels = false;
            env.useBrowserCache = true;
            env.backends.onnx.wasm.numThreads = 1; // Single thread for better compatibility

            console.log('[SemanticMatcher] Loading model from Hugging Face CDN...');

            // Load the feature extraction pipeline with all-MiniLM-L6-v2 model
            this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true,  // Use quantized model for smaller size
                progress_callback: (progress) => {
                    if (progress.status === 'downloading') {
                        console.log(`[SemanticMatcher] Downloading: ${progress.file} (${progress.progress}%)`);
                    }
                }
            });

            this.isReady = true;
            this.isLoading = false;
            console.log('[SemanticMatcher] Model loaded successfully!');
            return true;
        } catch (error) {
            console.error('[SemanticMatcher] Failed to load model:', error);
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Precompute embeddings for all categories
     * @param {Array} categories - Array of category objects with {id, name, keywords, department}
     */
    async precomputeCategoryEmbeddings(categories) {
        if (!this.isReady) {
            const initialized = await this.initialize();
            if (!initialized) return false;
        }

        try {
            console.log('[SemanticMatcher] Precomputing embeddings for', categories.length, 'categories...');

            this.categories = categories;
            this.categoryEmbeddings = [];

            for (const category of categories) {
                // Create a rich text representation for embedding
                // Include category name, keywords, and department
                const categoryText = this.getCategoryText(category);

                // Get embedding
                const embedding = await this.embed(categoryText);
                this.categoryEmbeddings.push({
                    categoryId: category.id,
                    embedding: embedding,
                    text: categoryText
                });
            }

            console.log('[SemanticMatcher] Precomputed', this.categoryEmbeddings.length, 'embeddings');
            return true;
        } catch (error) {
            console.error('[SemanticMatcher] Failed to precompute embeddings:', error);
            return false;
        }
    }

    /**
     * Get rich text representation of category for embedding
     * @param {Object} category - Category object
     * @returns {string} - Text representation
     */
    getCategoryText(category) {
        const parts = [category.name];

        // Add keywords if available
        if (category.keywords && category.keywords.length > 0) {
            parts.push(...category.keywords);
        }

        // Add department as context
        if (category.department) {
            parts.push(category.department);
        }

        return parts.join(' ');
    }

    /**
     * Generate embedding for text
     * @param {string} text - Text to embed
     * @returns {Array} - Embedding vector
     */
    async embed(text) {
        if (!this.isReady) {
            throw new Error('SemanticMatcher not initialized');
        }

        const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    /**
     * Calculate cosine similarity between two embeddings
     * @param {Array} embedding1 - First embedding vector
     * @param {Array} embedding2 - Second embedding vector
     * @returns {number} - Similarity score (0-1)
     */
    cosineSimilarity(embedding1, embedding2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }

    /**
     * Find best matching categories using semantic similarity
     * @param {string} description - User's complaint description
     * @param {number} limit - Maximum number of results
     * @param {number} threshold - Minimum similarity threshold (0-1)
     * @returns {Array} - Array of {category, score} objects
     */
    async findMatches(description, limit = 5, threshold = 0.5) {
        if (!this.isReady || !this.categoryEmbeddings) {
            console.warn('[SemanticMatcher] Not ready for matching');
            return [];
        }

        try {
            // Embed the user's description
            const descriptionEmbedding = await this.embed(description);

            // Calculate similarity with all categories
            const matches = [];

            for (let i = 0; i < this.categoryEmbeddings.length; i++) {
                const catEmb = this.categoryEmbeddings[i];
                const similarity = this.cosineSimilarity(descriptionEmbedding, catEmb.embedding);

                if (similarity >= threshold) {
                    const category = this.categories.find(c => c.id === catEmb.categoryId);
                    if (category) {
                        matches.push({
                            ...category,
                            score: similarity,
                            matchType: 'semantic',
                            matchedText: catEmb.text
                        });
                    }
                }
            }

            // Sort by similarity score (highest first) and limit
            return matches.sort((a, b) => b.score - a.score).slice(0, limit);
        } catch (error) {
            console.error('[SemanticMatcher] Matching error:', error);
            return [];
        }
    }

    /**
     * Get the best matching category
     * @param {string} description - User's complaint description
     * @param {number} threshold - Minimum similarity threshold
     * @returns {Object|null} - Best matching category or null
     */
    async getBestMatch(description, threshold = 0.5) {
        const matches = await this.findMatches(description, 1, threshold);
        return matches.length > 0 ? matches[0] : null;
    }
}

// Create global instance
window.semanticMatcher = new SemanticMatcher();
