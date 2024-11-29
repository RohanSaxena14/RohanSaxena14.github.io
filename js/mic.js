let isRecording = false;
let isTalking = false;
let isFirstClick = true; // Track the first click
let mediaRecorder;
let audioChunks = [];
let audioURL;
let micButton = document.getElementById("micButton");
let statusText = document.getElementById("status");
let audioStream; // To hold the audio stream after initial permission

// Ask for recording permission once on page load
async function initializeAudio() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            // Stop recording and handle audio chunks
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = []; // Reset audio chunks to avoid accumulation
            const formData = new FormData();
            formData.append('audio', audioBlob);

            // Send audio to server
            statusText.textContent = "sharing...";
            const response = await fetch('https://3c4b-103-233-219-109.ngrok-free.app/chat', {
                method: 'POST',
                body: formData,
            });

            const audioResponse = await response.blob();
            audioURL = URL.createObjectURL(audioResponse);
            playAudio();
        };
    } catch (error) {
        alert("Error accessing microphone. Please ensure you have granted permission.");
        console.error(error);
    }
}

// Handle button clicks for recording and stopping
async function toggleRecording() {
    if (isTalking) {
        // Do nothing if audio is currently playing
        return;
    }

    if (isFirstClick) {
        // First click: play a local audio file and change state to 'talking'
        statusText.textContent = "talking...";
        playLocalAudio(); // Play a local audio file on the first click
        isFirstClick = false; // Set the flag to false after the first click
    } else {
        if (isRecording) {
            // Stop recording
            mediaRecorder.stop();
            statusText.textContent = "listening...";
            micButton.disabled = true;
            micButton.classList.remove('recording');
            micButton.classList.add('listening'); // Add 'listening' class
        } else {
            // Start recording
            statusText.textContent = "listening...";
            mediaRecorder.start();
            micButton.classList.add('recording');
            micButton.classList.remove('listening'); // Remove 'listening' class
        }

        isRecording = !isRecording;
    }
}

// Play a local audio file (triggered on first click)
async function playLocalAudio() {
    // Create an audio element with a local audio file (replace with the path to your file)
    let audio = new Audio('rohanAI/uploads/dummy.wav'); // Replace with the path to your local file
    audio.play();

    audio.onended = () => {
        // After the audio finishes playing, switch to "listening" and start recording
        statusText.textContent = "listening...";
        micButton.disabled = false;
        micButton.classList.remove('recording'); // Ensure animation stops
        micButton.classList.add('listening'); // Add 'listening' class to trigger animation

        // Now start recording after the local audio is done
        mediaRecorder.start(); // Start recording audio after the local audio
        isRecording = true; // Set recording flag to true
    };
}

// Play the received audio from the server
async function playAudio() {
    statusText.textContent = "talking...";
    let audio = new Audio(audioURL);
    audio.play();

    audio.onended = () => {
        statusText.textContent = "idle...";
        micButton.disabled = false;
        micButton.classList.remove('recording');
        micButton.classList.remove('listening'); // Remove the 'listening' class
    };
}

// Initialize microphone access when the page loads
initializeAudio();
