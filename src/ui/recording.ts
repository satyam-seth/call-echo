import { MediaManager } from "../managers/media";
import { RecordingManager } from "../managers/recording";

let stream: MediaStream | null = null;
const recordingManager = new RecordingManager();

function getButton(innerText: string, id: string, onClick: (e: MouseEvent) => Promise<void> | void, disabled: boolean = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = id;
    button.disabled = disabled;
    button.innerText = innerText;
    button.addEventListener('click', onClick);
    return button;
}

function getVideoElement(stream: MediaStream, id: string) {
    const videoElement = document.createElement('video');
    videoElement.id = id;
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.controls = true;
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    return videoElement;
}

function toggleButtonDisabled(id: string, isDisabled: boolean) {
    const button = document.querySelector<HTMLButtonElement>(`#${id}`)!;
    button.disabled = isDisabled;
}

function enableToggleUserVideoButton() {
    const button = document.querySelector<HTMLButtonElement>(`#recording-toggle-user-video-btn`)!;
    button.disabled = false;
    button.innerText = 'Disable User Video';
}

function enableToggleUserAudioButton() {
    const button = document.querySelector<HTMLButtonElement>(`#recording-toggle-user-audio-btn`)!;
    button.disabled = false;
    button.innerText = 'Disable User Audio';
}

function enableStopLocalUserStreamButton() {
    toggleButtonDisabled('recording-stop-local-user-stream-btn', false);
}

function enableLocalUserStreamVideoButton() {
    toggleButtonDisabled('recording-local-user-stream-video-btn', false);
}

function enableStartRecordingButton() {
    toggleButtonDisabled('start-recording-btn', false);
}

function enablePauseRecordingButton() {
    toggleButtonDisabled('pause-recording-btn', false);
}

function enableResumeRecordingButton() {
    toggleButtonDisabled('resume-recording-btn', false);
}

function enableStopRecordingButton() {
    toggleButtonDisabled('stop-recording-btn', false);
}

function enableDownloadRecordingButton() {
    toggleButtonDisabled('download-recording-btn', false);
}

function disableStartRecordingButton() {
    toggleButtonDisabled('start-recording-btn', true);
}

function disablePauseRecordingButton() {
    toggleButtonDisabled('pause-recording-btn', true);
}

function disableResumeRecordingButton() {
    toggleButtonDisabled('resume-recording-btn', true);
}

function disableStopRecordingButton() {
    toggleButtonDisabled('stop-recording-btn', true);
}

function disableDownloadRecordingButton() {
    toggleButtonDisabled('download-recording-btn', true);
}

function disableToggleUserAudioButton() {
    const button = document.querySelector<HTMLButtonElement>(`#recording-toggle-user-audio-btn`)!;
    button.disabled = true;
    button.innerText = 'Enable User Audio';
}

function disableToggleUserVideoButton() {
    const button = document.querySelector<HTMLButtonElement>(`#recording-toggle-user-video-btn`)!;
    button.disabled = true;
    button.innerText = 'Enable User Video';
}

function resetUserMediaElement() {
    const videoElement = document.querySelector<HTMLVideoElement>('video#stream-video');
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
    }
}

function stopLocalUserStreamButton(): HTMLButtonElement {
    return getButton(`Stop local user stream`, 'recording-stop-local-user-stream-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        enableLocalUserStreamVideoButton();
        disableToggleUserAudioButton();
        disableToggleUserVideoButton();
        resetUserMediaElement();

        MediaManager.instance.stopMediaStream();
        stream = null;

        // if recording is in progress, stop it
        if (recordingManager.recordingState === 'recording') {
            await recordingManager.stop();
            disablePauseRecordingButton();
            disableResumeRecordingButton();
            disableStopRecordingButton();

            const blob = await recordingManager.stop();
            console.log('Recording stopped. Blob:', blob);
            enableDownloadRecordingButton();
        } else {
            disableStartRecordingButton();
        }

    }, true);
}

function startRecordingButton(): HTMLButtonElement {
    return getButton(`Start Recording`, 'start-recording-btn', async (e: Event) => {
        if (!stream) {
            window.alert('No stream available. Please start the local user stream first.');
            return;
        }
        (e.target as HTMLButtonElement).disabled = true;
        recordingManager.start(stream);

        enablePauseRecordingButton();
        enableStopRecordingButton();
        disableDownloadRecordingButton();
    }, true);
}

function pauseRecordingButton(): HTMLButtonElement {
    return getButton(`Pause Recording`, 'pause-recording-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        recordingManager.pause();
        enableResumeRecordingButton();
    }, true);
}

function resumeRecordingButton(): HTMLButtonElement {
    return getButton(`Resume Recording`, 'resume-recording-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        recordingManager.resume();
        enablePauseRecordingButton();
    }, true);
}

function stopRecordingButton(): HTMLButtonElement {
    return getButton(`Stop Recording`, 'stop-recording-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;

        const blob = await recordingManager.stop();
        console.log('Recording stopped. Blob:', blob);

        enableStartRecordingButton();
        disablePauseRecordingButton();
        disableResumeRecordingButton();
        enableDownloadRecordingButton();
    }, true);
}

function downloadRecordingButton(): HTMLButtonElement {
    return getButton(`Download Recording`, 'download-recording-btn', async (e: Event) => {
        recordingManager.download('recording');
    }, true);
}

function onToggleUserAudioButtonClick(e: MouseEvent) {
    MediaManager.instance.toggleUserTrack('audio');
    const isAudioEnabled = MediaManager.instance.isUserTrackEnabled('audio');
    (e.target as HTMLButtonElement).innerText = isAudioEnabled ? 'Disable User Audio' : 'Enable User Audio';
}

function toggleUserAudioButton() {
    return getButton('Disable User Audio', 'recording-toggle-user-audio-btn', onToggleUserAudioButtonClick, true);
}

function onToggleUserVideoButtonClick(e: MouseEvent) {
    MediaManager.instance.toggleUserTrack('video');
    const isAudioEnabled = MediaManager.instance.isUserTrackEnabled('video');
    (e.target as HTMLButtonElement).innerText = isAudioEnabled ? 'Disable User Video' : 'Enable User Video';
}

function toggleUserVideoButton() {
    return getButton('Disable Video', 'recording-toggle-user-video-btn', onToggleUserVideoButtonClick, true);
}

function getLocalUserStreamVideoButton(): HTMLButtonElement {
    return getButton(`Get local user video stream`, 'recording-local-user-stream-video-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;

        try {
            stream = await MediaManager.instance.getUserMedia({ video: true, audio: true });
        } catch (err) {
            (e.target as HTMLButtonElement).disabled = false;

            if (err.name === 'NotAllowedError') {
                window.alert('User denied permission to share video');
            } else {
                window.alert('Failed to get video stream: ' + err);
            }
            return;
        }

        const recordingContainer = document.querySelector<HTMLDivElement>('.recording-container')!;
        recordingContainer.appendChild(getVideoElement(stream, 'stream-video'));

        enableStopLocalUserStreamButton();
        enableToggleUserAudioButton();
        enableToggleUserVideoButton();
        enableStartRecordingButton();
    });
}

export function getRecordingContainer() {
    const container = document.createElement('div');
    container.className = 'recording-container';

    const heading = document.createElement('h2');
    heading.innerText = 'Recording Demo';
    container.appendChild(heading);

    container.appendChild(getLocalUserStreamVideoButton());
    container.appendChild(stopLocalUserStreamButton());
    container.appendChild(toggleUserAudioButton());
    container.appendChild(toggleUserVideoButton());

    container.appendChild(startRecordingButton());
    container.appendChild(pauseRecordingButton());
    container.appendChild(resumeRecordingButton());
    container.appendChild(stopRecordingButton());
    container.appendChild(downloadRecordingButton());

    return container;
}