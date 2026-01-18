/**
 * Complaint Engine
 * Handles complaint categorization and workflow
 */

class ComplaintEngine {
    constructor() {
        this.categories = this.loadCategories();
    }

    loadCategories() {
        // Issue categories with keywords (matches notf-cms database)
        return [
            // Electrical
            {
                id: 'streetlight_not_working',
                name: 'Street Light Not Working',
                department: 'Electrical',
                keywords: ['streetlight', 'street light', 'light not working', 'lamp', 'dark street', 'no light']
            },
            {
                id: 'streetlight_flickering',
                name: 'Street Light Flickering',
                department: 'Electrical',
                keywords: ['flickering', 'blinking', 'flashing light', 'unstable light']
            },
            {
                id: 'electrical_wire',
                name: 'Exposed/Dangling Wires',
                department: 'Electrical',
                keywords: ['wire', 'cable', 'exposed wire', 'dangling', 'electric cable', 'dangerous wire']
            },

            // SWM (Solid Waste Management)
            {
                id: 'garbage_not_collected',
                name: 'Garbage Not Collected',
                department: 'SWM',
                keywords: ['garbage', 'waste', 'not collected', 'rubbish', 'trash', 'no pickup']
            },
            {
                id: 'garbage_dump',
                name: 'Illegal Garbage Dump',
                department: 'SWM',
                keywords: ['dump', 'dumping', 'illegal dump', 'garbage pile', 'waste dump']
            },
            {
                id: 'dustbin',
                name: 'Dustbin Overflow/Missing',
                department: 'SWM',
                keywords: ['dustbin', 'bin', 'overflow', 'full bin', 'no dustbin']
            },

            // Roads
            {
                id: 'pothole',
                name: 'Pothole',
                department: 'Roads',
                keywords: ['pothole', 'hole', 'pit', 'road damage', 'crater']
            },
            {
                id: 'road_damage',
                name: 'Road Damage/Cracks',
                department: 'Roads',
                keywords: ['road damage', 'crack', 'broken road', 'road repair']
            },
            {
                id: 'footpath',
                name: 'Footpath Issues',
                department: 'Roads',
                keywords: ['footpath', 'pavement', 'sidewalk', 'walking path', 'pedestrian']
            },

            // Water
            {
                id: 'no_water',
                name: 'No Water Supply',
                department: 'Water',
                keywords: ['no water', 'water supply', 'water cut', 'dry tap', 'no supply']
            },
            {
                id: 'pipe_leak',
                name: 'Water Pipe Leakage',
                department: 'Water',
                keywords: ['leak', 'leakage', 'pipe burst', 'water leak', 'broken pipe']
            },

            // Drainage
            {
                id: 'drain_block',
                name: 'Blocked Drain',
                department: 'Drainage',
                keywords: ['blocked', 'clogged', 'drain block', 'choked drain', 'overflow']
            },
            {
                id: 'sewage_overflow',
                name: 'Sewage Overflow',
                department: 'Drainage',
                keywords: ['sewage', 'overflow', 'sewage leak', 'sewage smell', 'manhole']
            },

            // Trees
            {
                id: 'tree_fall',
                name: 'Fallen Tree',
                department: 'Forest',
                keywords: ['fallen tree', 'tree fall', 'uprooted', 'tree down']
            },
            {
                id: 'tree_pruning',
                name: 'Tree Pruning Required',
                department: 'Forest',
                keywords: ['pruning', 'overgrown', 'branches', 'trim tree', 'cutting']
            },

            // Health
            {
                id: 'mosquito',
                name: 'Mosquito Breeding',
                department: 'Health',
                keywords: ['mosquito', 'breeding', 'dengue', 'malaria', 'stagnant water']
            },
            {
                id: 'dead_animal',
                name: 'Dead Animal Removal',
                department: 'Health',
                keywords: ['dead animal', 'carcass', 'dead dog', 'dead cat', 'animal body']
            },

            // Animals
            {
                id: 'stray_dogs',
                name: 'Stray Dogs Menace',
                department: 'Animals',
                keywords: ['stray dog', 'dog', 'dogs', 'barking', 'dog bite', 'aggressive dog']
            },
            {
                id: 'stray_cattle',
                name: 'Stray Cattle',
                department: 'Animals',
                keywords: ['cattle', 'cow', 'bull', 'stray cattle', 'animals on road']
            }
        ];
    }

    categorizeComplaint(description) {
        const descLower = description.toLowerCase();
        let bestMatch = null;
        let maxScore = 0;

        this.categories.forEach(category => {
            let score = 0;

            category.keywords.forEach(keyword => {
                if (descLower.includes(keyword)) {
                    score += keyword.split(' ').length; // Longer phrases get higher scores
                }
            });

            if (score > maxScore) {
                maxScore = score;
                bestMatch = category;
            }
        });

        // Only return if we have a reasonable match
        return maxScore > 0 ? bestMatch : null;
    }

    validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
