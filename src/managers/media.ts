// https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API

// TODO: Add support for groupId in constraints and selecting devices by groupId
// https://www.webrtc-developers.com/managing-devices-in-webrtc/#grouping-devices-together

// TODO: Add support for output devices change detection, current implementation only supports input devices change detection

// TODO: Add support for replace track for audio and video tracks and notify the change to the stream for smooth switching between input devices
// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/replaceTrack

// TODO: Add support for screen sharing
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia

// TODO: Add support for media stream recording
// https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

export class MediaManager {
    private static _instance: MediaManager;

    private _userConstraints?: MediaStreamConstraints;
    private _displayConstraints?: MediaStreamConstraints;

    private _userStream: MediaStream | null = null;
    private _displayStream: MediaStream | null = null;

    private _audioInputDevices: MediaDeviceInfo[] = [];
    private _audioOutputDevices: MediaDeviceInfo[] = [];
    private _videoInputDevices: MediaDeviceInfo[] = [];

    private nextCallbackId = 0;
    private deviceChangeCallbacks: Map<number, () => Promise<void>> = new Map();

    private constructor() {
        // start listening for device changes
        this.startListeningToDeviceChanges();
    }

    public static get instance(): MediaManager {
        if (!MediaManager._instance) {
            MediaManager._instance = new MediaManager();
        }
        return MediaManager._instance;
    }

    async getDisplayMedia(options?: MediaStreamConstraints): Promise<MediaStream> {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('getDisplayMedia is not supported in this browser.');
            }

            // Stop any existing display stream
            this.stopDisplayStream();

            this._displayConstraints = options;
            this._displayStream = await navigator.mediaDevices.getDisplayMedia(this._displayConstraints);
            return this._displayStream;
        } catch (error) {
            console.error('Error accessing display media.', error);
            throw error;
        }
    }

    // Stops all tracks in the display stream
    stopDisplayStream() {
        this._displayStream?.getTracks().forEach(track => track.stop());
        this._displayStream = null;
    }

    // Get the current display stream
    get displayStream(): MediaStream | null {
        return this._displayStream;
    }


    // Get the current display stream constraints
    get displayStreamConstraints(): MediaStreamConstraints | undefined {
        return this._displayConstraints;
    }

    // Check if the display stream is active
    get displayStreamActive(): boolean {
        return !!this._displayStream && this._displayStream.getTracks().some(track => track.readyState === 'live');
    }

    async getUserMedia(options?: MediaStreamConstraints): Promise<MediaStream> {
        try {
            // Check if the browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser.');
            }

            // Stop any existing tracks before starting a new one
            this.stopMediaStream();

            this._userConstraints = options;
            this._userStream = await navigator.mediaDevices.getUserMedia(this._userConstraints);

            return this._userStream;
        }
        catch (error) {
            console.error('Error accessing media devices.', error);
            throw error;
        }
    }

    // Stops all tracks in the media stream
    stopMediaStream() {
        this._userStream?.getTracks().forEach(track => track.stop());
        this._userStream = null;
    }

    // Toggles a track's enabled state (for audio or video)
    toggleTrack(trackType: 'audio' | 'video') {
        this._userStream?.getTracks().forEach(track => {
            if (track.kind === trackType) {
                track.enabled = !track.enabled;
            }
        });
    }

    // Enable all tracks of a specific type
    enableTrack(trackType: 'audio' | 'video') {
        this._userStream?.getTracks().forEach(track => {
            if (track.kind === trackType) {
                track.enabled = true;
            }
        });
    }

    // Disable all tracks of a specific type
    disableTrack(trackType: 'audio' | 'video') {
        this._userStream?.getTracks().forEach(track => {
            if (track.kind === trackType) {
                track.enabled = false;
            }
        });
    }

    // Check if any track of a specific type is enabled
    isTrackEnabled(trackType: 'audio' | 'video'): boolean {
        return this._userStream?.getTracks().some(track => track.kind === trackType && track.enabled) ?? false;
    }

    // Get the current user stream
    get userStream(): MediaStream | null {
        return this._userStream;
    }

    // Get the current user stream constraints
    get userStreamConstraints(): MediaStreamConstraints | undefined {
        return this._userConstraints;
    }

    // Enumerate devices (input and output)
    async enumerateDevices(): Promise<MediaDeviceInfo[] | undefined> {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new Error('enumerateDevices is not supported in this browser.');
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this._audioInputDevices = devices.filter(device => device.kind === "audioinput");
            this._videoInputDevices = devices.filter(device => device.kind === "videoinput");
            this._audioOutputDevices = devices.filter(device => device.kind === "audiooutput");
            return devices;
        } catch (err) {
            console.error("Error enumerating devices:", err);
            throw err;
        }
    }

    // Get audio input devices
    get audioInputDevices(): MediaDeviceInfo[] {
        return this._audioInputDevices;
    }

    // Get audio output devices
    get audioOutputDevices(): MediaDeviceInfo[] {
        return this._audioOutputDevices;
    }

    // Get video input devices
    get videoInputDevices(): MediaDeviceInfo[] {
        return this._videoInputDevices;
    }

    // Set input device
    async setInputDevice(constraints: MediaStreamConstraints, onStream: (stream: MediaStream) => void): Promise<void> {
        // check if previous stream is null or not and any track is disabled then we have to disable the track in new stream
        let audioTrackEnabled = true;
        let videoTrackEnabled = true;
        if (this._userStream) {
            audioTrackEnabled = this.isTrackEnabled('audio');
            videoTrackEnabled = this.isTrackEnabled('video');
        }

        try {
            const stream = await this.getUserMedia(constraints);

            // Disable the tracks based on the previous stream state, by default all tracks are enabled
            if (!audioTrackEnabled) {
                this.disableTrack('audio');
            }
            if (!videoTrackEnabled) {
                this.disableTrack('video');
            }

            onStream(stream);
        } catch (error) {
            console.error('Error setting update input device:', error);
        }
    }

    // Set input device for audio
    async setAudioInputDevice(deviceId: string, onStream: (stream: MediaStream) => void): Promise<boolean> {
        const constraints: MediaStreamConstraints = { ...this._userConstraints, audio: { deviceId: { exact: deviceId } } };
        try {
            await this.setInputDevice(constraints, onStream);
            return true;
        } catch (error) {
            console.error('Error setting audio input device:', error);
            return false;
        }
    }

    // Set input device for video
    async setVideoInputDevice(deviceId: string, onStream: (stream: MediaStream) => void): Promise<boolean> {
        const constraints: MediaStreamConstraints = { ...this._userConstraints, video: { deviceId: { exact: deviceId } } };
        try {
            await this.setInputDevice(constraints, onStream);
            return true;
        } catch (error) {
            console.error('Error setting video input device:', error);
            return false;
        }
    }

    // TODO: verify if this is working in all browsers and platforms
    async setAudioOutputDevice(element: HTMLAudioElement | HTMLVideoElement, deviceId: string): Promise<boolean> {
        if (typeof element.sinkId !== 'undefined') {
            try {
                console.log('Setting audio output device to:', deviceId);
                await element.setSinkId(deviceId);
            } catch (error: any) {

                let errorMessage = error;
                if (error.name === 'SecurityError') {
                    errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                }
                console.error(errorMessage);
            }

            return true;
        } else {
            console.warn('Browser does not support output device selection.');
            return false;
        }
    }

    get currentAudioInputDeviceId(): string | undefined {
        return this._userStream?.getAudioTracks()[0]?.getSettings().deviceId;
    }

    get currentVideoInputDeviceId(): string | undefined {
        return this._userStream?.getVideoTracks()[0]?.getSettings().deviceId;
    }

    registerDeviceChange(callback: () => Promise<void>): number {
        const id = this.nextCallbackId++;
        this.deviceChangeCallbacks.set(id, callback);

        // Return callback id for unsubscribing
        return id;
    }

    unregisterDeviceChange(callbackId: number): void {
        this.deviceChangeCallbacks.delete(callbackId);
    }

    private notifyDeviceChange(): void {
        console.log("Notifying device change callbacks.", this.deviceChangeCallbacks.size);

        for (const cb of this.deviceChangeCallbacks.values()) {
            cb();
        }
    }

    // Start listening to device changes
    async startListeningToDeviceChanges(): Promise<void> {
        if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) {
            console.warn("Device change events are not supported in this browser.");
            return;
        }

        navigator.mediaDevices.addEventListener('devicechange', async () => {
            console.log("Device change detected.");
            await this.enumerateDevices();

            // should restart stream if the current device is not available
            if (this._userStream) {
                const audioInputDevice = this.currentAudioInputDeviceId;
                const videoInputDevice = this.currentVideoInputDeviceId;

                if ((audioInputDevice && !this._audioInputDevices.some(device => device.deviceId === audioInputDevice)) || (videoInputDevice && !this._videoInputDevices.some(device => device.deviceId === videoInputDevice))) {
                    this.stopMediaStream();
                }
            }

            this.notifyDeviceChange();
        });
    }
}