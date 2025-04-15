import { MediaManager } from "../managers/media";

let deviceChangeCallbackId: number | null = null;

function getButton(innerText: string, id: string, onClick: (e: MouseEvent) => Promise<void> | void, disabled: boolean = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = id;
    button.disabled = disabled;
    button.innerText = innerText;
    button.addEventListener('click', onClick);
    return button;
}

function toggleButtonDisabled(id: string, isDisabled: boolean) {
    const button = document.querySelector<HTMLButtonElement>(`#${id}`)!;
    button.disabled = isDisabled;
}

function enableLocalStreamButton() {
    toggleButtonDisabled('stop-local-stream-btn', false);
}

function enableToggleAudioButton() {
    const button = document.querySelector<HTMLButtonElement>(`#toggle-audio-btn`)!;
    button.disabled = false;
    button.innerText = 'Disable Audio';
}

function disableToggleAudioButton() {
    const button = document.querySelector<HTMLButtonElement>(`#toggle-audio-btn`)!;
    button.disabled = true;
    button.innerText = 'Enable Audio';
}

function enableToggleVideoButton() {
    const button = document.querySelector<HTMLButtonElement>(`#toggle-video-btn`)!;
    button.disabled = false;
    button.innerText = 'Disable Video';
}

function disableToggleVideoButton() {
    const button = document.querySelector<HTMLButtonElement>(`#toggle-video-btn`)!;
    button.disabled = true;
    button.innerText = 'Enable Video';
}

function disableLocalStreamVideoButton() {
    toggleButtonDisabled('local-stream-video-btn', true);
}

function enableLocalStreamVideoButton() {
    toggleButtonDisabled('local-stream-video-btn', false);
}

function disableLocalStreamAudioButton() {
    toggleButtonDisabled('local-stream-audio-btn', true);
}

function enableLocalStreamAudioButton() {
    toggleButtonDisabled('local-stream-audio-btn', false);
}

function onToggleAudioButtonClick(e: MouseEvent) {
    MediaManager.instance.toggleTrack('audio');
    const isAudioEnabled = MediaManager.instance.isTrackEnabled('audio');
    (e.target as HTMLButtonElement).innerText = isAudioEnabled ? 'Disable Audio' : 'Enable Audio';
}

function toggleAudioButton() {
    return getButton('Disable Audio', 'toggle-audio-btn', onToggleAudioButtonClick, true);
}

function onToggleVideoButtonClick(e: MouseEvent) {
    MediaManager.instance.toggleTrack('video');
    const isAudioEnabled = MediaManager.instance.isTrackEnabled('video');
    (e.target as HTMLButtonElement).innerText = isAudioEnabled ? 'Disable Video' : 'Enable Video';
}

function toggleVideoButton() {
    return getButton('Disable Video', 'toggle-video-btn', onToggleVideoButtonClick, true);
}

function updateAudioElementsStream(stream: MediaStream) {
    const audioElement = document.querySelector<HTMLAudioElement>('audio');
    if (audioElement) {
        audioElement.srcObject = stream;
    }
}

function updateVideoElementsStream(stream: MediaStream) {
    const videoElement = document.querySelector<HTMLVideoElement>('video');
    if (videoElement) {
        videoElement.srcObject = stream;
    }
}

function resetMediaElements() {
    const videoElement = document.querySelector<HTMLVideoElement>('video');
    const audioElement = document.querySelector<HTMLAudioElement>('audio');
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
    }
    if (audioElement) {
        audioElement.srcObject = null;
        audioElement.remove();
    }
}

function removeDeviceSelectors() {
    const audioInputDevicesSelectorContainer = document.querySelector<HTMLDivElement>('.audio-input-devices-selector-container');
    const audioOutputDevicesSelectorContainer = document.querySelector<HTMLDivElement>('.audio-output-devices-selector-container');
    const videoInputDevicesSelectorContainer = document.querySelector<HTMLDivElement>('.video-input-devices-selector-container');
    audioInputDevicesSelectorContainer?.remove();
    audioOutputDevicesSelectorContainer?.remove();
    videoInputDevicesSelectorContainer?.remove();
}

function stopLocalStreamButton(): HTMLButtonElement {
    return getButton(`Stop local stream`, 'stop-local-stream-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        enableLocalStreamAudioButton();
        enableLocalStreamVideoButton();
        disableToggleAudioButton();
        disableToggleVideoButton();
        resetMediaElements();
        removeDeviceSelectors();
        MediaManager.instance.stopMediaStream();
        unregisterDeviceChangeEvents();
    }, true);
}

function getVideoElement(stream: MediaStream) {
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.controls = true;
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    return videoElement;
}

function getAudioElement(stream: MediaStream) {
    const audioElement = document.createElement('audio');
    audioElement.srcObject = stream;
    audioElement.autoplay = true;
    audioElement.controls = true;
    return audioElement;
}

function getDevicesSelector(id: string, devices: MediaDeviceInfo[], onChange: (deviceId: string) => Promise<void>, selectedDeviceId?: string): HTMLSelectElement {
    const selector = document.createElement('select');
    selector.id = id;

    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Device ${device.deviceId}`;
        option.selected = selectedDeviceId !== undefined && device.deviceId === selectedDeviceId;
        selector.appendChild(option);
    });

    selector.addEventListener('change', async (e: Event) => {
        const selectedDeviceId = (e.target as HTMLSelectElement).value;
        await onChange(selectedDeviceId);
    });
    return selector;
}

function getAudioInputDevicesSelectorContainer(devices: MediaDeviceInfo[], selectedDeviceId?: string) {
    const container = document.createElement('div');
    container.className = 'audio-input-devices-selector-container';

    const selectorId = 'audio-input-devices-selector';

    const label = document.createElement('label');
    label.textContent = 'Audio Input Devices:';
    label.setAttribute('for', selectorId);
    container.appendChild(label);

    const deviceSelector = getDevicesSelector(selectorId, devices, async (deviceId: string) => {
        await MediaManager.instance.setAudioInputDevice(deviceId, updateAudioElementsStream);
    }, selectedDeviceId);
    container.appendChild(deviceSelector);

    return container;
}

function getAudioOutputDevicesSelectorContainer(devices: MediaDeviceInfo[]) {
    const container = document.createElement('div');
    container.className = 'audio-output-devices-selector-container';

    const selectorId = 'audio-output-devices-selector';

    const label = document.createElement('label');
    label.textContent = 'Audio Output Devices:';
    label.setAttribute('for', selectorId);

    container.appendChild(label);
    container.appendChild(getDevicesSelector(selectorId, devices, async (deviceId: string) => {
        // if video element is not null then set the audio output device
        const videoElement = document.querySelector<HTMLVideoElement>('video');
        if (videoElement) {
            await MediaManager.instance.setAudioOutputDevice(videoElement, deviceId);
        }
        // if audio element is not null then set the audio output device
        const audioElement = document.querySelector<HTMLAudioElement>('audio');
        if (audioElement) {
            await MediaManager.instance.setAudioOutputDevice(audioElement, deviceId);
        }
    }));

    return container;
}

function getVideoInputDevicesSelectorContainer(devices: MediaDeviceInfo[], selectedDeviceId?: string) {
    const container = document.createElement('div');
    container.className = 'video-input-devices-selector-container';

    const selectorId = 'video-input-devices-selector';

    const label = document.createElement('label');
    label.textContent = 'Video Input Devices:';
    label.setAttribute('for', selectorId);
    container.appendChild(label);

    const deviceSelector = getDevicesSelector(selectorId, devices, async (deviceId: string) => {
        await MediaManager.instance.setVideoInputDevice(deviceId, updateVideoElementsStream);
    }, selectedDeviceId)
    container.appendChild(deviceSelector);

    return container;
}

function unregisterDeviceChangeEvents() {
    if (deviceChangeCallbackId === null) return;
    MediaManager.instance.unregisterDeviceChange(deviceChangeCallbackId);
    deviceChangeCallbackId = null
}

function registerDeviceChangeEvents(forAudioElementOnly: boolean) {

    // on device change 
    deviceChangeCallbackId = MediaManager.instance.registerDeviceChange(async () => {
        console.log('Device changed');


        // check if stream is close then we have to get the stream again
        if (MediaManager.instance.mediaStream === null) {
            console.info('Media stream is null, getting new stream');
            // get the stream again
            const stream = await MediaManager.instance.getUserMedia({ video: forAudioElementOnly ? false : true, audio: true });

            const videoElement = document.querySelector<HTMLVideoElement>('video');
            const audioElement = document.querySelector<HTMLAudioElement>('audio');

            if (audioElement && forAudioElementOnly) {
                console.info('Updating audio stream to audio element');
                audioElement.srcObject = stream;
            }
            else if (videoElement) {
                console.info('Updating video stream to video element');
                videoElement.srcObject = stream;
            }
        }

        const mediaContainer = document.querySelector<HTMLDivElement>('.media-container')!;
        removeDeviceSelectors();

        const audioInputDevices = MediaManager.instance.getAudioInputDevices();
        const audioOutputDevices = MediaManager.instance.getAudioOutputDevices();
        const selectedAudioInputDeviceId = MediaManager.instance.currentAudioInputDeviceId;

        mediaContainer.append(getAudioInputDevicesSelectorContainer(audioInputDevices, selectedAudioInputDeviceId));
        mediaContainer.append(getAudioOutputDevicesSelectorContainer(audioOutputDevices));

        if (!forAudioElementOnly) {
            const videoInputDevices = MediaManager.instance.getVideoInputDevices();
            const selectedVideoInputDeviceId = MediaManager.instance.currentVideoInputDeviceId;

            mediaContainer.append(getVideoInputDevicesSelectorContainer(videoInputDevices, selectedVideoInputDeviceId));
        }
    });
}

function getLocalStreamVideoButton(): HTMLButtonElement {
    return getButton(`Get local video stream`, 'local-stream-video-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        disableLocalStreamAudioButton();
        enableLocalStreamButton();
        enableToggleAudioButton();
        enableToggleVideoButton();
        const stream = await MediaManager.instance.getUserMedia({ video: true, audio: true });
        const mediaContainer = document.querySelector<HTMLDivElement>('.media-container')!;
        mediaContainer.appendChild(getVideoElement(stream));
        await MediaManager.instance.enumerateDevices();
        const audioInputDevices = MediaManager.instance.getAudioInputDevices();
        const audioOutputDevices = MediaManager.instance.getAudioOutputDevices();
        const videoInputDevices = MediaManager.instance.getVideoInputDevices();
        const selectedAudioInputDeviceId = MediaManager.instance.currentAudioInputDeviceId;
        const selectedVideoInputDeviceId = MediaManager.instance.currentVideoInputDeviceId;
        mediaContainer.append(getAudioInputDevicesSelectorContainer(audioInputDevices, selectedAudioInputDeviceId));
        mediaContainer.append(getAudioOutputDevicesSelectorContainer(audioOutputDevices));
        mediaContainer.append(getVideoInputDevicesSelectorContainer(videoInputDevices, selectedVideoInputDeviceId));
        registerDeviceChangeEvents(false);

    });
}

function getLocalStreamAudioButton(): HTMLButtonElement {
    return getButton(`Get local audio stream`, 'local-stream-audio-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        disableLocalStreamVideoButton();
        enableLocalStreamButton();
        enableToggleAudioButton();
        const stream = await MediaManager.instance.getUserMedia({ audio: true });
        const mediaContainer = document.querySelector<HTMLDivElement>('.media-container')!;
        mediaContainer.appendChild(getAudioElement(stream));
        await MediaManager.instance.enumerateDevices();
        const audioInputDevices = MediaManager.instance.getAudioInputDevices();
        const audioOutputDevices = MediaManager.instance.getAudioOutputDevices();
        const selectedAudioInputDeviceId = MediaManager.instance.currentAudioInputDeviceId;
        mediaContainer.append(getAudioInputDevicesSelectorContainer(audioInputDevices, selectedAudioInputDeviceId));
        mediaContainer.append(getAudioOutputDevicesSelectorContainer(audioOutputDevices));
        registerDeviceChangeEvents(true);
    });
}

export function getMediaContainer() {
    const container = document.createElement('div');
    container.className = 'media-container';

    const heading = document.createElement('h2');
    heading.innerText = 'Media Demo';
    container.appendChild(heading);

    container.appendChild(getLocalStreamVideoButton());
    container.appendChild(getLocalStreamAudioButton());
    container.appendChild(stopLocalStreamButton());
    container.appendChild(toggleAudioButton());
    container.appendChild(toggleVideoButton());

    return container;
}