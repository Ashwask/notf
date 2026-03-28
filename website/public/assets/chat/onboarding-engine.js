/**
 * NOTF Onboarding Engine
 * Conversational flow for joining the NOTF network
 * Steps: type -> name -> city -> themes -> description -> contact -> submit
 */

class OnboardingEngine {
    constructor() {
        this.steps = ['type', 'name', 'city', 'themes', 'description', 'contact', 'confirm'];
        this.currentStep = 0;
        this.data = {};
        this.supabase = null;
        this._waitingForOtherCity = false;
    }

    async init(supabaseClient) {
        this.supabase = supabaseClient;
    }

    getWelcomeMessage() {
        return {
            text: "I can help you join the NOTF network! Are you a...",
            buttons: [
                { label: "Community / Neighbourhood Group", value: "community" },
                { label: "Solution Provider / Expert", value: "organization" }
            ]
        };
    }

    async handleInput(input) {
        const currentStepName = this.steps[this.currentStep];

        switch (currentStepName) {
            case 'type':
                this.data.type = input;
                this.currentStep++;
                return {
                    text: "What's your community/organisation called?",
                    inputType: "text"
                };

            case 'name':
                this.data.name = input;
                this.currentStep++;
                // Show top 4 cities as quick buttons, plus "Other city" for the rest
                const topCities = ['Bengaluru', 'Mumbai', 'Dehradun', 'Chennai'];
                const cityButtons = topCities.map(c => ({ label: c, value: c }));
                cityButtons.push({ label: "Other city", value: "_other" });
                return {
                    text: "Where are you based?",
                    buttons: cityButtons
                };

            case 'city':
                if (input === '_other') {
                    this._waitingForOtherCity = true;
                    return {
                        text: "Which city are you in?",
                        inputType: "text",
                        stayOnStep: true
                    };
                }
                if (this._waitingForOtherCity) {
                    this._waitingForOtherCity = false;
                }
                this.data.city = input;
                this.currentStep++;
                const themes = THEME_CATEGORIES;
                return {
                    text: "What topics does your community focus on? (pick all that apply)",
                    checkboxes: themes.map(t => ({ label: t, value: t }))
                };

            case 'themes':
                const selectedThemes = Array.isArray(input) ? input : [input];
                if (selectedThemes.length === 0) {
                    return {
                        text: "Please select at least one focus area.",
                        stayOnStep: true
                    };
                }
                this.data.themes = selectedThemes;
                this.currentStep++;
                return {
                    text: "In one line, describe what your community does:",
                    inputType: "text"
                };

            case 'description':
                this.data.description = input;
                this.currentStep++;
                return {
                    text: "Almost done! What's your email address?",
                    inputType: "email"
                };

            case 'contact':
                // Basic email validation
                if (!isValidEmail(input)) {
                    return {
                        text: "Please provide a valid email address (e.g. name@example.com).",
                        inputType: "email",
                        stayOnStep: true
                    };
                }
                this.data.email = input;
                this.currentStep++;
                return await this.submit();

            case 'confirm':
                return {
                    text: "Your application has already been submitted!",
                    done: true
                };

            default:
                return {
                    text: "Something went wrong. Please try again.",
                    done: true
                };
        }
    }

    async submit() {
        const refNum = generateRefNumber();

        const record = buildJoinRecord({
            type: this.data.type,
            name: this.data.name,
            city: this.data.city,
            description: this.data.description,
            themes: this.data.themes,
            email: this.data.email,
            source: 'chatbot'
        });

        try {
            if (this.supabase) {
                const { error } = await this.supabase.from('file_metadata').insert([record]);
                if (error) throw error;
            }

            return {
                text: `Your application for "${this.data.name}" has been submitted!\n\nReference: ${refNum}\nWe'll review it within 3 working days.`,
                buttons: [
                    { label: "Browse communities near you", value: "_link:/communities/" },
                    { label: "Explore project catalogue", value: "_link:/catalog/" }
                ],
                done: true
            };
        } catch (err) {
            console.error('Onboarding submission error:', err);
            return {
                text: "Something went wrong submitting your application. Please try again or use the join form at /join/.",
                done: true
            };
        }
    }

    reset() {
        this.currentStep = 0;
        this.data = {};
        this._waitingForOtherCity = false;
    }
}
