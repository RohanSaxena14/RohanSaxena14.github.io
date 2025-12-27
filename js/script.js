// 3D Neural Network Animation
function initNeuralNetwork() {
    const canvas = document.getElementById('neural-network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    // Check if in AI mode
    function isAIMode() {
        return document.body.classList.contains('ai-mode');
    }
    
    // Node class with 3D coordinates
    class Node {
        constructor() {
            // Spawn nodes primarily on LEFT and RIGHT sides
            // 70% chance to spawn on far left or far right
            if (Math.random() < 0.7) {
                // Spawn on left or right edge
                const onLeft = Math.random() < 0.5;
                
                if (onLeft) {
                    // Left panel - between -width/2 and -width/4
                    this.x = -width/2 + Math.random() * (width/4);
                } else {
                    // Right panel - between width/4 and width/2
                    this.x = width/4 + Math.random() * (width/4);
                }
                
                // Y can be anywhere
                this.y = Math.random() * height - height / 2;
            } else {
                // 30% spawn elsewhere with edge bias
                const rawX = Math.random() * width - width / 2;
                const rawY = Math.random() * height - height / 2;
                
                // Apply bias - push away from center
                const bias = 0.6;
                this.x = rawX + (rawX > 0 ? 1 : -1) * Math.abs(rawX) * bias;
                this.y = rawY + (rawY > 0 ? 1 : -1) * Math.abs(rawY) * bias;
            }
            
            // Z depth
            const rawZ = Math.random() * 1000 - 500;
            const bias = 0.4;
            this.z = rawZ + (rawZ > 0 ? 1 : -1) * Math.abs(rawZ) * bias;
            
            // Velocity
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.vz = (Math.random() - 0.5) * 0.5;
            
            // Rotation
            this.rotationSpeed = (Math.random() - 0.5) * 0.01;
            
            // Properties
            this.life = 1.0;
            this.maxLife = Infinity; // Never die - persist permanently
            this.age = 0;
            this.fadeIn = true;
            this.fadeOut = false;
            
            // Size based on depth
            this.baseSize = Math.random() * 4 + 3;
        }
        
        update(angleX, angleY) {
            // Update position
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            
            // Wrap around edges
            const boundary = 600;
            if (this.x > boundary) this.x = -boundary;
            if (this.x < -boundary) this.x = boundary;
            if (this.y > boundary) this.y = -boundary;
            if (this.y < -boundary) this.y = boundary;
            if (this.z > boundary) this.z = -boundary;
            if (this.z < -boundary) this.z = boundary;
            
            // Update life - only fade in, never fade out
            this.age++;
            if (this.age < 30 && this.fadeIn) {
                this.life = this.age / 30;
            } else {
                this.life = 1.0; // Stay at full opacity
            }
            
            return false; // Never die
        }
        
        get2DPosition() {
            // Perspective projection
            const perspective = 600;
            // Clamp z to prevent it from getting too close to -perspective
            const clampedZ = Math.max(this.z, -perspective + 50);
            const scale = perspective / (perspective + clampedZ);
            
            return {
                x: this.x * scale + width / 2,
                y: this.y * scale + height / 2,
                scale: scale,
                z: clampedZ
            };
        }
        
        draw(ctx) {
            const pos = this.get2DPosition();
            
            // Safety check - skip if position is invalid
            if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.scale)) {
                return pos;
            }
            
            // Size based on depth (closer = bigger)
            const size = this.baseSize * pos.scale;
            
            // Skip if size is invalid or too large
            if (!isFinite(size) || size <= 0 || size > 1000) {
                return pos;
            }
            
            // Alpha based on life and depth
            const depthAlpha = Math.max(0, Math.min(1, (pos.z + 500) / 1000));
            const alpha = this.life * depthAlpha;
            
            // Draw node
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            
            // Color based on mode - WHITE for AI mode, BLACK for normal mode
            const color = isAIMode() ? '255, 255, 255' : '0, 0, 0';
            const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size);
            gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
            gradient.addColorStop(1, `rgba(${color}, ${alpha * 0.3})`);
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            return pos;
        }
    }
    
    // Connection class
    class Connection {
        constructor(node1, node2) {
            this.node1 = node1;
            this.node2 = node2;
            this.life = 1.0;
            this.age = 0;
            this.maxLife = Infinity; // Never die - persist permanently
        }
        
        update() {
            this.age++;
            if (this.age < 20) {
                this.life = this.age / 20;
            } else {
                this.life = 1.0; // Stay at full opacity
            }
            return false; // Never die
        }
        
        draw(ctx) {
            const pos1 = this.node1.get2DPosition();
            const pos2 = this.node2.get2DPosition();
            
            // Safety checks for invalid positions
            if (!isFinite(pos1.x) || !isFinite(pos1.y) || !isFinite(pos2.x) || !isFinite(pos2.y)) {
                return;
            }
            
            // Only draw if both nodes are reasonably visible
            if (pos1.z < -400 || pos2.z < -400) return;
            
            // Alpha based on life and average depth
            const avgZ = (pos1.z + pos2.z) / 2;
            const depthAlpha = Math.max(0, Math.min(1, (avgZ + 500) / 1000));
            const alpha = this.life * depthAlpha * 0.5;
            
            // Width based on depth
            const avgScale = (pos1.scale + pos2.scale) / 2;
            const lineWidth = 0.5 + avgScale * 0.5;
            
            // Safety check for line width
            if (!isFinite(lineWidth) || lineWidth <= 0) {
                return;
            }
            
            // Color based on mode - WHITE for AI mode, BLACK for normal mode
            const color = isAIMode() ? '255, 255, 255' : '0, 0, 0';
            
            // Draw connection
            ctx.beginPath();
            ctx.moveTo(pos1.x, pos1.y);
            ctx.lineTo(pos2.x, pos2.y);
            ctx.strokeStyle = `rgba(${color}, ${alpha})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
    }
    
    // Network state
    let nodes = [];
    let connections = [];
    let angleX = 0;
    let angleY = 0;
    const maxNodes = 80; // More nodes for more clusters
    const maxConnections = 200; // MUCH higher - won't stop forming connections
    const connectionDistance = 150; // MUCH SMALLER - only very close nodes connect (was 300)
    
    // Initialize all nodes at once
    for (let i = 0; i < maxNodes; i++) {
        nodes.push(new Node());
    }
    
    // Animation loop
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Update rotation
        angleX += 0.002;
        angleY += 0.003;
        
        // Update and draw nodes (no filtering - nodes never die)
        nodes.forEach(node => {
            node.update(angleX, angleY);
            node.draw(ctx);
        });
        
        // Update existing connections (no filtering - connections never die)
        connections.forEach(conn => {
            conn.update();
            conn.draw(ctx);
        });
        
        // Create new connections between nearby nodes - form clusters continuously
        if (connections.length < maxConnections && Math.random() < 0.20) { // Much higher frequency
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dz = nodes[i].z - nodes[j].z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    
                    if (distance < connectionDistance) {
                        // Check if connection doesn't already exist
                        const exists = connections.some(c => 
                            (c.node1 === nodes[i] && c.node2 === nodes[j]) ||
                            (c.node1 === nodes[j] && c.node2 === nodes[i])
                        );
                        
                        if (!exists && Math.random() < 0.5) { // Much higher probability
                            connections.push(new Connection(nodes[i], nodes[j]));
                            break;
                        }
                    }
                }
                if (connections.length >= maxConnections) break;
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });
    
    // Start animation
    animate();
}

// Globe Animation with rotating dots around "AI" text
function initGlobeAnimation() {
    const globeContainers = document.querySelectorAll('.globe-container');
    if (globeContainers.length === 0) return;
    
    // Initialize each globe container
    globeContainers.forEach(globeContainer => {
        const canvas = globeContainer.querySelector('.globe-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size based on container size
        const containerWidth = globeContainer.offsetWidth || 200;
        const size = containerWidth;
        canvas.width = size;
        canvas.height = size;
        
        // Globe state
        let rotation = 0;
        let ripplePhase = 0;
        const dots = [];
        const numDots = 120;
        const radius = size * 0.375;
        
        // Ring particles
        const ringParticles = [];
        const numRingParticles = 80;
        
        // Check if in AI mode
        function isAIMode() {
            return document.body.classList.contains('ai-mode');
        }
        
        // Create dots on sphere surface
        for (let i = 0; i < numDots; i++) {
            const theta = Math.acos(2 * Math.random() - 1);
            const phi = Math.random() * Math.PI * 2;
            
            dots.push({
                theta: theta,
                phi: phi,
                baseSize: Math.random() * 1.2 + 0.8
            });
        }
        
        // Create Saturn ring particles
        for (let i = 0; i < numRingParticles; i++) {
            const angle = (i / numRingParticles) * Math.PI * 2;
            const ringRadius = radius * (1.4 + Math.random() * 0.3); // Rings at 1.4-1.7x radius
            const yOffset = (Math.random() - 0.5) * 5; // Slight vertical variation
            
            ringParticles.push({
                angle: angle,
                ringRadius: ringRadius,
                yOffset: yOffset,
                size: Math.random() * 1.5 + 0.5,
                speed: 0.01 + Math.random() * 0.01
            });
        }
        
        function animate() {
            ctx.clearRect(0, 0, size, size);
            
            const centerX = size / 2;
            const centerY = size / 2;
            
            rotation += 0.025;
            ripplePhase += 0.05;
            
            // Draw gravitational ripples (background)
            for (let i = 3; i >= 1; i--) {
                const rippleRadius = radius * (1.8 + i * 0.3) + Math.sin(ripplePhase + i) * 8;
                const alpha = 0.03 * (4 - i);
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
                ctx.strokeStyle = isAIMode() 
                    ? `rgba(224, 224, 224, ${alpha})`
                    : `rgba(44, 44, 44, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Draw Saturn rings (behind the sphere)
            const backRingParticles = ringParticles.filter(p => {
                const rotatedAngle = p.angle + rotation * p.speed;
                const y = Math.sin(rotatedAngle) * p.ringRadius * 0.3;
                return y < 0; // Behind sphere
            });
            
            backRingParticles.forEach(particle => {
                const rotatedAngle = particle.angle + rotation * particle.speed;
                const x = Math.cos(rotatedAngle) * particle.ringRadius;
                const y = Math.sin(rotatedAngle) * particle.ringRadius * 0.3; // Flatten for ring effect
                
                const projX = centerX + x;
                const projY = centerY + y + particle.yOffset;
                
                const distFromCenter = Math.abs(y);
                const alpha = 0.6 * (1 - distFromCenter / (particle.ringRadius * 0.3));
                
                ctx.beginPath();
                ctx.arc(projX, projY, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = isAIMode()
                    ? `rgba(224, 224, 224, ${alpha})`
                    : `rgba(44, 44, 44, ${alpha})`;
                ctx.fill();
            });
            
            // Scale font size based on canvas size
            const fontSize = Math.floor(size * 0.22);
            ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (isAIMode()) {
                ctx.fillStyle = '#e0e0e0';
            } else {
                ctx.fillStyle = '#2c2c2c';
            }
            
            ctx.fillText('AI', centerX, centerY);
            
            // Draw sphere dots
            const projectedDots = dots.map(dot => {
                const rotatedPhi = dot.phi + rotation;
                
                const x = radius * Math.sin(dot.theta) * Math.cos(rotatedPhi);
                const y = radius * Math.sin(dot.theta) * Math.sin(rotatedPhi);
                const z = radius * Math.cos(dot.theta);
                
                const scale = 1 / (1 + z / 400);
                const projX = centerX + x * scale;
                const projY = centerY + y * scale * 0.7;
                
                return {
                    x: projX,
                    y: projY,
                    z: z,
                    scale: scale,
                    baseSize: dot.baseSize
                };
            });
            
            projectedDots.sort((a, b) => a.z - b.z);
            
            projectedDots.forEach(dot => {
                const dotSize = dot.baseSize * dot.scale;
                const alpha = (dot.z + radius) / (radius * 2);
                
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
                
                if (isAIMode()) {
                    ctx.fillStyle = `rgba(224, 224, 224, ${alpha * 1.0})`;
                } else {
                    ctx.fillStyle = `rgba(44, 44, 44, ${alpha * 1.0})`;
                }
                
                ctx.fill();
            });
            
            // Draw Saturn rings (in front of the sphere)
            const frontRingParticles = ringParticles.filter(p => {
                const rotatedAngle = p.angle + rotation * p.speed;
                const y = Math.sin(rotatedAngle) * p.ringRadius * 0.3;
                return y >= 0; // In front of sphere
            });
            
            frontRingParticles.forEach(particle => {
                const rotatedAngle = particle.angle + rotation * particle.speed;
                const x = Math.cos(rotatedAngle) * particle.ringRadius;
                const y = Math.sin(rotatedAngle) * particle.ringRadius * 0.3;
                
                const projX = centerX + x;
                const projY = centerY + y + particle.yOffset;
                
                const distFromCenter = Math.abs(y);
                const alpha = 0.8 * (1 - distFromCenter / (particle.ringRadius * 0.3));
                
                ctx.beginPath();
                ctx.arc(projX, projY, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = isAIMode()
                    ? `rgba(224, 224, 224, ${alpha})`
                    : `rgba(44, 44, 44, ${alpha})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
        
        // Click handler to trigger synthetic view
        globeContainer.addEventListener('click', () => {
            const syntheticBtn = document.querySelector('.role-btn.synthetic');
            if (syntheticBtn && !document.body.classList.contains('synthetic-view')) {
                syntheticBtn.click();
            }
        });
    });
}

// Glitch animation with random timing
function initGlitchAnimation() {
    const profileImage = document.querySelector('.profile-image');
    const mobileProfileImage = document.querySelector('.mobile-profile-image');
    
    const isMobile = window.innerWidth <= 768;
    
    function triggerGlitch(element) {
        if (!element) return;
        
        const glitchDuration = isMobile 
            ? Math.random() * 0.2 + 0.15
            : Math.random() * 0.4 + 0.25;
        
        element.classList.add('glitching');
        document.body.classList.add('glitch-active');
        
        setTimeout(() => {
            element.classList.remove('glitching');
            document.body.classList.remove('glitch-active');
        }, glitchDuration * 1000);
    }
    
    const glitchInterval = isMobile ? 6000 : 3000;
    
    setInterval(() => {
        triggerGlitch(profileImage);
        triggerGlitch(mobileProfileImage);
    }, glitchInterval);
}

// Mode toggle functionality
function initModeToggle() {
    const humanBtn = document.querySelector('.mode-btn.human');
    const aiBtn = document.querySelector('.mode-btn.ai');
    const body = document.body;
    
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
    
    articlesSidebar.innerHTML = '<div class="articles-title">Featured Writings</div>';
    
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
    
    const savedRole = localStorage.getItem('viewRole') || 'builder';
    switchRole(savedRole);
    
    builderBtn.addEventListener('click', () => switchRole('builder'));
    scholarBtn.addEventListener('click', () => switchRole('scholar'));
    syntheticBtn.addEventListener('click', () => switchRole('synthetic'));
    
    function switchRole(role) {
        body.classList.remove('researcher-view', 'synthetic-view');
        builderBtn.classList.remove('active');
        scholarBtn.classList.remove('active');
        syntheticBtn.classList.remove('active');
        
        if (role !== 'synthetic' && window.syntheticIsListening) {
            console.log('🛑 Exiting Synthetic mode - stopping microphone');
            const micButton = document.querySelector('.microphone-button');
            if (micButton && micButton.classList.contains('listening')) {
                micButton.click();
            }
        }
        
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

// NOTE: Replace ONLY the initMicrophone() function in your complete-final.js
// with this complete version from your original code:

// Microphone functionality
function initMicrophone() {
    const micButton = document.querySelector('.microphone-button');
    const micText = document.querySelector('.microphone-text');
    const logsContent = document.getElementById('synthetic-logs-content');
    const logsClearBtn = document.querySelector('.logs-clear-btn');
    
    console.log('🔍 Initializing microphone...');
    console.log('   micButton:', micButton);
    console.log('   logsContent:', logsContent);
    
    if (!micButton) {
        console.warn('⚠️  Microphone button not found');
        return;
    }
    
    if (!logsContent) {
        console.warn('⚠️  Logs content container not found - logs will be disabled');
    }
    
    let isListening = false;
    let socket = null;
    let mediaRecorder = null;
    let audioContext = null;
    let audioStream = null;
    let currentAudio = null;
    let isPlaying = false;
    
    // NEW: Streaming audio variables
    let audioChunks = [];
    let isReceivingAudio = false;
    
    // NEW: Session time tracking
    let sessionTimeLimitReached = false;
    let remainingTimeInterval = null;
    
    // Helper function to add log entries
    function addLog(message, type = 'info') {
        if (!logsContent) {
            console.warn('⚠️  Logs container not found, skipping log:', message);
            return;
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        
        const logText = document.createElement('span');
        logText.className = 'log-text';
        logText.textContent = message;
        
        logEntry.appendChild(logText);
        
        console.log(`📋 Adding log: type="${type}", message="${message}"`);
        
        // For LLM responses, add at the BEGINNING and mark as current AI response
        if (type === 'llm') {
            logsContent.insertBefore(logEntry, logsContent.firstChild);
            logEntry.classList.add('log-persist');
            // Mark this as the current AI response to keep during playback
            logEntry.dataset.isCurrentAI = 'true';
            console.log('🔵 LLM log persisted at TOP, will remain until playback ends');
            console.log('   Classes:', logEntry.className);
        } else {
            logsContent.appendChild(logEntry);
            
            // Auto-remove non-LLM logs after 3.5s
            setTimeout(() => {
                if (logEntry.parentNode === logsContent) {
                    logsContent.removeChild(logEntry);
                }
            }, 3500);
        }
        
        // Limit ONLY non-persisted logs to max 2
        const allLogs = Array.from(logsContent.children);
        const nonPersistedLogs = allLogs.filter(log => !log.classList.contains('log-persist'));
        
        // Remove oldest non-persisted logs if we have more than 2
        while (nonPersistedLogs.length > 2) {
            const oldestNonPersisted = nonPersistedLogs.shift();
            if (oldestNonPersisted && oldestNonPersisted.parentNode === logsContent) {
                logsContent.removeChild(oldestNonPersisted);
            }
        }
    }
    
    // Helper to clear ALL AI responses
    function clearAllAIResponses() {
        if (!logsContent) return;
        
        // Find ALL log entries with log-llm class
        const allAILogs = logsContent.querySelectorAll('.log-llm');
        console.log(`🗑️  Found ${allAILogs.length} AI response(s) to clear`);
        
        allAILogs.forEach(log => {
            if (log.parentNode === logsContent) {
                console.log('   Removing:', log.textContent.substring(0, 50));
                logsContent.removeChild(log);
            }
        });
    }
    
    // Helper to clear all persisted LLM logs manually
    function clearPersistedLogs() {
        if (!logsContent) return;
        
        const persistedLogs = logsContent.querySelectorAll('.log-persist');
        persistedLogs.forEach(log => {
            // Add fade out animation before removing
            log.style.animation = 'logFadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                if (log.parentNode === logsContent) {
                    logsContent.removeChild(log);
                }
            }, 500);
        });
    }
    
    // Clear logs button (if exists)
    if (logsClearBtn) {
        logsClearBtn.addEventListener('click', () => {
            logsContent.innerHTML = '';
            addLog('Logs cleared', 'info');
        });
    }
    
    // WebSocket connection to server
    const SERVER_URL = 'https://b04b28715ee1.ngrok-free.app';
    
    function connectWebSocket() {
        // Use Socket.IO client
        socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            addLog('Connected to server', 'success');
            micText.textContent = 'Connected - Click to start';
            sessionTimeLimitReached = false; // Reset on reconnect
        });
        
        socket.on('connection_established', (data) => {
            console.log('🔗 Connection established:', data);
            addLog(`Connected - ${data.time_limit / 60} min limit`, 'success');
        });
        
        socket.on('transcription_result', (data) => {
            const transcript = data.transcript || '';
            const is_final = data.is_final || false;
            const speech_final = data.speech_final || false;
            
            console.log(`📝 Transcript: "${transcript}" [is_final: ${is_final}, speech_final: ${speech_final}]`);
            
            // Log transcripts
            if (transcript.trim().length > 0) {
                if (speech_final) {
                    addLog(`You: "${transcript}"`, 'transcript');
                } else if (is_final) {
                    addLog(`Heard: "${transcript}"`, 'info');
                }
            }
            
            // Check for interruption if playing (4+ words required)
            if (isPlaying && transcript.trim().length > 0) {
                const wordCount = transcript.trim().split(/\s+/).length;
                console.log(`🔢 Word count: ${wordCount}`);
                
                if (wordCount >= 4) {
                    console.log('🛑 Interruption detected - 4+ words during playback');
                    addLog('Interrupting playback...', 'warning');
                    stopCurrentAudio();
                    // Server will handle triggering new response
                    // Reset isPlaying flag so future transcripts can also interrupt
                    isPlaying = false;
                }
            }
        });
        
        socket.on('llm_response', (data) => {
            console.log('🤖 LLM Response:', data);
            
            // Clear OLD AI responses from previous conversations before adding new one
            clearAllAIResponses();
            
            // Add new AI response (it will persist until next llm_response)
            addLog(`AI: "${data.ai_response}"`, 'llm');
            
            // Update remaining time if provided
            if (data.remaining_time !== undefined) {
                console.log(`⏱️  Remaining time: ${data.remaining_time}s`);
            }
        });
        
        // NEW: Handle playback starting
        socket.on('playback_starting', (data) => {
            console.log('🎵 Audio streaming starting...');
            audioChunks = [];
            isReceivingAudio = true;
            isPlaying = true;
            micText.textContent = 'Receiving audio...';
            addLog('Generating speech...', 'tts');
        });
        
        // NEW: Receive audio chunks
        socket.on('audio_chunk_stream', (data) => {
            if (isReceivingAudio) {
                const binaryString = atob(data.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                audioChunks.push(bytes);
                console.log(`📦 Received chunk ${audioChunks.length} (${bytes.length} bytes)`);
            }
        });
        
        // NEW: Stream complete, play audio
        socket.on('audio_stream_complete', async () => {
            console.log('✅ Audio stream complete, combining and playing...');
            isReceivingAudio = false;
            
            // Combine all chunks
            const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedArray = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of audioChunks) {
                combinedArray.set(chunk, offset);
                offset += chunk.length;
            }
            
            console.log(`🎵 Total audio size: ${totalLength} bytes`);
            addLog(`Playing response (${(totalLength / 1024).toFixed(1)}KB)`, 'tts');
            
            // Play the audio
            try {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
                }
                
                const audioBuffer = await audioContext.decodeAudioData(combinedArray.buffer);
                console.log('✅ Audio decoded, duration:', audioBuffer.duration, 'seconds');
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                
                window.currentAudioSource = source;
                window.audioStartTime = audioContext.currentTime;
                window.audioDuration = audioBuffer.duration;
                
                isPlaying = true;
                micText.textContent = 'Playing response...';
                
                source.onended = () => {
                    console.log('✅ Playback completed');
                    addLog('Playback completed', 'success');
                    isPlaying = false;
                    window.currentAudioSource = null;
                    
                    if (socket) {
                        socket.emit('playback_ended', { completed: true });
                    }
                    
                    // Check if session ended after this playback
                    if (!sessionTimeLimitReached && isListening) {
                        micText.textContent = 'Listening...';
                    }
                };
                
                source.start(0);
                console.log('▶️  Audio playback started');
                
            } catch (error) {
                console.error('❌ Error playing streamed audio:', error);
                console.error('   Error name:', error.name);
                console.error('   Error message:', error.message);
                addLog(`Audio error: ${error.message}`, 'error');
                isPlaying = false;
                
                if (isListening) {
                    micText.textContent = 'Listening...';
                }
            }
        });
        
        socket.on('playback_interrupted', (data) => {
            console.log('⚡ Playback interrupted:', data);
            addLog('Playback interrupted', 'warning');
            stopCurrentAudio();
        });
        
        socket.on('ready_for_input', (data) => {
            console.log('✅ Ready for input:', data);
            
            if (isListening && !sessionTimeLimitReached) {
                micText.textContent = 'Listening...';
                addLog('Ready for input', 'success');
            }
        });
        
        socket.on('listening_started', (data) => {
            console.log('🎤 Listening started:', data);
            addLog('Listening started', 'success');
            
            // Show remaining time
            if (data.remaining_time !== undefined) {
                const minutes = Math.floor(data.remaining_time / 60);
                const seconds = Math.floor(data.remaining_time % 60);
                addLog(`Time remaining: ${minutes}m ${seconds}s`, 'info');
            }
        });
        
        socket.on('time_limit_reached', (data) => {
            console.log('⏰ Time limit reached:', data);
            sessionTimeLimitReached = true;
            
            // Clear any remaining time interval
            if (remainingTimeInterval) {
                clearInterval(remainingTimeInterval);
                remainingTimeInterval = null;
            }
            
            // Show prominent message
            addLog('⏰ 5-minute limit reached', 'error');
            addLog('Wrapping up conversation...', 'warning');
            
            // Update button text
            micText.textContent = 'Time limit reached';
            
            // Disable microphone button visually
            micButton.style.opacity = '0.6';
            micButton.style.cursor = 'not-allowed';
        });
        
        socket.on('session_ended', (data) => {
            console.log('👋 Session ended:', data);
            const minutes = Math.floor(data.total_time / 60);
            const seconds = Math.floor(data.total_time % 60);
            
            addLog(`Session ended after ${minutes}m ${seconds}s`, 'info');
            addLog('Refresh to start new conversation', 'info');
            
            // Stop listening
            stopListening();
            isListening = false;
            micButton.classList.remove('listening');
            micText.textContent = 'Session ended - Refresh page';
            
            // Optionally show refresh prompt
            setTimeout(() => {
                if (confirm('Conversation ended. Refresh to start a new session?')) {
                    location.reload();
                }
            }, 2000);
        });
        
        socket.on('error', (data) => {
            console.error('❌ Server error:', data);
            addLog(`Error: ${data.message}`, 'error');
            micText.textContent = 'Error - Click to retry';
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            addLog('Disconnected from server', 'error');
            micText.textContent = 'Disconnected - Click to reconnect';
            stopListening();
            
            // Clear remaining time interval
            if (remainingTimeInterval) {
                clearInterval(remainingTimeInterval);
                remainingTimeInterval = null;
            }
        });
    }
    
    async function startListening() {
        try {
            // Check if session time limit already reached
            if (sessionTimeLimitReached) {
                addLog('Session expired - Please refresh', 'error');
                micText.textContent = 'Session expired - Refresh page';
                return;
            }
            
            addLog('Requesting microphone access...', 'info');
            
            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MediaDevices API not available. Ensure you are using HTTPS or localhost.');
            }
            
            console.log('🎤 Requesting microphone permission...');
            
            // Request microphone access
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            console.log('🎤 Microphone access granted');
            addLog('Microphone access granted', 'success');
            
            // Create AudioContext for processing
            audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const source = audioContext.createMediaStreamSource(audioStream);
            
            // Create ScriptProcessor for raw audio data
            const bufferSize = 4096;
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
            
            processor.onaudioprocess = (e) => {
                if (socket && socket.connected && !sessionTimeLimitReached) {
                    // Get raw audio samples (Float32Array)
                    const inputData = e.inputBuffer.getChannelData(0);
                    
                    // Convert Float32 to Int16 PCM
                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        // Clamp to [-1, 1] and convert to 16-bit integer
                        const s = Math.max(-1, Math.min(1, inputData[i]));
                        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }
                    
                    // Convert to base64
                    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
                    
                    // Send to server
                    socket.emit('audio_chunk', {
                        audio: base64Audio,
                        timestamp: Date.now()
                    });
                }
            };
            
            // Connect the audio graph
            source.connect(processor);
            processor.connect(audioContext.destination);
            
            // Store processor for cleanup
            window.audioProcessor = processor;
            
            // Notify server to start Deepgram streaming
            socket.emit('start_listening');
            
            micText.textContent = 'Listening...';
            addLog('Streaming audio to server...', 'success');
            console.log('📤 Started sending raw PCM audio to server');
            
        } catch (error) {
            console.error('❌ Error accessing microphone:', error);
            console.error('   Error name:', error.name);
            console.error('   Error message:', error.message);
            
            let errorMsg = 'Microphone access denied';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMsg = 'Permission denied - Check browser settings';
                addLog('Permission denied - Allow microphone in browser', 'error');
            } else if (error.name === 'NotFoundError') {
                errorMsg = 'No microphone found';
                addLog('No microphone detected', 'error');
            } else if (error.name === 'NotReadableError') {
                errorMsg = 'Microphone already in use';
                addLog('Microphone in use by another app', 'error');
            } else if (error.message.includes('HTTPS') || error.message.includes('secure')) {
                errorMsg = 'HTTPS required for microphone';
                addLog('Microphone requires HTTPS connection', 'error');
            } else {
                addLog(`Microphone error: ${error.message}`, 'error');
            }
            
            micText.textContent = errorMsg;
            isListening = false;
            micButton.classList.remove('listening');
        }
    }
    
    function stopListening() {
        console.log('🛑 Stopping listening...');
        
        // Clear remaining time interval
        if (remainingTimeInterval) {
            clearInterval(remainingTimeInterval);
            remainingTimeInterval = null;
        }
        
        // Stop AudioContext and processor
        if (window.audioProcessor) {
            window.audioProcessor.disconnect();
            window.audioProcessor = null;
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
        
        if (socket) {
            socket.emit('stop_listening');
        }
        
        console.log('✅ Stopped listening');
    }
    
    function stopCurrentAudio() {
        if (window.currentAudioSource) {
            try {
                console.log('⏹️  Stopping audio source');
                window.currentAudioSource.stop();
                window.currentAudioSource.disconnect();
            } catch (e) {
                // Already stopped
                console.log('Audio source already stopped:', e.message);
            }
            window.currentAudioSource = null;
        }
        
        // Reset playing state
        isPlaying = false;
        
        // Also handle old Audio element if exists
        if (currentAudio) {
            try {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            } catch (e) {
                console.log('Audio element cleanup error:', e.message);
            }
            currentAudio = null;
        }
        
        if (isListening && !sessionTimeLimitReached) {
            micText.textContent = 'Listening...';
        }
        
        console.log('✅ Audio cleanup complete, isPlaying =', isPlaying);
    }
    
    micButton.addEventListener('click', () => {
        // Don't allow toggling if session ended
        if (sessionTimeLimitReached) {
            addLog('Session expired - Refresh page to restart', 'error');
            return;
        }
        
        isListening = !isListening;
        
        // Set global flag
        window.syntheticIsListening = isListening;
        
        if (isListening) {
            micButton.classList.add('listening');
            
            // Connect to WebSocket if not connected
            if (!socket || !socket.connected) {
                connectWebSocket();
                // Wait a bit for connection before starting
                setTimeout(() => {
                    if (socket && socket.connected) {
                        startListening();
                    }
                }, 500);
            } else {
                startListening();
            }
        } else {
            micButton.classList.remove('listening');
            micText.textContent = 'Talk to My Digital Twin';
            stopListening();
            stopCurrentAudio();
        }
    });
}

function loadResearcherContent() {
    // Content already in HTML
}

// Night Mode Toggle functionality
function initNightMode() {
    const nightModeToggle = document.getElementById('nightModeToggle');
    if (!nightModeToggle) return;
    
    // Check for saved night mode preference
    const savedNightMode = localStorage.getItem('nightMode') || 'off';
    if (savedNightMode === 'on') {
        document.body.classList.add('night-mode');
    }
    
    nightModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('night-mode');
        
        // Save preference
        const isNightMode = document.body.classList.contains('night-mode');
        localStorage.setItem('nightMode', isNightMode ? 'on' : 'off');
    });
}

// ADD this to your window.addEventListener('load') at the bottom:
window.addEventListener('load', () => {
    initNeuralNetwork();
    initGlitchAnimation();
    initModeToggle();
    initRoleToggle();
    initMicrophone();
    initGlobeAnimation();
    initNightMode(); // ADD THIS LINE
    loadArticles();
    loadResearcherContent();
});