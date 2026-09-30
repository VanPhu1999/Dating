// ===== CONFIGURATION =====
const CONFIG = {
    HEARTS_COUNT: 15,
    CONFETTI_COUNT: 100,
    NO_BUTTON_DODGE_DISTANCE: 150,
    NO_BUTTON_SHRINK_INTERVAL: 3,
    // Keep your Google Sheet link here for reference.
    GOOGLE_SHEET_URL: '',
    // Paste the Google Apps Script Web App /exec URL here, not the Google Sheet URL.
    GOOGLE_SHEET_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyIElrzflrsq0KG96GWLlgVO_nknz00umn6p-3s4xatdfebL4pmBOVutuQX5DvmWjVWcg/exec',
    SUCCESS_REDIRECT_URL: 'https://www.facebook.com/machvan.phu/'
};

// ===== DOM ELEMENTS =====
const elements = {
    questionPage: document.getElementById('questionPage'),
    successPage: document.getElementById('successPage'),
    yesButton: document.getElementById('yesButton'),
    noButton: document.getElementById('noButton'),
    successMessage: document.getElementById('successMessage'),
    heartsContainer: document.getElementById('heartsContainer'),
    confettiContainer: document.getElementById('confetti'),
    playAgainButton: document.getElementById('playAgainButton'),
    bgMusic: document.getElementById('bgMusic'),
    musicToggle: document.getElementById('musicToggle'),
    rosePetals: document.getElementById('rosePetals'),
    foodChoices: document.getElementById('foodChoices'),
    activityChoices: document.getElementById('activityChoices'),
    otherFoodInput: document.getElementById('otherFoodInput'),
    otherActivityInput: document.getElementById('otherActivityInput'),
    datePlanInput: document.getElementById('datePlanInput'),
    timePlanInput: document.getElementById('timePlanInput'),
    dateSummary: document.getElementById('dateSummary'),
    submitPlanButton: document.getElementById('submitPlanButton'),
    successPopup: document.getElementById('successPopup'),
    popupOkButton: document.getElementById('popupOkButton')
};

// ===== STATE =====
let noButtonHoverCount = 0;
let musicPlaying = false;
let selectedFood = 'Phở';
let selectedActivity = 'đi dạo';

// ===== PROGRESSIVE TEASING GAME (3 STAGES) =====
let gameStage = 0;
let yesButtonScale = 1;
let noButtonScale = 1;
let buttonsSwapped = false;

function makeNoButtonDodge() {
    const button = elements.noButton;
    const yesButton = elements.yesButton;
    
    gameStage++;

    moveNoButton(2);
}

function moveNoButton(speedMultiplier = 1) {
    const button = elements.noButton;
    const yesButton = elements.yesButton;
    
    // Calculate random position
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 200;
    const minX = 50;
    const minY = 50;
    
    let newX = Math.random() * (maxX - minX) + minX;
    let newY = Math.random() * (maxY - minY) + minY;
    
    // Avoid YES button area
    const yesRect = yesButton.getBoundingClientRect();
    const distance = Math.sqrt(
        Math.pow(newX - yesRect.left, 2) + 
        Math.pow(newY - yesRect.top, 2)
    );
    
    if (distance < 200 * speedMultiplier) {
        newX = newX < yesRect.left ? newX - 150 : newX + 150;
        newY = newY < yesRect.top ? newY - 150 : newY + 150;
    }
    
    // Keep within bounds
    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));
    
    button.style.position = 'fixed';
    button.style.left = newX + 'px';
    button.style.top = newY + 'px';
    button.style.transition = `all ${0.3 / speedMultiplier}s ease`;
}

function showTeasingMessage(text) {
    // Get YES button position
    const yesButton = elements.yesButton;
    const buttonRect = yesButton.getBoundingClientRect();
    
    // Create temporary teasing message
    const msg = document.createElement('div');
    msg.textContent = text;
    
    // Position it above the YES button
    const topPosition = buttonRect.top - 100; // 100px above button
    const leftPosition = buttonRect.left + (buttonRect.width / 2);
    
    msg.style.cssText = `
        position: fixed;
        top: ${topPosition}px;
        left: ${leftPosition}px;
        transform: translateX(-50%);
        background: rgba(255, 64, 129, 0.95);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-size: 1.3rem;
        font-weight: 600;
        z-index: 1000;
        animation: fadeInOutMessage 2s ease;
        box-shadow: 0 10px 40px rgba(255, 64, 129, 0.6);
        pointer-events: none;
        white-space: nowrap;
    `;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}

function showMessage(text) {
    // Get YES button position
    const yesButton = elements.yesButton;
    const buttonRect = yesButton.getBoundingClientRect();

    // Create temporary teasing message
    const msg = document.createElement('div');
    msg.textContent = text;

    // Position it above the YES button
    const topPosition = buttonRect.top - 100; // 100px above button
    const leftPosition = buttonRect.left + (buttonRect.width / 2);

    msg.style.cssText = `
        position: fixed;
        top: ${topPosition}px;
        left: ${leftPosition}px;
        transform: translateX(-50%);
        background: rgba(255, 64, 129, 0.95);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-size: 1.3rem;
        font-weight: 600;
        z-index: 1000;
        animation: fadeInOutMessage 2s ease;
        box-shadow: 0 10px 40px rgba(255, 64, 129, 0.6);
        pointer-events: none;
        white-space: nowrap;
    `;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 10000);
}

// Add CSS animation for teasing message
if (!document.getElementById('teasing-message-styles')) {
    const messageStyle = document.createElement('style');
    messageStyle.id = 'teasing-message-styles';
    messageStyle.textContent = `
        @keyframes fadeInOutMessage {
            0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            20% { opacity: 1; transform: translateX(-50%) translateY(0); }
            80% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
    `;
    document.head.appendChild(messageStyle);
}

// ===== FLOATING HEARTS BACKGROUND =====
function createFloatingHearts() {
    const heartEmojis = ['❤️', '💕', '💖', '💗', '💓', '💝'];
    
    for (let i = 0; i < CONFIG.HEARTS_COUNT; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDelay = Math.random() * 8 + 's';
        heart.style.fontSize = (Math.random() * 20 + 15) + 'px';
        elements.heartsContainer.appendChild(heart);
    }
}

// ===== BACKGROUND MUSIC CONTROL =====
function playMusic() {
    elements.bgMusic.volume = 0.5; // Set volume to 50%
    elements.bgMusic.play().then(() => {
        musicPlaying = true;
        elements.musicToggle.classList.remove('muted');
        console.log('✅ Music playing successfully!');
    }).catch(err => {
        console.log('⚠️ Music autoplay blocked by browser. Click the 🎵 button!');
        musicPlaying = false;
        elements.musicToggle.classList.add('muted');
        // Show the music button more prominently
        elements.musicToggle.style.animation = 'musicPulse 1s ease-in-out infinite';
    });
}

function toggleMusic() {
    if (musicPlaying) {
        elements.bgMusic.pause();
        musicPlaying = false;
        elements.musicToggle.classList.add('muted');
        console.log('🔇 Music paused');
    } else {
        elements.bgMusic.play().then(() => {
            musicPlaying = true;
            elements.musicToggle.classList.remove('muted');
            console.log('🎵 Music playing!');
        }).catch(err => {
            console.log('❌ Error playing music:', err);
        });
    }
}

// ===== ROSE PETALS ANIMATION =====
function createRosePetals() {
    const petals = ['🌹', '🌸', '💮', '🏵️', '💐'];
    
    setInterval(() => {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        petal.textContent = petals[Math.floor(Math.random() * petals.length)];
        petal.style.left = Math.random() * 100 + '%';
        petal.style.animationDuration = (Math.random() * 3 + 5) + 's';
        petal.style.opacity = Math.random() * 0.5 + 0.3;
        
        elements.rosePetals.appendChild(petal);
        
        // Remove petal after animation
        setTimeout(() => {
            petal.remove();
        }, 8000);
    }, 300);
}

// ===== CONFETTI ANIMATION =====
function createConfetti() {
    const colors = ['#ff0844', '#ff4081', '#f50057', '#e91e63', '#9c27b0', '#ffeb3b', '#00e676'];
    
    for (let i = 0; i < CONFIG.CONFETTI_COUNT; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.classList.add('confetti-piece');
        confettiPiece.style.left = Math.random() * 100 + '%';
        confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confettiPiece.style.animationDelay = Math.random() * 0.5 + 's';
        confettiPiece.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        // Random shapes
        if (Math.random() > 0.5) {
            confettiPiece.style.borderRadius = '50%';
        }
        
        elements.confettiContainer.appendChild(confettiPiece);
    }
}

// ===== SUCCESS PAGE TRANSITION =====
function showSuccessPage() {
    if (elements.successMessage) {
        const suffix = gameStage ? ` (After trying to say no ${gameStage} times)` : ``;
        elements.successMessage.textContent = `I knew you'd say yes!${suffix}`;
    }

    // Add celebration class for animations
    elements.questionPage.classList.remove('active');
    elements.successPage.classList.add('active');
    
    // Create confetti
    createConfetti();
    
    // Start romantic music
    playMusic();
    
    // Start rose petals animation
    createRosePetals();
    
    // Polaroid gallery is CSS-only, no JS needed!
    
    // Play success sound (optional - you can add an audio file)
    // const audio = new Audio('celebration.mp3');
    // audio.play();
    
    // Vibrate on mobile (if supported)
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
}

// ===== RESET TO QUESTION PAGE =====
function resetToQuestion() {
    // Remove all confetti
    elements.confettiContainer.innerHTML = '';

    if (elements.successPopup) {
        elements.successPopup.classList.remove('visible');
        elements.successPopup.setAttribute('aria-hidden', 'true');
    }
    
    // Switch pages
    elements.successPage.classList.remove('active');
    elements.questionPage.classList.add('active');
    
    // Reset game state
    gameStage = 0;
    yesButtonScale = 1;
    noButtonScale = 1;
    
    // Reset YES button
    elements.yesButton.style.transform = 'scale(1)';
    
    // COMPLETELY RESET NO BUTTON - CLEAR ALL STYLES
    elements.noButton.style.cssText = '';
    elements.noButton.style.transform = 'scale(1)';
    elements.noButton.className = 'no-button';
    
    // Reset button order if swapped
    if (buttonsSwapped) {
        const container = document.querySelector('.button-container');
        const yesButton = elements.yesButton;
        const noButton = elements.noButton;
        
        // Ensure correct order: YES then NO
        container.appendChild(yesButton);
        container.appendChild(noButton);
        
        buttonsSwapped = false;
    }
    
    // Reset YES button click counter
    yesButtonClicks = 0;
    
    console.log('🔄 Game reset - NO button should be visible now!');
}

// ===== DATE PLAN OPTIONS =====
function updateDateSummary() {
    if (!elements.dateSummary) {
        return;
    }

    const food = getSelectedFood();
    const activity = getSelectedActivity();
    const scheduleDate = getScheduleDate();
    const scheduleTime = getScheduleTime();
    const scheduleText = scheduleDate && scheduleTime
        ? ` on ${scheduleDate} at ${scheduleTime}`
        : '';

    elements.dateSummary.textContent = `Plan: ${food}, then ${activity}${scheduleText}.`;
}

function getSelectedFood() {
    const food = selectedFood === 'Other'
        ? elements.otherFoodInput.value.trim() || 'your favorite food'
        : selectedFood;

    return food;
}

function getSelectedActivity() {
    const activity = selectedActivity === 'Other'
        ? elements.otherActivityInput.value.trim() || 'your favorite activity'
        : selectedActivity;

    return activity;
}

function getDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getScheduleDate() {
    return elements.datePlanInput.value;
}

function getScheduleTime() {
    return elements.timePlanInput.value;
}

function getDatePlanPayload() {
    const food = getSelectedFood();
    const activity = getSelectedActivity();
    const scheduleDate = getScheduleDate();
    const scheduleTime = getScheduleTime();

    return {
        noAttempts: gameStage,
        food,
        activity,
        scheduleDate,
        scheduleTime,
        submittedAt: new Date().toISOString()
    };
}

function validateDatePlan() {
    elements.otherFoodInput.setCustomValidity('');
    elements.otherActivityInput.setCustomValidity('');
    elements.datePlanInput.setCustomValidity('');
    elements.timePlanInput.setCustomValidity('');

    if (selectedFood === 'Other' && !elements.otherFoodInput.value.trim()) {
        elements.otherFoodInput.setCustomValidity('Please tell me what you want to eat.');
        elements.otherFoodInput.reportValidity();
        elements.otherFoodInput.focus();
        return false;
    }

    if (selectedActivity === 'Other' && !elements.otherActivityInput.value.trim()) {
        elements.otherActivityInput.setCustomValidity('Please tell me what else you want to do.');
        elements.otherActivityInput.reportValidity();
        elements.otherActivityInput.focus();
        return false;
    }

    if (!elements.datePlanInput.value) {
        elements.datePlanInput.setCustomValidity('Please choose a date.');
        elements.datePlanInput.reportValidity();
        elements.datePlanInput.focus();
        return false;
    }

    if (!elements.timePlanInput.value) {
        elements.timePlanInput.setCustomValidity('Please choose a time.');
        elements.timePlanInput.reportValidity();
        elements.timePlanInput.focus();
        return false;
    }

    return true;
}

async function sendPlanToGoogleSheet(payload) {
    if (!CONFIG.GOOGLE_SHEET_WEB_APP_URL) {
        console.log('Google Apps Script Web App URL is empty. Skipping sheet submit.', payload);
        return;
    }

    if (CONFIG.GOOGLE_SHEET_WEB_APP_URL.includes('docs.google.com/spreadsheets')) {
        console.error('Use a Google Apps Script Web App /exec URL, not a Google Sheet edit URL.');
        return;
    }

    await fetch(CONFIG.GOOGLE_SHEET_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
    });
}

function showSuccessPopup() {
    if (!elements.successPopup) {
        return;
    }

    elements.successPopup.classList.add('visible');
    elements.successPopup.setAttribute('aria-hidden', 'false');
}

function redirectAfterPopup() {
    if (CONFIG.SUCCESS_REDIRECT_URL) {
        window.location.href = CONFIG.SUCCESS_REDIRECT_URL;
    }
}

async function submitDatePlan() {
    if (!elements.submitPlanButton) {
        return;
    }

    if (!validateDatePlan()) {
        return;
    }

    const originalText = elements.submitPlanButton.textContent;
    elements.submitPlanButton.disabled = true;
    elements.submitPlanButton.textContent = 'Submitting...';

    try {
        await sendPlanToGoogleSheet(getDatePlanPayload());
        showSuccessPopup();
    } catch (error) {
        console.error('Could not submit plan:', error);
        showSuccessPopup();
    } finally {
        elements.submitPlanButton.disabled = false;
        elements.submitPlanButton.textContent = originalText;
    }
}

function selectChoice(group, button) {
    group.querySelectorAll('.choice-card').forEach(choice => {
        choice.classList.remove('selected');
    });

    button.classList.add('selected');
}

function initializeScheduleOptions() {
    if (!elements.datePlanInput || !elements.timePlanInput) {
        return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowValue = getDateInputValue(tomorrow);

    elements.datePlanInput.value = tomorrowValue;
    elements.datePlanInput.min = tomorrowValue;

    if (!elements.timePlanInput.value) {
        elements.timePlanInput.value = '19:00';
    }

    elements.datePlanInput.addEventListener('input', () => {
        elements.datePlanInput.setCustomValidity('');
        updateDateSummary();
    });

    elements.timePlanInput.addEventListener('input', () => {
        elements.timePlanInput.setCustomValidity('');
        updateDateSummary();
    });
}

function initializeDateOptions() {
    if (!elements.foodChoices || !elements.activityChoices) {
        return;
    }

    elements.foodChoices.addEventListener('click', (event) => {
        const button = event.target.closest('.choice-card');

        if (!button) {
            return;
        }

        selectedFood = button.dataset.choice;
        selectChoice(elements.foodChoices, button);
        elements.otherFoodInput.setCustomValidity('');
        elements.otherFoodInput.classList.toggle('visible', selectedFood === 'Other');

        if (selectedFood === 'Other') {
            elements.otherFoodInput.focus();
        }

        updateDateSummary();
    });

    elements.activityChoices.addEventListener('click', (event) => {
        const button = event.target.closest('.choice-card');

        if (!button) {
            return;
        }

        selectedActivity = button.dataset.choice;
        selectChoice(elements.activityChoices, button);
        elements.otherActivityInput.setCustomValidity('');
        elements.otherActivityInput.classList.toggle('visible', selectedActivity === 'Other');

        if (selectedActivity === 'Other') {
            elements.otherActivityInput.focus();
        }

        updateDateSummary();
    });

    elements.otherFoodInput.addEventListener('input', () => {
        elements.otherFoodInput.setCustomValidity('');
        updateDateSummary();
    });
    elements.otherActivityInput.addEventListener('input', () => {
        elements.otherActivityInput.setCustomValidity('');
        updateDateSummary();
    });
    updateDateSummary();
}

// ===== YES BUTTON TEASING COUNTER =====
let yesButtonClicks = 0;

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Yes button click - with teasing!
    elements.yesButton.addEventListener('click', (e) => {
        showSuccessPage();
        // setTimeout(showSuccessPage, 100);
    });
    
    // Play again button click
    elements.playAgainButton.addEventListener('click', () => {
        resetToQuestion();
    });

    if (elements.submitPlanButton) {
        elements.submitPlanButton.addEventListener('click', submitDatePlan);
    }

    if (elements.popupOkButton) {
        elements.popupOkButton.addEventListener('click', redirectAfterPopup);
    }
    
    // No button hover/touch - make it dodge
    elements.noButton.addEventListener('mouseenter', makeNoButtonDodge);
    
    // For mobile touch
    elements.noButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        makeNoButtonDodge();
    });
    
    // Prevent No button from being clicked (extra safety)
    elements.noButton.addEventListener('click', (e) => {
        e.preventDefault();
        makeNoButtonDodge();
    });
    
    // Music toggle
    elements.musicToggle.addEventListener('click', toggleMusic);
}

// ===== SMART AUDIO MANAGEMENT FOR VIDEO =====
const dancingVideo = document.getElementById('dancingVideo');

if (dancingVideo) {
    // Pause background music when video starts playing
    dancingVideo.addEventListener('play', () => {
        if (musicPlaying) {
            elements.bgMusic.pause();
            console.log('🎬 Video playing - Music paused');
        }
    });
    
    // Resume background music when video is paused
    dancingVideo.addEventListener('pause', () => {
        if (musicPlaying) {
            elements.bgMusic.play();
            console.log('⏸️ Video paused - Music resumed');
        }
    });
    
    // Resume background music when video ends
    dancingVideo.addEventListener('ended', () => {
        if (musicPlaying) {
            elements.bgMusic.play();
            console.log('✅ Video ended - Music resumed');
        }
    });
    
    // Pause video when scrolled out of view (performance optimization)
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting && !dancingVideo.paused) {
                dancingVideo.pause();
                console.log('📜 Video scrolled out of view - Paused');
            }
        });
    }, { threshold: 0.5 });
    
    videoObserver.observe(dancingVideo);
}

// ===== INITIALIZE APP =====
function init() {
    createFloatingHearts();
    initializeEventListeners();
    initializeScheduleOptions();
    initializeDateOptions();
}

// ===== START THE APP =====
// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===== ADDITIONAL EFFECTS =====
// Add sparkle effect on mouse move
document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.95) {
        const sparkle = document.createElement('div');
        sparkle.textContent = '✨';
        sparkle.style.position = 'fixed';
        sparkle.style.left = e.clientX + 'px';
        sparkle.style.top = e.clientY + 'px';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.fontSize = '20px';
        sparkle.style.zIndex = '1000';
        sparkle.style.animation = 'fadeOut 1s forwards';
        document.body.appendChild(sparkle);
        
        // setTimeout(() => sparkle.remove(), 1000);
    }
});

// Add fadeOut animation for sparkles
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translateY(-30px);
        }
    }
`;
document.head.appendChild(style);
