// Join Form Handler
// Handles submission of community and solution provider join requests

let currentFormType = 'community';

// Type selector
function selectType(type) {
    currentFormType = type;
    document.getElementById('formType').value = type;

    // Update UI
    document.querySelectorAll('.type-option').forEach(opt => opt.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Show/hide fields based on type
    const communityFields = document.getElementById('communityFields');
    const neighborhoodGroup = document.getElementById('neighborhoodGroup');
    const locationGroup = document.getElementById('locationGroup');

    if (type === 'community') {
        communityFields.style.display = 'block';
        neighborhoodGroup.style.display = 'block';
        locationGroup.style.display = 'none';
        document.getElementById('neighborhood').required = true;
        document.getElementById('location').required = false;
    } else {
        communityFields.style.display = 'none';
        neighborhoodGroup.style.display = 'none';
        locationGroup.style.display = 'block';
        document.getElementById('neighborhood').required = false;
        document.getElementById('location').required = true;
    }
}

// Dynamic list management
function addTheme() {
    const list = document.getElementById('themesList');
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.innerHTML = `
        <input type="text" class="theme-input" placeholder="Add another theme">
        <button type="button" class="btn-remove" onclick="removeItem(this)">×</button>
    `;
    list.appendChild(item);
}

function addOffer() {
    const list = document.getElementById('offersList');
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.innerHTML = `
        <input type="text" class="offer-input" placeholder="Add another offer">
        <button type="button" class="btn-remove" onclick="removeItem(this)">×</button>
    `;
    list.appendChild(item);
}

function addAsk() {
    const list = document.getElementById('asksList');
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.innerHTML = `
        <input type="text" class="ask-input" placeholder="Add another need">
        <button type="button" class="btn-remove" onclick="removeItem(this)">×</button>
    `;
    list.appendChild(item);
}

function removeItem(button) {
    button.parentElement.remove();
}

// Form submission
document.getElementById('joinForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoader = document.getElementById('submitLoader');
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');

    // Hide previous messages
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    // Disable submit button
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoader.style.display = 'inline';

    try {
        // Collect form data
        const formType = document.getElementById('formType').value;
        const name = document.getElementById('name').value.trim();
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Collect themes
        const themes = Array.from(document.querySelectorAll('.theme-input'))
            .map(input => input.value.trim())
            .filter(val => val);

        // Collect offers
        const offers = Array.from(document.querySelectorAll('.offer-input'))
            .map(input => input.value.trim())
            .filter(val => val);

        // Collect asks
        const asks = Array.from(document.querySelectorAll('.ask-input'))
            .map(input => input.value.trim())
            .filter(val => val);

        // Build metadata object
        const metadata = {
            name: name,
            type: formType,
            city: document.getElementById('city').value.trim(),
            state: document.getElementById('state').value.trim(),
            description: document.getElementById('description').value.trim(),
            themes: themes,
            focus_areas: themes,
            contact: {
                person: document.getElementById('contactPerson').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim() || null,
                website: document.getElementById('website').value.trim() || null
            },
            offers: offers,
            asks: asks,
            stories: document.getElementById('stories').value.trim() || null,
            submitted_via: 'join_form',
            submitted_at: new Date().toISOString()
        };

        // Add type-specific fields
        if (formType === 'community') {
            metadata.neighborhood = document.getElementById('neighborhood').value.trim();
            metadata.population = document.getElementById('population').value.trim() || null;
            metadata.geography = document.getElementById('geography').value.trim() || null;
        } else {
            metadata.location = document.getElementById('location').value.trim();
            metadata.neighborhoods = []; // Can be updated later by admin
        }

        // Prepare database record
        const record = {
            file_path: `${formType === 'community' ? 'communities' : 'solution-providers'}/${slug}.md`,
            file_type: formType,
            slug: slug,
            status: 'pending', // Submissions start as pending for admin review
            metadata: metadata
        };

        // Add city and neighborhood fields for communities
        if (formType === 'community') {
            record.city = metadata.city;
            record.neighborhood = metadata.neighborhood;
        }

        // Submit to Supabase
        const SUPABASE_URL = 'https://abblyaukkoxmgzwretvm.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmx5YXVra294bWd6d3JldHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzE4NTQsImV4cCI6MjA4MzgwNzg1NH0.neJmkUmGFPfXMC5PZNRhaXIGEefj_b79L_YceXl5jxU';

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data, error } = await supabase
            .from('file_metadata')
            .insert(record);

        if (error) throw error;

        // Success!
        successMsg.innerHTML = `
            <strong>✅ Thank you for joining NOTF!</strong><br>
            Your ${formType === 'community' ? 'community' : 'organization'} "${name}" has been submitted for review.
            We'll review your application and be in touch via email soon.
        `;
        successMsg.style.display = 'block';

        // Reset form
        document.getElementById('joinForm').reset();
        document.getElementById('formType').value = 'community';

        // Reset dynamic lists
        document.getElementById('themesList').innerHTML = `
            <div class="dynamic-item">
                <input type="text" class="theme-input" placeholder="e.g., Waste Management, Community Building, Education" required>
            </div>
        `;
        document.getElementById('offersList').innerHTML = `
            <div class="dynamic-item">
                <input type="text" class="offer-input" placeholder="e.g., Community space for events, Volunteer network">
            </div>
        `;
        document.getElementById('asksList').innerHTML = `
            <div class="dynamic-item">
                <input type="text" class="ask-input" placeholder="e.g., Funding for projects, Technical expertise">
            </div>
        `;

        // Scroll to success message
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error('Submission error:', error);
        errorMsg.innerHTML = `
            <strong>❌ Submission Failed</strong><br>
            ${error.message || 'There was an error submitting your application. Please try again or contact us directly.'}
        `;
        errorMsg.style.display = 'block';
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitLoader.style.display = 'none';
    }
});

// Make functions globally available
window.selectType = selectType;
window.addTheme = addTheme;
window.addOffer = addOffer;
window.addAsk = addAsk;
window.removeItem = removeItem;
