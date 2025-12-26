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
        
        // Add glitch class to element
        element.classList.add('glitching');
        
        // Add global glitch class to body for line glow effect
        document.body.classList.add('glitch-active');
        
        // Remove glitch class after random duration
        setTimeout(() => {
            element.classList.remove('glitching');
            document.body.classList.remove('glitch-active');
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
        
        // Stop listening if exiting synthetic mode
        if (role !== 'synthetic' && window.syntheticIsListening) {
            console.log('🛑 Exiting Synthetic mode - stopping microphone');
            // Trigger microphone button click to stop
            const micButton = document.querySelector('.microphone-button');
            if (micButton && micButton.classList.contains('listening')) {
                micButton.click();
            }
        }
        
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
        });
        
        socket.on('connection_established', (data) => {
            console.log('🔗 Connection established:', data);
            addLog('Connection established', 'success');
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
                    
                    if (isListening) {
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
            
            if (isListening) {
                micText.textContent = 'Listening...';
                addLog('Ready for input', 'success');
            }
        });
        
        socket.on('listening_started', (data) => {
            console.log('🎤 Listening started:', data);
            addLog('Listening started', 'success');
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
        });
    }
    
    async function startListening() {
        try {
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
                if (socket && socket.connected) {
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
        
        if (isListening) {
            micText.textContent = 'Listening...';
        }
        
        console.log('✅ Audio cleanup complete, isPlaying =', isPlaying);
    }
    
    micButton.addEventListener('click', () => {
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