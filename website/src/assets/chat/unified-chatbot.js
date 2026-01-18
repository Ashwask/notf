/**
 * NOTF Unified Chatbot
 * Dual-mode chatbot: Discovery Mode + Complaint Mode
 * Last updated: 2026-01-18
 */

class NotfChatbot {
    constructor() {
        this.state = 'intent_selection';
        this.mode = null; // 'discovery' or 'complaint'
        this.conversationHistory = [];
        this.formData = {};

        // Initialize components
        this.discoveryEngine = null;
        this.complaintEngine = null;
        this.boundaryValidator = null;

        // Session ID
        this.sessionId = this.generateSessionId();

        // Load saved session if exists
        this.loadSession();

        // Initialize UI
        this.initializeUI();
        this.bindEvents();

        // Show welcome message
        this.showWelcomeMessage();
    }

    generateSessionId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initializeUI() {
        const chatWidget = document.getElementById('notf-chatbot');
        if (!chatWidget) {
            console.error('Chatbot widget element not found');
            return;
        }

        this.elements = {
            widget: chatWidget,
            messagesContainer: chatWidget.querySelector('.chat-messages'),
            inputField: chatWidget.querySelector('.chat-input-field'),
            sendButton: chatWidget.querySelector('.chat-send-button'),
            closeButton: chatWidget.querySelector('.chat-close-button'),
            minimizeButton: chatWidget.querySelector('.chat-minimize-button')
        };
    }

    bindEvents() {
        // Send message on button click
        this.elements.sendButton?.addEventListener('click', () => this.sendMessage());

        // Send message on Enter key
        this.elements.inputField?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Close button
        this.elements.closeButton?.addEventListener('click', () => this.closeChatbot());

        // Minimize button
        this.elements.minimizeButton?.addEventListener('click', () => this.minimizeChatbot());
    }

    showWelcomeMessage() {
        this.addBotMessage(`
            <div class="welcome-message">
                <h3>👋 Hello! I'm the NOTF Assistant</h3>
                <p>I can help you:</p>
                <div class="intent-options">
                    <button class="intent-button discovery-button" data-intent="discovery">
                        <span class="icon">🔍</span>
                        <span class="label">Find Communities & Resources</span>
                        <span class="description">Discover organizations, projects, and opportunities</span>
                    </button>
                    <button class="intent-button complaint-button" data-intent="complaint">
                        <span class="icon">📝</span>
                        <span class="label">File a Complaint</span>
                        <span class="description">Report civic issues in your area</span>
                    </button>
                </div>
            </div>
        `);

        // Bind intent selection buttons
        setTimeout(() => {
            document.querySelectorAll('.intent-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const intent = e.currentTarget.dataset.intent;
                    this.selectIntent(intent);
                });
            });
        }, 100);
    }

    selectIntent(intent) {
        this.mode = intent;

        // Add user's choice to conversation
        const choiceText = intent === 'discovery' ? 'Find Communities & Resources' : 'File a Complaint';
        this.addUserMessage(choiceText);

        // Initialize appropriate engine
        if (intent === 'discovery') {
            this.initializeDiscoveryMode();
        } else {
            this.initializeComplaintMode();
        }

        this.saveSession();
    }

    initializeDiscoveryMode() {
        this.state = 'discovery_welcome';

        // Lazy load discovery engine
        if (!this.discoveryEngine) {
            this.discoveryEngine = new DiscoveryEngine(this.getCommunitiesData());
        }

        this.addBotMessage(`
            <div class="mode-message">
                <p>Great! I'll help you discover communities and resources.</p>
                <p>What are you looking for? You can search by:</p>
                <ul>
                    <li>🏘️ Community name or neighborhood</li>
                    <li>🏷️ Theme (waste, education, water, health, etc.)</li>
                    <li>📍 Location (city, area)</li>
                    <li>🤝 Resources (funding, volunteers, space)</li>
                </ul>
                <p>Try asking: <em>"Find communities working on waste management in Bengaluru"</em></p>
            </div>
        `);

        this.enableInput();
    }

    initializeComplaintMode() {
        this.state = 'complaint_welcome';

        // Lazy load complaint engine and boundary validator
        if (!this.complaintEngine) {
            this.complaintEngine = new ComplaintEngine();
        }
        if (!this.boundaryValidator) {
            this.boundaryValidator = new BoundaryValidator();
        }

        this.addBotMessage(`
            <div class="mode-message">
                <p>I'll help you file a complaint about a civic issue.</p>
                <p>Please describe the issue you're facing. Include as much detail as possible:</p>
                <ul>
                    <li>What is the problem?</li>
                    <li>Where is it located?</li>
                    <li>When did it start?</li>
                </ul>
                <p class="tip">💡 <strong>Tip:</strong> Detailed descriptions help the authorities address your complaint faster.</p>
            </div>
        `);

        this.state = 'complaint_description';
        this.enableInput();
    }

    sendMessage() {
        const message = this.elements.inputField.value.trim();

        if (!message) return;

        // Add user message to UI
        this.addUserMessage(message);

        // Clear input
        this.elements.inputField.value = '';

        // Process message based on current mode and state
        this.processMessage(message);

        // Save session
        this.saveSession();
    }

    processMessage(message) {
        if (this.mode === 'discovery') {
            this.processDiscoveryMessage(message);
        } else if (this.mode === 'complaint') {
            this.processComplaintMessage(message);
        }
    }

    processDiscoveryMessage(message) {
        // Use discovery engine to process query
        const results = this.discoveryEngine.search(message);

        if (results.length === 0) {
            this.addBotMessage(`
                <p>I couldn't find any communities matching your search.</p>
                <p>Try:</p>
                <ul>
                    <li>Using different keywords</li>
                    <li>Searching by neighborhood or city</li>
                    <li>Browsing by theme (waste, education, water, etc.)</li>
                </ul>
            `);
        } else {
            this.displayDiscoveryResults(results);
        }
    }

    displayDiscoveryResults(results) {
        const resultsHtml = `
            <div class="discovery-results">
                <p>I found <strong>${results.length}</strong> ${results.length === 1 ? 'community' : 'communities'} for you:</p>
                ${results.map(result => this.renderCommunityCard(result)).join('')}
            </div>
        `;

        this.addBotMessage(resultsHtml);
    }

    renderCommunityCard(community) {
        return `
            <div class="community-card">
                <div class="community-header">
                    <h4>${community.name}</h4>
                    ${community.status ? `<span class="status-badge ${community.status}">${community.status}</span>` : ''}
                </div>
                <div class="community-details">
                    ${community.location ? `<p class="location">📍 ${community.location}</p>` : ''}
                    ${community.focus_areas ? `<p class="tags">🏷️ ${community.focus_areas.join(', ')}</p>` : ''}
                    ${community.members_count ? `<p class="members">👥 ${community.members_count} members</p>` : ''}
                </div>
                ${community.contact ? `
                    <div class="community-actions">
                        <a href="mailto:${community.contact}" class="btn-contact">Contact</a>
                        ${community.url ? `<a href="${community.url}" target="_blank" class="btn-learn-more">Learn More</a>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    processComplaintMessage(message) {
        switch (this.state) {
            case 'complaint_description':
                this.handleComplaintDescription(message);
                break;
            case 'complaint_location':
                this.handleComplaintLocation(message);
                break;
            case 'complaint_contact':
                this.handleComplaintContact(message);
                break;
            case 'complaint_name':
                this.handleComplaintName(message);
                break;
            default:
                this.addBotMessage('Sorry, I got confused. Let me restart the complaint process.');
                this.initializeComplaintMode();
        }
    }

    handleComplaintDescription(message) {
        if (message.length < 10) {
            this.addBotMessage('Please provide more details about the issue (at least 10 characters).');
            return;
        }

        this.formData.description = message;

        // Auto-categorize using ML keywords
        const category = this.complaintEngine.categorizeComplaint(message);

        this.addBotMessage(`
            <p>Thank you for the description.</p>
            ${category ? `<p>I've categorized this as: <strong>${category.name}</strong></p>` : ''}
            <p>Now, please provide the location where this issue is occurring.</p>
            <p>You can:</p>
            <ul>
                <li>Type the address</li>
                <li>Click "Use Map" to select on a map</li>
                <li>Click "Use My Location" for GPS</li>
            </ul>
            <div class="location-options">
                <button class="btn-location-map" onclick="notfChatbot.openMapPicker()">📍 Use Map</button>
                <button class="btn-location-gps" onclick="notfChatbot.useGPS()">🧭 Use My Location</button>
            </div>
        `);

        if (category) {
            this.formData.category_id = category.id;
        }

        this.state = 'complaint_location';
    }

    async handleComplaintLocation(message) {
        this.disableInput();
        this.addBotMessage('⏳ Verifying your location...');

        try {
            // Geocode the address
            const geocoded = await this.geocodeAddress(message);

            if (!geocoded.success) {
                this.addBotMessage(`
                    <p>❌ ${geocoded.message}</p>
                    <p>Please try again with a more specific address (include area, landmark, city).</p>
                `);
                this.enableInput();
                return;
            }

            // Validate against boundaries
            const validation = await this.boundaryValidator.validateLocation(
                geocoded.lat,
                geocoded.lng,
                geocoded.city
            );

            if (!validation.valid) {
                this.showBoundaryValidationError(validation);
                this.enableInput();
                return;
            }

            // Location is valid!
            this.formData.address = message;
            this.formData.latitude = geocoded.lat;
            this.formData.longitude = geocoded.lng;
            this.formData.corporation_id = validation.corporation_code;
            this.formData.locationTag = validation;

            this.addBotMessage(`
                <div class="location-verified">
                    <p>✅ <strong>Location Verified!</strong></p>
                    <p>📍 ${message}</p>
                    <p>🏢 ${validation.corporation_name}</p>
                    ${validation.ward ? `<p>🗺️ Ward: ${validation.ward}</p>` : ''}
                    <p class="success-message">Your complaint will be routed to ${validation.corporation_name}</p>
                </div>
            `);

            this.askForContact();

        } catch (error) {
            console.error('Location validation error:', error);
            this.addBotMessage(`
                <p>❌ Unable to verify location. Please try again.</p>
                <p>You can also use the map picker or GPS option above.</p>
            `);
            this.enableInput();
        }
    }

    showBoundaryValidationError(validation) {
        this.addBotMessage(`
            <div class="boundary-error">
                <p>⚠️ <strong>Location Validation Error</strong></p>
                <p>${validation.message}</p>
                ${validation.nearest_city ? `
                    <p>Nearest supported city: <strong>${validation.nearest_city.name}</strong> (${validation.nearest_city.distance}km away)</p>
                ` : ''}
                <div class="recovery-options">
                    <p>What would you like to do?</p>
                    <button onclick="notfChatbot.retryLocation()">Try Different Address</button>
                    <button onclick="notfChatbot.openMapPicker()">Use Map Picker</button>
                    <button onclick="notfChatbot.viewCoverageMap()">View Coverage Areas</button>
                </div>
            </div>
        `);
    }

    askForContact() {
        this.addBotMessage(`
            <p>Please provide your contact information (phone number or email).</p>
            <p>This helps the authorities reach you for updates.</p>
            <p class="tip">💡 You can provide either phone or email (or both)</p>
        `);

        this.state = 'complaint_contact';
        this.enableInput();
    }

    handleComplaintContact(message) {
        const phoneRegex = /^[6-9]\d{9}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const hasPhone = phoneRegex.test(message.replace(/\s+/g, ''));
        const hasEmail = emailRegex.test(message);

        if (!hasPhone && !hasEmail) {
            this.addBotMessage(`
                <p>Please provide a valid phone number (10 digits starting with 6-9) or email address.</p>
                <p>Example phone: 9876543210</p>
                <p>Example email: name@example.com</p>
            `);
            return;
        }

        if (hasPhone) {
            this.formData.citizen_phone = message.replace(/\s+/g, '');
        }
        if (hasEmail) {
            this.formData.citizen_email = message;
        }

        this.addBotMessage(`
            <p>Thank you! Would you like to provide your name?</p>
            <p class="tip">💡 You can skip this if you prefer to remain anonymous. Just type "skip".</p>
        `);

        this.state = 'complaint_name';
    }

    handleComplaintName(message) {
        if (message.toLowerCase() !== 'skip') {
            this.formData.citizen_name = message;
        }

        this.showComplaintReview();
    }

    showComplaintReview() {
        this.addBotMessage(`
            <div class="complaint-review">
                <h4>📋 Complaint Summary</h4>
                <div class="review-details">
                    <p><strong>Issue:</strong> ${this.formData.description}</p>
                    <p><strong>Location:</strong> ${this.formData.address}</p>
                    <p><strong>Corporation:</strong> ${this.formData.locationTag.corporation_name}</p>
                    ${this.formData.locationTag.ward ? `<p><strong>Ward:</strong> ${this.formData.locationTag.ward}</p>` : ''}
                    <p><strong>Contact:</strong> ${this.formData.citizen_phone || this.formData.citizen_email}</p>
                    ${this.formData.citizen_name ? `<p><strong>Name:</strong> ${this.formData.citizen_name}</p>` : '<p><em>Anonymous</em></p>'}
                </div>
                <div class="review-actions">
                    <button class="btn-submit-complaint" onclick="notfChatbot.submitComplaint()">Submit Complaint</button>
                    <button class="btn-edit" onclick="notfChatbot.editComplaint()">Edit</button>
                </div>
            </div>
        `);

        this.state = 'complaint_review';
        this.disableInput();
    }

    async submitComplaint() {
        this.addBotMessage('⏳ Submitting your complaint...');

        try {
            const response = await fetch('https://notf-cms.vercel.app/api/submit-complaint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: this.formData.description,
                    address: this.formData.address,
                    latitude: this.formData.latitude,
                    longitude: this.formData.longitude,
                    corporation_id: this.formData.corporation_id,
                    category_id: this.formData.category_id,
                    citizen_phone: this.formData.citizen_phone,
                    citizen_email: this.formData.citizen_email,
                    citizen_name: this.formData.citizen_name,
                    metadata: {
                        source: 'notf-chatbot',
                        original_city: this.formData.locationTag.city,
                        corporation_code: this.formData.locationTag.corporation_code,
                        ward: this.formData.locationTag.ward,
                        auto_tagged: true,
                        tagged_at: new Date().toISOString(),
                        tagging_method: 'point-in-polygon',
                        session_id: this.sessionId
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showComplaintSuccess(result.complaint);
            } else {
                throw new Error(result.error || 'Submission failed');
            }

        } catch (error) {
            console.error('Complaint submission error:', error);
            this.addBotMessage(`
                <div class="error-message">
                    <p>❌ Failed to submit complaint: ${error.message}</p>
                    <p>Please try again or contact support.</p>
                    <button onclick="notfChatbot.submitComplaint()">Retry</button>
                </div>
            `);
        }
    }

    showComplaintSuccess(complaint) {
        this.addBotMessage(`
            <div class="complaint-success">
                <h4>✅ Complaint Filed Successfully!</h4>
                <div class="ticket-info">
                    <p class="ticket-number">Ticket Number: <strong>${complaint.complaint_number}</strong></p>
                    <p>Corporation: ${this.formData.locationTag.corporation_name}</p>
                    <p>Status: <span class="status-badge new">New</span></p>
                </div>
                <p class="next-steps">You will receive updates on your complaint via ${this.formData.citizen_phone ? 'phone' : 'email'}.</p>
                <div class="success-actions">
                    <button onclick="notfChatbot.fileAnotherComplaint()">File Another Complaint</button>
                    <button onclick="notfChatbot.closeChatbot()">Close</button>
                </div>
            </div>
        `);

        this.state = 'complaint_submitted';

        // Clear form data
        this.formData = {};
        this.saveSession();
    }

    // Helper methods
    addBotMessage(html) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message bot-message';
        messageEl.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">${html}</div>
        `;
        this.elements.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();

        // Add to conversation history
        this.conversationHistory.push({
            role: 'bot',
            content: html,
            timestamp: new Date().toISOString()
        });
    }

    addUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message user-message';
        messageEl.innerHTML = `
            <div class="message-content">${this.escapeHtml(text)}</div>
            <div class="message-avatar">👤</div>
        `;
        this.elements.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        }, 100);
    }

    enableInput() {
        this.elements.inputField.disabled = false;
        this.elements.inputField.focus();
    }

    disableInput() {
        this.elements.inputField.disabled = true;
    }

    async geocodeAddress(address) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
            );
            const results = await response.json();

            if (results.length === 0) {
                return {
                    success: false,
                    message: 'Could not find this address. Please try adding more details (area, landmark, city).'
                };
            }

            // Extract city from display name
            const city = this.extractCityFromAddress(results[0].display_name);

            return {
                success: true,
                lat: parseFloat(results[0].lat),
                lng: parseFloat(results[0].lon),
                display_name: results[0].display_name,
                city: city
            };
        } catch (error) {
            return {
                success: false,
                message: 'Unable to verify address. Please try using the map picker instead.'
            };
        }
    }

    extractCityFromAddress(displayName) {
        const parts = displayName.split(',').map(p => p.trim());
        // Try to find known city names
        const knownCities = ['Bengaluru', 'Mumbai', 'Chennai', 'Ahmedabad', 'Hyderabad',
                             'Kolkata', 'Pune', 'Jaipur', 'Gurugram', 'Thane',
                             'Bhubaneswar', 'Visakhapatnam'];

        for (const part of parts) {
            for (const city of knownCities) {
                if (part.toLowerCase().includes(city.toLowerCase())) {
                    return city;
                }
            }
        }

        return null;
    }

    getCommunitiesData() {
        // This will be populated from the page's data
        return window.notfData?.communities || [];
    }

    saveSession() {
        const session = {
            sessionId: this.sessionId,
            mode: this.mode,
            state: this.state,
            conversationHistory: this.conversationHistory,
            formData: this.formData,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('notf_chatbot_session', JSON.stringify(session));
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    }

    loadSession() {
        try {
            const saved = localStorage.getItem('notf_chatbot_session');
            if (saved) {
                const session = JSON.parse(saved);

                // Check if session is less than 1 hour old
                if (Date.now() - session.timestamp < 60 * 60 * 1000) {
                    // Offer to restore session (implement this later)
                    // For now, just start fresh
                }
            }
        } catch (e) {
            console.error('Failed to load session:', e);
        }
    }

    closeChatbot() {
        this.elements.widget.style.display = 'none';
    }

    minimizeChatbot() {
        this.elements.widget.classList.toggle('minimized');
    }

    fileAnotherComplaint() {
        this.formData = {};
        this.initializeComplaintMode();
    }

    retryLocation() {
        this.state = 'complaint_location';
        this.addBotMessage('Please provide the location again.');
        this.enableInput();
    }

    openMapPicker() {
        // Implement map picker UI (will create in separate file)
        console.log('Map picker not yet implemented');
        this.addBotMessage('Map picker coming soon! Please type your address for now.');
    }

    useGPS() {
        if (!navigator.geolocation) {
            this.addBotMessage('GPS is not available on your device. Please type your address instead.');
            return;
        }

        this.addBotMessage('📍 Getting your location...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
                    );
                    const result = await response.json();

                    // Validate location
                    const validation = await this.boundaryValidator.validateLocation(lat, lng);

                    if (!validation.valid) {
                        this.showBoundaryValidationError(validation);
                        return;
                    }

                    // Location is valid!
                    this.formData.address = result.display_name;
                    this.formData.latitude = lat;
                    this.formData.longitude = lng;
                    this.formData.corporation_id = validation.corporation_code;
                    this.formData.locationTag = validation;

                    this.addBotMessage(`
                        <div class="location-verified">
                            <p>✅ <strong>Location Detected!</strong></p>
                            <p>📍 ${result.display_name}</p>
                            <p>🏢 ${validation.corporation_name}</p>
                        </div>
                    `);

                    this.askForContact();

                } catch (error) {
                    this.addBotMessage('Failed to get address from GPS. Please type your address instead.');
                }
            },
            (error) => {
                this.addBotMessage('Unable to access GPS. Please type your address instead.');
            }
        );
    }

    viewCoverageMap() {
        // Show supported cities and their boundaries
        this.addBotMessage(`
            <div class="coverage-map">
                <h4>🗺️ Our Service Areas</h4>
                <p>We currently support complaints from these cities:</p>
                <ul class="city-list">
                    <li>Bengaluru (5 corporations)</li>
                    <li>Mumbai</li>
                    <li>Chennai</li>
                    <li>Ahmedabad</li>
                    <li>Hyderabad</li>
                    <li>Kolkata</li>
                    <li>Pune</li>
                    <li>Jaipur</li>
                    <li>Gurugram</li>
                    <li>Thane</li>
                    <li>Bhubaneswar</li>
                    <li>Visakhapatnam</li>
                </ul>
                <p>Please ensure your location is within one of these cities.</p>
            </div>
        `);
    }

    editComplaint() {
        this.addBotMessage('Which part would you like to edit?');
        this.addBotMessage(`
            <div class="edit-options">
                <button onclick="notfChatbot.editDescription()">Edit Description</button>
                <button onclick="notfChatbot.editLocation()">Edit Location</button>
                <button onclick="notfChatbot.editContact()">Edit Contact</button>
            </div>
        `);
    }

    editDescription() {
        this.state = 'complaint_description';
        this.addBotMessage('Please provide the updated description:');
        this.enableInput();
    }

    editLocation() {
        this.state = 'complaint_location';
        this.addBotMessage('Please provide the updated location:');
        this.enableInput();
    }

    editContact() {
        this.state = 'complaint_contact';
        this.addBotMessage('Please provide your updated contact information:');
        this.enableInput();
    }
}

// Initialize chatbot when DOM is ready
let notfChatbot;
document.addEventListener('DOMContentLoaded', () => {
    notfChatbot = new NotfChatbot();
});
