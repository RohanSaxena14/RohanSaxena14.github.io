let isRecording = false;
let isTalking = false;
let isFirstClick = true;
let mediaRecorder;
let audioChunks = [];
let audioURL;
let micButton = document.getElementById("micButton");
let statusText = document.getElementById("status");
let audioStream;

// Generate a random session ID when the page loads
const sessionId = generateSessionId();

// Function to generate a random session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15); // Generate a random string
}

// List audio input devices
async function listAudioDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log("Available audio devices:", devices.filter(device => device.kind === "audioinput"));
    return devices.filter(device => device.kind === "audioinput");
}

// Initialize audio with proper error handling
async function initializeAudio() {
    try {
        const devices = await listAudioDevices();
        const airPodsDevice = devices.find(
            device => device.label.includes("AirPods") && device.kind === "audioinput"
        );

        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: airPodsDevice ? { deviceId: airPodsDevice.deviceId } : true,
        });

        mediaRecorder = new MediaRecorder(audioStream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            audioChunks = [];
            const formData = new FormData();
            formData.append("audio", audioBlob);
            formData.append("sessionId", sessionId); // Add session ID to the form data

            statusText.textContent = "sharing...";
            const response = await fetch("https://1f4d-103-233-219-109.ngrok-free.app/chat", {
                method: "POST",
                body: formData,
            });

            const audioResponse = await response.blob();
            audioURL = URL.createObjectURL(audioResponse);
            playAudio();
        };
    } catch (error) {
        if (error.name === "NotAllowedError") {
            alert("Microphone access denied. Please allow microphone permissions.");
        } else if (error.name === "NotFoundError") {
            alert("No microphone found. Please connect a microphone and try again.");
        } else if (error.name === "NotReadableError") {
            alert("Microphone is already in use. Please close other applications and try again.");
        } else {
            alert("An error occurred while accessing the microphone: " + error.message);
        }
        console.error("Error initializing audio:", error);
    }
}

// Handle button clicks for recording and stopping
async function toggleRecording() {
    if (isTalking) {
        return; // Prevent any interaction while the bot is talking
    }

    if (isFirstClick) {
        statusText.textContent = "talking...";
        playLocalAudio();
        isFirstClick = false;
    } else {
        if (isRecording) {
            mediaRecorder.stop();
            statusText.textContent = "listening...";
            micButton.disabled = true; // Disable the mic button while recording
            micButton.classList.remove("recording");
            micButton.classList.add("listening");
        } else {
            try {
                mediaRecorder.start();
                statusText.textContent = "listening...";
                micButton.classList.add("recording");
                micButton.classList.remove("listening");
            } catch (error) {
                alert("Error starting audio recording: " + error.message);
                console.error("Error starting MediaRecorder:", error);
            }
        }

        isRecording = !isRecording;
    }
}

// Play a local audio file (used for prerecorded message)
async function playLocalAudio() {
    let audio = new Audio("data/kickoff2.mp3"); // Replace with your local file path
    audio.play();

    // Disable the mic button right away when the bot starts talking
    micButton.disabled = true;

    audio.onended = () => {
        statusText.textContent = "listening...";
        micButton.disabled = false; // Re-enable the mic button after local audio ends
        micButton.classList.remove("recording");
        micButton.classList.add("listening");

        try {
            mediaRecorder.start();
            isRecording = true;
        } catch (error) {
            alert("Error starting recording after local audio playback: " + error.message);
            console.error("Error starting MediaRecorder:", error);
        }
    };
}

// Play the received audio from the server (this is where we disable the button while the bot is talking)
async function playAudio() {
    isTalking = true; // Set isTalking to true to indicate the bot is talking
    statusText.textContent = "talking...";
    micButton.disabled = true; // Disable the mic button while the bot is talking
    let audio = new Audio(audioURL);
    audio.play();

    audio.onended = () => {
        isTalking = false; // Set isTalking to false when the audio ends
        statusText.textContent = "idle...";
        micButton.disabled = false; // Re-enable the mic button after the bot finishes talking
        micButton.classList.remove("recording");
        micButton.classList.remove("listening");
    };
}

// Listen for device changes and reinitialize audio
navigator.mediaDevices.ondevicechange = async () => {
    console.log("Device change detected. Reinitializing audio...");
    await initializeAudio();
};

// Initialize microphone access when the page loads
initializeAudio();
