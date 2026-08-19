/**
 * Sthira Living - Direct WhatsApp Interior Requirement Engine
 * Frontend-Only, Zero-OTP, Instant WhatsApp Submission
 */

(function () {
    'use strict';

    // State
    const quizState = {
        currentStep: 1,
        bhk: '3 BHK',
        size: 'small', // 'small' (< 1400 sq ft) or 'large' (> 1400 sq ft)
        rooms: {
            living: 1,
            kitchen: 1,
            bedroom: 3,
            bathroom: 3,
            dining: 1,
            balcony: 1,
            pooja: 0,
            foyer: 1
        },
        package: 'premium', // 'essentials', 'premium', 'luxury'
        lead: {
            name: '',
            phone: '',
            city: 'Hyderabad - Gachibowli',
            possession: 'Ready to Move / Already have possession',
            whatsappUpdates: true
        }
    };

    // Default room configurations per BHK type
    const bhkDefaults = {
        '1 BHK': { bedroom: 1, bathroom: 1, dining: 1, living: 1, kitchen: 1, balcony: 1, pooja: 0, foyer: 1 },
        '2 BHK': { bedroom: 2, bathroom: 2, dining: 1, living: 1, kitchen: 1, balcony: 1, pooja: 0, foyer: 1 },
        '3 BHK': { bedroom: 3, bathroom: 3, dining: 1, living: 1, kitchen: 1, balcony: 1, pooja: 0, foyer: 1 },
        '4 BHK': { bedroom: 4, bathroom: 4, dining: 1, living: 1, kitchen: 1, balcony: 2, pooja: 1, foyer: 1 },
        '5 BHK+': { bedroom: 5, bathroom: 5, dining: 1, living: 1, kitchen: 1, balcony: 2, pooja: 1, foyer: 1 }
    };

    // Package Titles & Details for WhatsApp
    const packageInfo = {
        essentials: {
            title: 'Essentials (₹₹)',
            desc: 'Commercial BWR Ply, 1mm Anti-fingerprint Laminates, Hettich Hardware, Standard False Ceiling'
        },
        premium: {
            title: 'Premium (₹₹₹)',
            desc: 'HDHMR / Marine Grade Ply, Acrylic & High-Gloss PU, Fluted Louvers, Profile LEDs, Quartz Countertop'
        },
        luxury: {
            title: 'Luxury / Villa (₹₹₹₹)',
            desc: 'Natural Wood Veneers, Italian Marble Feature Walls, Walk-in Wardrobes, Home Automation, German Mechanisms'
        }
    };

    // DOM Elements
    const elements = {
        topProgressFill: document.getElementById('topProgressFill'),
        stepperItems: document.querySelectorAll('.calc-step-item'),
        stepViews: document.querySelectorAll('.calc-step-view'),
        btnBack: document.getElementById('btnBack'),
        btnNext: document.getElementById('btnNext'),
        bhkCards: document.querySelectorAll('.bhk-item-box'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        navFooter: document.querySelector('.calc-nav-footer'),
        // Step 5 Confirmation Elements
        confClientName: document.getElementById('confClientName'),
        confClientPhone: document.getElementById('confClientPhone'),
        confLocation: document.getElementById('confLocation'),
        confFloorPlan: document.getElementById('confFloorPlan'),
        confRoomsSummary: document.getElementById('confRoomsSummary'),
        confPackage: document.getElementById('confPackage'),
        confWhatsappLink: document.getElementById('confWhatsappLink'),
        restartBtn: document.getElementById('restartBtn')
    };

    // Initialize Quiz
    function initQuiz() {
        bindBHKSelection();
        bindRoomCounters();
        bindPackageSelection();
        bindNavigation();
        bindConfirmationActions();
        updateUI();
    }

    // Step 1: BHK Selection Handling
    function bindBHKSelection() {
        elements.bhkCards.forEach(card => {
            card.addEventListener('click', function (e) {
                const selectedBhk = this.dataset.bhk;
                quizState.bhk = selectedBhk;

                elements.bhkCards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');

                // Auto-sync room defaults based on BHK
                if (bhkDefaults[selectedBhk]) {
                    Object.assign(quizState.rooms, bhkDefaults[selectedBhk]);
                    syncRoomCounterUI();
                }

                // Handle Sub-size option click inside card
                const sizeOption = e.target.closest('.size-pill-option');
                if (sizeOption) {
                    const parentBox = sizeOption.closest('.bhk-item-box');
                    parentBox.querySelectorAll('.size-pill-option').forEach(s => s.classList.remove('selected'));
                    sizeOption.classList.add('selected');
                    quizState.size = sizeOption.dataset.size || 'small';
                }

                elements.btnNext.disabled = false;
            });
        });

        // Delegate sub-size pill clicks
        document.querySelectorAll('.size-pill-option').forEach(pill => {
            pill.addEventListener('click', function (e) {
                e.stopPropagation();
                const parent = this.closest('.size-subgrid');
                parent.querySelectorAll('.size-pill-option').forEach(p => p.classList.remove('selected'));
                this.classList.add('selected');
                quizState.size = this.dataset.size || 'small';
                elements.btnNext.disabled = false;
            });
        });
    }

    // Step 2: Room Counters Handling
    function bindRoomCounters() {
        document.querySelectorAll('.counter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const roomType = this.dataset.room;
                const action = this.dataset.action; // 'inc' or 'dec'
                let count = quizState.rooms[roomType] || 0;

                if (action === 'inc') {
                    count = Math.min(count + 1, 8);
                } else if (action === 'dec') {
                    count = Math.max(count - 1, 0);
                }

                quizState.rooms[roomType] = count;
                updateRoomCounter(roomType, count);
            });
        });
    }

    function syncRoomCounterUI() {
        Object.keys(quizState.rooms).forEach(roomType => {
            updateRoomCounter(roomType, quizState.rooms[roomType]);
        });
    }

    function updateRoomCounter(roomType, count) {
        const valEl = document.querySelector(`.counter-value[data-room="${roomType}"]`);
        const decBtn = document.querySelector(`.counter-btn[data-room="${roomType}"][data-action="dec"]`);
        const incBtn = document.querySelector(`.counter-btn[data-room="${roomType}"][data-action="inc"]`);

        if (valEl) valEl.textContent = count;
        if (decBtn) decBtn.disabled = count <= 0;
        if (incBtn) incBtn.disabled = count >= 8;
    }

    // Step 3: Package Selection Handling
    function bindPackageSelection() {
        document.querySelectorAll('.package-card').forEach(card => {
            card.addEventListener('click', function () {
                document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                quizState.package = this.dataset.package;
                elements.btnNext.disabled = false;
            });
        });
    }

    // Step Navigation Handling
    function bindNavigation() {
        elements.btnBack.addEventListener('click', () => {
            if (quizState.currentStep > 1) {
                goToStep(quizState.currentStep - 1);
            }
        });

        elements.btnNext.addEventListener('click', () => {
            if (quizState.currentStep === 4) {
                // Validate Step 4 Form before direct WhatsApp submission
                if (validateLeadForm()) {
                    submitDirectToWhatsApp();
                }
            } else if (quizState.currentStep < 5) {
                goToStep(quizState.currentStep + 1);
            }
        });
    }

    function goToStep(stepNumber) {
        quizState.currentStep = stepNumber;
        updateUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateUI() {
        const step = quizState.currentStep;

        // Update Stepper Nav & Progress Bar
        const progressPercentage = Math.min((step / 4) * 100, 100);
        if (elements.topProgressFill) {
            elements.topProgressFill.style.width = `${progressPercentage}%`;
        }

        elements.stepperItems.forEach((item, idx) => {
            const itemStep = idx + 1;
            item.classList.remove('active', 'completed');
            if (itemStep === step) {
                item.classList.add('active');
            } else if (itemStep < step || step === 5) {
                item.classList.add('completed');
                item.querySelector('.step-circle').innerHTML = '✓';
            } else {
                item.querySelector('.step-circle').textContent = itemStep;
            }
        });

        // Switch View Panels
        elements.stepViews.forEach(view => {
            view.classList.remove('active');
            if (parseInt(view.dataset.step) === step) {
                view.classList.add('active');
            }
        });

        // Manage Navigation Buttons
        elements.btnBack.disabled = step === 1;

        if (step === 4) {
            elements.btnNext.innerHTML = 'Send Requirements to WhatsApp 💬';
            elements.btnNext.classList.add('btn-whatsapp-theme');
            elements.btnNext.disabled = false;
            if (elements.navFooter) elements.navFooter.style.display = 'flex';
        } else if (step === 5) {
            // Confirmation Screen: hide bottom navigation footer
            if (elements.navFooter) elements.navFooter.style.display = 'none';
        } else {
            elements.btnNext.classList.remove('btn-whatsapp-theme');
            if (elements.navFooter) elements.navFooter.style.display = 'flex';
            elements.btnNext.innerHTML = 'Next <span style="font-size:16px;">→</span>';
            elements.btnNext.disabled = false;
        }
    }

    // Step 4: Validate Lead Form
    function validateLeadForm() {
        const nameInput = document.getElementById('leadName');
        const phoneInput = document.getElementById('leadPhone');
        const citySelect = document.getElementById('leadCity');
        const possessionSelect = document.getElementById('leadPossession');
        const whatsappCheckbox = document.getElementById('leadWhatsapp');

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim().replace(/\D/g, '');

        if (!name || name.length < 2) {
            alert('Please enter your full name to proceed.');
            nameInput.focus();
            return false;
        }

        if (!phone || phone.length < 10) {
            alert('Please enter a valid 10-digit mobile number.');
            phoneInput.focus();
            return false;
        }

        quizState.lead.name = name;
        quizState.lead.phone = phone;
        quizState.lead.city = citySelect ? citySelect.value : 'Hyderabad - Gachibowli';
        quizState.lead.possession = possessionSelect ? possessionSelect.value : 'Ready to Move / Already have possession';
        quizState.lead.whatsappUpdates = whatsappCheckbox ? whatsappCheckbox.checked : true;

        return true;
    }

    // Direct WhatsApp Submission & Confirmation
    function submitDirectToWhatsApp() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('active');
        }

        // Build room list summary text
        const roomEntries = [];
        const r = quizState.rooms;
        if (r.living > 0) roomEntries.push(`Living Room: ${r.living}`);
        if (r.kitchen > 0) roomEntries.push(`Modular Kitchen: ${r.kitchen}`);
        if (r.bedroom > 0) roomEntries.push(`Bedrooms: ${r.bedroom}`);
        if (r.bathroom > 0) roomEntries.push(`Bathrooms & Vanity: ${r.bathroom}`);
        if (r.dining > 0) roomEntries.push(`Dining Area: ${r.dining}`);
        if (r.balcony > 0) roomEntries.push(`Balcony / Sit-out: ${r.balcony}`);
        if (r.pooja > 0) roomEntries.push(`Pooja Mandir: ${r.pooja}`);
        if (r.foyer > 0) roomEntries.push(`Foyer / Shoe Unit: ${r.foyer}`);

        const roomsFormatted = roomEntries.map(entry => `  • ${entry}`).join('%0A');

        const pkg = packageInfo[quizState.package] || packageInfo.premium;
        const sizeDesc = quizState.size === 'large' ? 'Spacious / Large Floor Plan' : 'Standard / Compact Floor Plan';

        // Construct full WhatsApp message to Sthira Living
        const whatsappMessage = 
            `Hello Sthira Living! 🏡✨%0A%0A` +
            `I have selected my interior design requirements on your website. Here are my project details:%0A%0A` +
            `📋 *CLIENT INFORMATION:*%0A` +
            `• *Name:* ${encodeURIComponent(quizState.lead.name)}%0A` +
            `• *Phone:* +91 ${encodeURIComponent(quizState.lead.phone)}%0A` +
            `• *Location:* ${encodeURIComponent(quizState.lead.city)}%0A` +
            `• *Possession Status:* ${encodeURIComponent(quizState.lead.possession)}%0A%0A` +
            `🏠 *FLOOR PLAN & ROOMS:*%0A` +
            `• *BHK Type:* ${encodeURIComponent(quizState.bhk)} (${encodeURIComponent(sizeDesc)})%0A` +
            `• *Rooms to Design:*%0A${roomsFormatted}%0A%0A` +
            `✨ *PREFERRED INTERIOR PACKAGE:*%0A` +
            `• *Package Tier:* ${encodeURIComponent(pkg.title)}%0A` +
            `• *Specifications:* ${encodeURIComponent(pkg.desc)}%0A%0A` +
            `Please share the customized design catalog, quote, and schedule a free design consultation!`;

        const whatsappUrl = `https://wa.me/919949961100?text=${whatsappMessage}`;

        // Populate Step 5 Confirmation Summary
        if (elements.confClientName) elements.confClientName.textContent = quizState.lead.name;
        if (elements.confClientPhone) elements.confClientPhone.textContent = `+91 ${quizState.lead.phone}`;
        if (elements.confLocation) elements.confLocation.textContent = `${quizState.lead.city} (${quizState.lead.possession})`;
        if (elements.confFloorPlan) elements.confFloorPlan.textContent = `${quizState.bhk} (${sizeDesc})`;
        if (elements.confRoomsSummary) elements.confRoomsSummary.textContent = roomEntries.join(' | ');
        if (elements.confPackage) elements.confPackage.textContent = pkg.title;
        if (elements.confWhatsappLink) elements.confWhatsappLink.href = whatsappUrl;

        // Open WhatsApp in a new tab
        try {
            window.open(whatsappUrl, '_blank');
        } catch (e) {
            console.warn('Popup blocked, link is available on confirmation page', e);
        }

        setTimeout(() => {
            if (elements.loadingOverlay) {
                elements.loadingOverlay.classList.remove('active');
            }
            goToStep(5);
        }, 600);
    }

    // Confirmation Screen Actions
    function bindConfirmationActions() {
        if (elements.restartBtn) {
            elements.restartBtn.addEventListener('click', () => {
                goToStep(1);
            });
        }
    }

    // Start on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuiz);
    } else {
        initQuiz();
    }

})();
