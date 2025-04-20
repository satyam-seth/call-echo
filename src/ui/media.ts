import { MediaManager } from "../managers/media";

let deviceChangeCallbackId: number | null = null;
let displayStreamEndCallbackId: number | null = null;

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

function enableStopLocalUserStreamButton() {
    toggleButtonDisabled('stop-local-user-stream-btn', false);
}

function enableStopLocalDisplayStreamButton() {
    toggleButtonDisabled('stop-local-display-stream-btn', false);
}

function enableToggleUserAudioButton() {
    const button = document.querySelector<HTMLButtonElement>(`#toggle-user-audio-btn`)!;
    button.disabled = false;
    button.innerText = 'Disable User Audio';
}

function disableToggleUserAudioButton() {
    const button = document.querySelector<HTMLButtonElement>(`#toggle-user-audio-btn`)!;
    button.disabled = true;
    button.innerText = 'Enable User Audio';
}

function enableToggleUserVideoButton() {
    const button = document.querySelector<HTMLButtonElement>(`#toggle-user-video-btn`)!;
    button.disabled = false;
    button.innerText = 'Disable User Video';
}

function disableToggleUserVideoButton() {
    const button = document.querySelector<HTMLButtonElement>(`#toggle-user-video-btn`)!;
    button.disabled = true;
    button.innerText = 'Enable User Video';
}

function disableLocalUserStreamVideoButton() {
    toggleButtonDisabled('local-user-stream-video-btn', true);
}

function enableLocalUserStreamVideoButton() {
    toggleButtonDisabled('local-user-stream-video-btn', false);
}

function disableLocalUserStreamAudioButton() {
    toggleButtonDisabled('local-user-stream-audio-btn', true);
}

function enableLocalUserStreamAudioButton() {
    toggleButtonDisabled('local-user-stream-audio-btn', false);
}

function disableLocalDisplayStreamButton() {
    toggleButtonDisabled('local-display-stream-btn', true);
}

function enableLocalDisplayStreamButton() {
    toggleButtonDisabled('local-display-stream-btn', false);
}

function onToggleUserAudioButtonClick(e: MouseEvent) {
    MediaManager.instance.toggleUserTrack('audio');
    const isAudioEnabled = MediaManager.instance.isUserTrackEnabled('audio');
    (e.target as HTMLButtonElement).innerText = isAudioEnabled ? 'Disable User Audio' : 'Enable User Audio';
}

function toggleUserAudioButton() {
    return getButton('Disable User Audio', 'toggle-user-audio-btn', onToggleUserAudioButtonClick, true);
}

function onToggleUserVideoButtonClick(e: MouseEvent) {
    MediaManager.instance.toggleUserTrack('video');
    const isAudioEnabled = MediaManager.instance.isUserTrackEnabled('video');
    (e.target as HTMLButtonElement).innerText = isAudioEnabled ? 'Disable User Video' : 'Enable User Video';
}

function toggleUserVideoButton() {
    return getButton('Disable Video', 'toggle-user-video-btn', onToggleUserVideoButtonClick, true);
}

function updateUserAudioElementsStream(stream: MediaStream) {
    const audioElement = document.querySelector<HTMLAudioElement>('audio#user-audio');
    if (audioElement) {
        audioElement.srcObject = stream;
    }
}

function updateUserVideoElementsStream(stream: MediaStream) {
    const videoElement = document.querySelector<HTMLVideoElement>('video#user-video');
    if (videoElement) {
        videoElement.srcObject = stream;
    }
}

function resetUserMediaElements() {
    const videoElement = document.querySelector<HTMLVideoElement>('video#user-video');
    const audioElement = document.querySelector<HTMLAudioElement>('audio#user-audio');
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
    }
    if (audioElement) {
        audioElement.srcObject = null;
        audioElement.remove();
    }
}

function resetDisplayMediaElements() {
    const videoElement = document.querySelector<HTMLVideoElement>('video#display-video');
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
    }
}

function removeUserDeviceSelectors() {
    const audioInputDevicesSelectorContainer = document.querySelector<HTMLDivElement>('.user-audio-input-devices-selector-container');
    const audioOutputDevicesSelectorContainer = document.querySelector<HTMLDivElement>('.user-audio-output-devices-selector-container');
    const videoInputDevicesSelectorContainer = document.querySelector<HTMLDivElement>('.user-video-input-devices-selector-container');
    audioInputDevicesSelectorContainer?.remove();
    audioOutputDevicesSelectorContainer?.remove();
    videoInputDevicesSelectorContainer?.remove();
}

function stopLocalUserStreamButton(): HTMLButtonElement {
    return getButton(`Stop local user stream`, 'stop-local-user-stream-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        enableLocalUserStreamAudioButton();
        enableLocalUserStreamVideoButton();
        enableLocalDisplayStreamButton();
        disableToggleUserAudioButton();
        disableToggleUserVideoButton();
        resetUserMediaElements();
        removeUserDeviceSelectors();
        unregisterUserDeviceChangeEvent();
        MediaManager.instance.stopMediaStream();
    }, true);
}

function stopLocalDisplayStream() {
    enableLocalUserStreamAudioButton();
    enableLocalUserStreamVideoButton();
    enableLocalDisplayStreamButton();
    resetDisplayMediaElements();
    toggleDisplaySurfaceSelectorDisabled(false);
    unregisterDisplayStreamEndEvent();
    MediaManager.instance.stopDisplayStream();
}

function stopLocalDisplayStreamButton(): HTMLButtonElement {
    return getButton(`Stop local display stream`, 'stop-local-display-stream-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        stopLocalDisplayStream();
    }, true);
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

function getAudioElement(stream: MediaStream, id: string) {
    const audioElement = document.createElement('audio');
    audioElement.id = id;
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

function getUserAudioInputDevicesSelectorContainer(devices: MediaDeviceInfo[], selectedDeviceId?: string) {
    const container = document.createElement('div');
    container.className = 'user-audio-input-devices-selector-container';
    const selectorId = 'user-audio-input-devices-selector';
    const label = document.createElement('label');
    label.textContent = 'User Audio Input Devices:';
    label.setAttribute('for', selectorId);
    container.appendChild(label);

    const deviceSelector = getDevicesSelector(selectorId, devices, async (deviceId: string) => {
        await MediaManager.instance.setAudioInputDevice(deviceId, updateUserAudioElementsStream);
    }, selectedDeviceId);
    container.appendChild(deviceSelector);

    return container;
}

function getUserAudioOutputDevicesSelectorContainer(devices: MediaDeviceInfo[]) {
    const container = document.createElement('div');
    container.className = 'user-audio-output-devices-selector-container';
    const selectorId = 'user-audio-output-devices-selector';
    const label = document.createElement('label');
    label.textContent = 'Audio Output Devices:';
    label.setAttribute('for', selectorId);

    container.appendChild(label);
    container.appendChild(getDevicesSelector(selectorId, devices, async (deviceId: string) => {
        // if video element is not null then set the audio output device
        const videoElement = document.querySelector<HTMLVideoElement>('video#user-video');
        if (videoElement) {
            await MediaManager.instance.setAudioOutputDevice(videoElement, deviceId);
        }
        // if audio element is not null then set the audio output device
        const audioElement = document.querySelector<HTMLAudioElement>('audio#user-audio');
        if (audioElement) {
            await MediaManager.instance.setAudioOutputDevice(audioElement, deviceId);
        }
    }));

    return container;
}

function getDisplaySurfaceSelectorContainer() {
    const container = document.createElement('div');
    container.className = 'display-surface-selector-container';
    const selectorId = 'display-surface-selector';
    const label = document.createElement('label');
    label.textContent = 'Display Surface:';
    label.setAttribute('for', selectorId);
    container.appendChild(label);


    const displaySurfaceSelector = document.createElement('select');
    displaySurfaceSelector.id = selectorId;

    const displaySurfaceOptions = [
        { title: 'Show default sharing options', value: '' },
        { title: 'Prefer to share a browser tab', value: 'browser' },
        { title: 'Prefer to share a window', value: 'window' },
        { title: 'Prefer to share an entire screen', value: 'monitor' },
    ];

    displaySurfaceOptions.forEach(surfaceOption => {
        const option = document.createElement('option');
        option.value = surfaceOption.value;
        option.textContent = surfaceOption.title;
        displaySurfaceSelector.appendChild(option);
    });
    container.appendChild(displaySurfaceSelector);

    return container;
}

function getDisplaySurfaceSelectorValue(): string {
    const displaySurfaceSelector = document.querySelector<HTMLSelectElement>('#display-surface-selector')!;
    return displaySurfaceSelector.value;
}

function toggleDisplaySurfaceSelectorDisabled(isDisabled: boolean) {
    const displaySurfaceSelector = document.querySelector<HTMLSelectElement>('#display-surface-selector')!;
    displaySurfaceSelector.disabled = isDisabled;
}

function getUserVideoInputDevicesSelectorContainer(devices: MediaDeviceInfo[], selectedDeviceId?: string) {
    const container = document.createElement('div');
    container.className = 'user-video-input-devices-selector-container';
    const selectorId = 'user-video-input-devices-selector';
    const label = document.createElement('label');
    label.textContent = 'Video Input Devices:';
    label.setAttribute('for', selectorId);
    container.appendChild(label);

    const deviceSelector = getDevicesSelector(selectorId, devices, async (deviceId: string) => {
        await MediaManager.instance.setVideoInputDevice(deviceId, updateUserVideoElementsStream);
    }, selectedDeviceId)
    container.appendChild(deviceSelector);

    return container;
}

function unregisterUserDeviceChangeEvent() {
    if (deviceChangeCallbackId === null) return;
    MediaManager.instance.unregisterDeviceChange(deviceChangeCallbackId);
    deviceChangeCallbackId = null
}

function registerUserDeviceChangeEvent(forAudioElementOnly: boolean) {

    // on device change 
    deviceChangeCallbackId = MediaManager.instance.registerDeviceChange(async () => {
        console.log('Device changed');

        // check if stream is close then we have to get the stream again
        if (MediaManager.instance.userStream === null) {
            console.info('Media stream is null, getting new stream');
            // get the stream again
            const stream = await MediaManager.instance.getUserMedia({ video: forAudioElementOnly ? false : true, audio: true });

            const videoElement = document.querySelector<HTMLVideoElement>('video#user-video');
            const audioElement = document.querySelector<HTMLAudioElement>('audio#user-audio');

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
        removeUserDeviceSelectors();

        const audioInputDevices = MediaManager.instance.audioInputDevices;
        const audioOutputDevices = MediaManager.instance.audioOutputDevices;
        const selectedAudioInputDeviceId = MediaManager.instance.currentAudioInputDeviceId;

        mediaContainer.append(getUserAudioInputDevicesSelectorContainer(audioInputDevices, selectedAudioInputDeviceId));
        mediaContainer.append(getUserAudioOutputDevicesSelectorContainer(audioOutputDevices));

        if (!forAudioElementOnly) {
            const videoInputDevices = MediaManager.instance.videoInputDevices;
            const selectedVideoInputDeviceId = MediaManager.instance.currentVideoInputDeviceId;

            mediaContainer.append(getUserVideoInputDevicesSelectorContainer(videoInputDevices, selectedVideoInputDeviceId));
        }
    });
}

function unregisterDisplayStreamEndEvent() {
    if (displayStreamEndCallbackId === null) return;
    MediaManager.instance.unregisterDisplayStreamEnd(displayStreamEndCallbackId);
    displayStreamEndCallbackId = null
}

function registerDisplayStreamEndEvent() {
    if (MediaManager.instance.displayStream !== null) {
        // on display stream end 
        displayStreamEndCallbackId = MediaManager.instance.registerDisplayStreamEnd(async () => {
            console.log('Display stream end');
            stopLocalDisplayStream();
        });
    }
}

function getLocalUserStreamVideoButton(): HTMLButtonElement {
    return getButton(`Get local user video stream`, 'local-user-stream-video-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        disableLocalUserStreamAudioButton();
        disableLocalDisplayStreamButton();

        let stream: MediaStream;
        try {
            stream = await MediaManager.instance.getUserMedia({ video: true, audio: true });
        } catch (err) {
            (e.target as HTMLButtonElement).disabled = false;
            enableLocalUserStreamAudioButton();
            enableLocalDisplayStreamButton();

            if (err.name === 'NotAllowedError') {
                window.alert('User denied permission to share video');
            } else {
                window.alert('Failed to get video stream: ' + err);
            }
            return;
        }

        const mediaContainer = document.querySelector<HTMLDivElement>('.media-container')!;
        mediaContainer.appendChild(getVideoElement(stream, 'user-video'));

        await MediaManager.instance.enumerateDevices();
        const audioInputDevices = MediaManager.instance.audioInputDevices;
        const audioOutputDevices = MediaManager.instance.audioOutputDevices;
        const videoInputDevices = MediaManager.instance.videoInputDevices;
        const selectedAudioInputDeviceId = MediaManager.instance.currentAudioInputDeviceId;
        const selectedVideoInputDeviceId = MediaManager.instance.currentVideoInputDeviceId;
        mediaContainer.append(getUserAudioInputDevicesSelectorContainer(audioInputDevices, selectedAudioInputDeviceId));
        mediaContainer.append(getUserAudioOutputDevicesSelectorContainer(audioOutputDevices));
        mediaContainer.append(getUserVideoInputDevicesSelectorContainer(videoInputDevices, selectedVideoInputDeviceId));

        registerUserDeviceChangeEvent(false);
        enableStopLocalUserStreamButton();
        enableToggleUserAudioButton();
        enableToggleUserVideoButton();
    });
}

function getLocalUserStreamAudioButton(): HTMLButtonElement {
    return getButton(`Get local user audio stream`, 'local-user-stream-audio-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        disableLocalUserStreamVideoButton();
        disableLocalDisplayStreamButton();

        let stream: MediaStream;
        try {
            stream = await MediaManager.instance.getUserMedia({ audio: true });
        } catch (err) {
            (e.target as HTMLButtonElement).disabled = false;
            enableLocalUserStreamVideoButton();
            enableLocalDisplayStreamButton();

            if (err.name === 'NotAllowedError') {
                window.alert('User denied permission to share audio');
            } else {
                window.alert('Failed to get audio stream: ' + err);
            }
            return;
        }

        const mediaContainer = document.querySelector<HTMLDivElement>('.media-container')!;
        mediaContainer.appendChild(getAudioElement(stream, 'user-audio'));

        await MediaManager.instance.enumerateDevices();
        const audioInputDevices = MediaManager.instance.audioInputDevices;
        const audioOutputDevices = MediaManager.instance.audioOutputDevices;
        const selectedAudioInputDeviceId = MediaManager.instance.currentAudioInputDeviceId;
        mediaContainer.append(getUserAudioInputDevicesSelectorContainer(audioInputDevices, selectedAudioInputDeviceId));
        mediaContainer.append(getUserAudioOutputDevicesSelectorContainer(audioOutputDevices));

        registerUserDeviceChangeEvent(true);
        enableStopLocalUserStreamButton();
        enableToggleUserAudioButton();
    });
}

function getLocalDisplayStreamButton(): HTMLButtonElement {
    return getButton(`Get local display stream`, 'local-display-stream-btn', async (e: Event) => {
        (e.target as HTMLButtonElement).disabled = true;
        disableLocalUserStreamVideoButton();
        disableLocalUserStreamAudioButton();
        toggleDisplaySurfaceSelectorDisabled(true);

        const options = { video: true, audio: true };
        const displaySurface = getDisplaySurfaceSelectorValue();
        if (displaySurface !== '') {
            options.video = { displaySurface };
        }

        let stream: MediaStream;
        try {
            stream = await MediaManager.instance.getDisplayMedia(options);
        } catch (err) {
            (e.target as HTMLButtonElement).disabled = false;
            enableLocalUserStreamVideoButton();
            enableLocalUserStreamAudioButton();
            toggleDisplaySurfaceSelectorDisabled(false);

            if (err.name === 'NotAllowedError') {
                window.alert('User denied permission to share display');
            } else {
                window.alert('Failed to get display stream: ' + err);
            }
            return;
        }

        const mediaContainer = document.querySelector<HTMLDivElement>('.media-container')!;
        mediaContainer.appendChild(getVideoElement(stream, 'display-video'));

        registerDisplayStreamEndEvent();
        enableStopLocalDisplayStreamButton();
    });
}

export function getMediaContainer() {
    const container = document.createElement('div');
    container.className = 'media-container';

    const heading = document.createElement('h2');
    heading.innerText = 'Media Demo';
    container.appendChild(heading);

    container.appendChild(getLocalUserStreamVideoButton());
    container.appendChild(getLocalUserStreamAudioButton());
    container.appendChild(stopLocalUserStreamButton());
    container.appendChild(toggleUserAudioButton());
    container.appendChild(toggleUserVideoButton());

    container.appendChild(getLocalDisplayStreamButton());
    container.appendChild(stopLocalDisplayStreamButton());
    container.appendChild(getDisplaySurfaceSelectorContainer());

    return container;
}