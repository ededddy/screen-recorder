// Imports 
const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const {dialog, Menu } = remote;

// DOM elements
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectorBtn = document.getElementById('videoSelectBtn');

// Global stuff
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Event Handlers
videoSelectorBtn.onclick = getVideoSources;
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.remove('bg-indigo-500');
  startBtn.classList.add('bg-red-700');
  startBtn.innerText = 'Recording';
};
stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('bg-red-700');
  startBtn.classList.add('bg-indigo-500');
  startBtn.innerText = 'Start';
};



// Get available sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: [ 'window', 'screen' ]
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      }
    })
  );

  videoOptionsMenu.popup();
}

async function selectSource(source){
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  }

  // Create a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Reg Event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

// Captures all recorded chunks
function handleDataAvailable(e){
  console.log('video data available');
  recordedChunks.push(e.data);
}

async function handleStop(e){
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from( await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLable: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });

  console.log(filePath);
  writeFile(filePath, buffer, () => console.log('video saved successfully!'));
}
