// Glitch animation with random timing
function initGlitchAnimation() {
    const profileImage = document.querySelector('.profile-image');
    const mobileProfileImage = document.querySelector('.mobile-profile-image');
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    function triggerGlitch(element) {
        if (!element) return;
        
        // Random glitch duration - shorter on mobile
        const glitchDuration = isMobile 
            ? Math.random() * 0.2 + 0.15  // 0.15 to 0.35 seconds on mobile
            : Math.random() * 0.4 + 0.25; // 0.25 to 0.65 seconds on desktop
        
        // Add glitch class
        element.classList.add('glitching');
        
        // Remove glitch class after random duration
        setTimeout(() => {
            element.classList.remove('glitching');
        }, glitchDuration * 1000);
    }
    
    // Trigger glitch - less frequent on mobile
    const glitchInterval = isMobile ? 6000 : 3000; // 6 seconds on mobile, 3 on desktop
    
    setInterval(() => {
        triggerGlitch(profileImage);
        triggerGlitch(mobileProfileImage);
    }, glitchInterval);
}

// Mode toggle functionality
function initModeToggle() {
    const toggleContainer = document.querySelector('.mode-toggle');
    const humanBtn = document.querySelector('.mode-btn.human');
    const aiBtn = document.querySelector('.mode-btn.ai');
    const body = document.body;
    
    // Check for saved mode preference
    const savedMode = localStorage.getItem('viewMode') || 'human';
    if (savedMode === 'ai') {
        body.classList.add('ai-mode');
        aiBtn.classList.add('active');
        humanBtn.classList.remove('active');
    }
    
    humanBtn.addEventListener('click', () => {
        body.classList.remove('ai-mode');
        humanBtn.classList.add('active');
        aiBtn.classList.remove('active');
        localStorage.setItem('viewMode', 'human');
    });
    
    aiBtn.addEventListener('click', () => {
        body.classList.add('ai-mode');
        aiBtn.classList.add('active');
        humanBtn.classList.remove('active');
        localStorage.setItem('viewMode', 'ai');
    });
}

// Dynamic article loading
async function loadArticles() {
    const articlesSidebar = document.querySelector('.articles-sidebar');
    if (!articlesSidebar) return;
    
    // Article metadata - add your articles here
    const articles = [
        {
            title: "Rethinking LLM Safety Through Mechanistic Lenses",
            url: "articles/llm-safety.html",
            date: "Dec 2024",
            readTime: "8 min read",
            excerpt: "Exploring how causal intervention methods reveal hidden failure modes in language models..."
        },
        {
            title: "Synthetic Consciousness: My Digital Twin Experiment",
            url: "articles/synthetic-consciousness.html",
            date: "Sep 2024",
            readTime: "12 min read",
            excerpt: "What I learned building an AI version of myself and the philosophical questions it raised..."
        }
    ];
    
    // Clear existing content
    articlesSidebar.innerHTML = '<div class="articles-title">Featured Writings</div>';
    
    // Create article cards
    articles.forEach(article => {
        const card = document.createElement('a');
        card.href = article.url;
        card.className = 'article-card';
        card.innerHTML = `
            <div class="article-card-title">${article.title}</div>
            <div class="article-card-meta">${article.date} • ${article.readTime}</div>
            <div class="article-card-excerpt">${article.excerpt}</div>
        `;
        articlesSidebar.appendChild(card);
    });
}

// Role toggle functionality
function initRoleToggle() {
    const builderBtn = document.querySelector('.role-btn.builder');
    const scholarBtn = document.querySelector('.role-btn.scholar');
    const syntheticBtn = document.querySelector('.role-btn.synthetic');
    const body = document.body;
    
    // Check for saved role preference
    const savedRole = localStorage.getItem('viewRole') || 'builder';
    switchRole(savedRole);
    
    builderBtn.addEventListener('click', () => switchRole('builder'));
    scholarBtn.addEventListener('click', () => switchRole('scholar'));
    syntheticBtn.addEventListener('click', () => switchRole('synthetic'));
    
    function switchRole(role) {
        // Remove all role classes
        body.classList.remove('researcher-view', 'synthetic-view');
        builderBtn.classList.remove('active');
        scholarBtn.classList.remove('active');
        syntheticBtn.classList.remove('active');
        
        // Add appropriate class and active state
        if (role === 'scholar') {
            body.classList.add('researcher-view');
            scholarBtn.classList.add('active');
        } else if (role === 'synthetic') {
            body.classList.add('synthetic-view');
            syntheticBtn.classList.add('active');
        } else {
            builderBtn.classList.add('active');
        }
        
        localStorage.setItem('viewRole', role);
    }
}

// Microphone functionality
function initMicrophone() {
    const micButton = document.querySelector('.microphone-button');
    const micText = document.querySelector('.microphone-text');
    
    if (!micButton) return;
    
    let isListening = false;
    
    micButton.addEventListener('click', () => {
        isListening = !isListening;
        
        if (isListening) {
            micButton.classList.add('listening');
            micText.textContent = 'Listening...';
        } else {
            micButton.classList.remove('listening');
            micText.textContent = 'Talk to My Digital Twin';
        }
    });
}

// Random Robot Movement
function initRobotMovement() {
    const robot = document.querySelector('.pixel-robot');
    if (!robot) return;
    
    let currentEdge = 'bottom'; // bottom, top, left, right
    let position = 0;
    let direction = 1; // 1 for forward, -1 for backward
    let baseSpeed = 1.2;
    let speed = baseSpeed;
    let isPaused = false;
    let waveOffset = 0; // For curvy movement
    let waveAmplitude = 15; // How curvy the path is
    let waveFrequency = 0.05; // How often it curves
    
    // Hover effects
    robot.addEventListener('mouseenter', () => {
        isPaused = true;
        speed = baseSpeed * 2.5;
    });
    
    robot.addEventListener('mouseleave', () => {
        isPaused = false;
        speed = baseSpeed;
    });
    
    function getRandomEdge() {
        const edges = ['bottom', 'top', 'left', 'right'];
        let newEdge = edges[Math.floor(Math.random() * edges.length)];
        while (newEdge === currentEdge) {
            newEdge = edges[Math.floor(Math.random() * edges.length)];
        }
        return newEdge;
    }
    
    function teleportToRandomLocation() {
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        
        // Define safe zones (away from text block)
        const textBlockLeft = maxWidth * 0.25;
        const textBlockRight = maxWidth * 0.75;
        const textBlockTop = 140;
        const textBlockBottom = maxHeight - 140;
        
        let safePosition = 0;
        let attempts = 0;
        const maxAttempts = 20;
        
        // Keep trying until we find a safe position
        while (attempts < maxAttempts) {
            // Pick random edge
            const randomEdge = ['bottom', 'top', 'left', 'right'][Math.floor(Math.random() * 4)];
            
            if (randomEdge === 'bottom' || randomEdge === 'top') {
                // For horizontal edges, avoid middle section
                const leftZone = Math.random() * (textBlockLeft - 100);
                const rightZone = textBlockRight + 100 + Math.random() * (maxWidth - textBlockRight - 100);
                
                safePosition = Math.random() < 0.5 ? leftZone : rightZone;
                
                // Make sure it's actually safe
                if (safePosition < textBlockLeft - 50 || safePosition > textBlockRight + 50) {
                    currentEdge = randomEdge;
                    position = safePosition;
                    break;
                }
            } else {
                // For vertical edges (left/right), can use most positions
                // Just avoid the middle vertical section where text is
                const topZone = Math.random() * (textBlockTop - 50);
                const bottomZone = textBlockBottom + 50 + Math.random() * (maxHeight - textBlockBottom - 50);
                
                safePosition = Math.random() < 0.5 ? topZone : bottomZone;
                
                currentEdge = randomEdge;
                position = safePosition;
                break;
            }
            
            attempts++;
        }
        
        // If no safe position found after attempts, default to corner positions
        if (attempts >= maxAttempts) {
            const corners = [
                { edge: 'bottom', pos: 50 },
                { edge: 'bottom', pos: maxWidth - 100 },
                { edge: 'top', pos: 50 },
                { edge: 'top', pos: maxWidth - 100 },
                { edge: 'left', pos: 50 },
                { edge: 'right', pos: 50 }
            ];
            
            const corner = corners[Math.floor(Math.random() * corners.length)];
            currentEdge = corner.edge;
            position = corner.pos;
        }
        
        // Random direction
        direction = Math.random() < 0.5 ? 1 : -1;
        
        // Add brief fade effect for teleport
        robot.style.opacity = '0.3';
        setTimeout(() => {
            robot.style.opacity = '1';
        }, 100);
    }
    
    function isApproachingTextBlock(x, y, edge) {
        // Define text block boundaries with buffer zone
        const buffer = 100; // Detection buffer
        const textBlockLeft = window.innerWidth * 0.25;
        const textBlockRight = window.innerWidth * 0.75;
        const textBlockTop = 140;
        const textBlockBottom = window.innerHeight - 140;
        
        // Check if approaching text block from any edge
        if (edge === 'bottom' || edge === 'top') {
            return x > (textBlockLeft - buffer) && x < (textBlockRight + buffer) &&
                   y > (textBlockTop - buffer) && y < (textBlockBottom + buffer);
        } else if (edge === 'left' || edge === 'right') {
            return y > (textBlockTop - buffer) && y < (textBlockBottom + buffer) &&
                   x > (textBlockLeft - buffer) && x < (textBlockRight + buffer);
        }
        return false;
    }
    
    function updateRobotPosition() {
        if (isPaused) {
            requestAnimationFrame(updateRobotPosition);
            return;
        }
        
        // 5% chance to teleport randomly (keeping this for additional randomness)
        if (Math.random() < 0.0005) { // 0.05% per frame = ~5% over time
            teleportToRandomLocation();
        }
        
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        const robotSize = 80;
        
        // Move along current edge
        position += speed * direction;
        waveOffset += 0.1;
        
        // Calculate wave for curvy movement
        const wave = Math.sin(waveOffset * waveFrequency) * waveAmplitude;
        
        // Random flip (less frequent)
        if (Math.random() < 0.005) {
            robot.style.transform = robot.style.transform.includes('scaleX(-1)') 
                ? robot.style.transform.replace('scaleX(-1)', 'scaleX(1)')
                : robot.style.transform.replace('scaleX(1)', 'scaleX(-1)');
        }
        
        let robotX = 0;
        let robotY = 0;
        let shouldChangeDirection = false;
        
        // Update position based on current edge
        if (currentEdge === 'bottom') {
            robotY = maxHeight - 20 - robotSize + wave;
            robotX = position;
            robot.style.bottom = (20 - wave) + 'px';
            robot.style.left = position + 'px';
            robot.style.top = 'auto';
            robot.style.right = 'auto';
            // Fixed flip logic: scaleX(1) when moving right, scaleX(-1) when moving left
            robot.style.transform = direction > 0 ? 'scaleX(1) rotate(0deg)' : 'scaleX(-1) rotate(0deg)';
            
            // Check if approaching text block
            if (isApproachingTextBlock(robotX, robotY, currentEdge)) {
                shouldChangeDirection = true;
            }
            
            if (position > maxWidth || position < -robotSize || shouldChangeDirection) {
                if (shouldChangeDirection) {
                    direction *= -1; // Reverse direction
                } else {
                    currentEdge = getRandomEdge();
                    position = Math.random() * (currentEdge === 'left' || currentEdge === 'right' ? maxHeight : maxWidth);
                    direction = Math.random() < 0.5 ? 1 : -1;
                }
            }
        } else if (currentEdge === 'top') {
            robotY = 80 + wave;
            robotX = position;
            robot.style.top = (80 + wave) + 'px';
            robot.style.left = position + 'px';
            robot.style.bottom = 'auto';
            robot.style.right = 'auto';
            robot.style.transform = direction > 0 ? 'scaleX(1) rotate(0deg)' : 'scaleX(-1) rotate(0deg)';
            
            if (isApproachingTextBlock(robotX, robotY, currentEdge)) {
                shouldChangeDirection = true;
            }
            
            if (position > maxWidth || position < -robotSize || shouldChangeDirection) {
                if (shouldChangeDirection) {
                    direction *= -1;
                } else {
                    currentEdge = getRandomEdge();
                    position = Math.random() * (currentEdge === 'left' || currentEdge === 'right' ? maxHeight : maxWidth);
                    direction = Math.random() < 0.5 ? 1 : -1;
                }
            }
        } else if (currentEdge === 'left') {
            robotX = 20 + wave;
            robotY = position;
            robot.style.left = (20 + wave) + 'px';
            robot.style.top = position + 'px';
            robot.style.bottom = 'auto';
            robot.style.right = 'auto';
            // When moving vertically down (direction > 0), use scaleX(1), when up use scaleX(-1)
            robot.style.transform = direction > 0 ? 'scaleX(1) rotate(90deg)' : 'scaleX(-1) rotate(90deg)';
            
            if (isApproachingTextBlock(robotX, robotY, currentEdge)) {
                shouldChangeDirection = true;
            }
            
            if (position > maxHeight || position < -robotSize || shouldChangeDirection) {
                if (shouldChangeDirection) {
                    direction *= -1;
                } else {
                    currentEdge = getRandomEdge();
                    position = Math.random() * (currentEdge === 'left' || currentEdge === 'right' ? maxHeight : maxWidth);
                    direction = Math.random() < 0.5 ? 1 : -1;
                }
            }
        } else if (currentEdge === 'right') {
            robotX = maxWidth - 20 - robotSize - wave;
            robotY = position;
            robot.style.right = (20 + wave) + 'px';
            robot.style.top = position + 'px';
            robot.style.bottom = 'auto';
            robot.style.left = 'auto';
            // When moving down (direction > 0), face down; when up, face up
            robot.style.transform = direction > 0 ? 'scaleX(-1) rotate(-90deg)' : 'scaleX(1) rotate(-90deg)';
            
            if (isApproachingTextBlock(robotX, robotY, currentEdge)) {
                shouldChangeDirection = true;
            }
            
            if (position > maxHeight || position < -robotSize || shouldChangeDirection) {
                if (shouldChangeDirection) {
                    direction *= -1;
                } else {
                    currentEdge = getRandomEdge();
                    position = Math.random() * (currentEdge === 'left' || currentEdge === 'right' ? maxHeight : maxWidth);
                    direction = Math.random() < 0.5 ? 1 : -1;
                }
            }
        }
        
        requestAnimationFrame(updateRobotPosition);
    }
    
    // Start animation after robot fades in
    setTimeout(() => {
        updateRobotPosition();
    }, 3000);
    
    // Respawn every 10 seconds
    setInterval(() => {
        teleportToRandomLocation();
    }, 10000);
    
    // Click robot to trigger synthetic mode
    robot.addEventListener('click', () => {
        const syntheticBtn = document.querySelector('.role-btn.synthetic');
        if (syntheticBtn && !document.body.classList.contains('synthetic-view')) {
            syntheticBtn.click();
        }
    });
}

// Load researcher content
function loadResearcherContent() {
    // Content is already in HTML, no need to fetch
    // Just make sure it's properly styled
}

// Initialize when page loads
window.addEventListener('load', () => {
    initGlitchAnimation();
    initModeToggle();
    initRoleToggle();
    initMicrophone();
    initRobotMovement();
    loadArticles();
    loadResearcherContent();
});