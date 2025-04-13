export class MediaManager {
    private static _instance: MediaManager;

    private mediaStream: MediaStream | null = null;

    private audioInputDevices: MediaDeviceInfo[] = [];
    private audioOutputDevices: MediaDeviceInfo[] = [];
    private videoInputDevices: MediaDeviceInfo[] = [];

    private constraints?: MediaStreamConstraints;

    private constructor() { }

    public static get instance(): MediaManager {
        if (!MediaManager._instance) {
            MediaManager._instance = new MediaManager();
        }
        return MediaManager._instance;
    }

    async getUserMedia(options?: MediaStreamConstraints): Promise<MediaStream> {
        try {
            // Check if the browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser.');
            }

            // Stop any existing tracks before starting a new one
            this.stopMediaStream();

            this.constraints = options;
            this.mediaStream = await navigator.mediaDevices.getUserMedia(this.constraints);
            return this.mediaStream;
        }
        catch (error) {
            console.error('Error accessing media devices.', error);
            throw error;
        }
    }

    // Stops all tracks in the media stream
    stopMediaStream() {
        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
    }

    // Toggles a track's enabled state (for audio or video)
    toggleTrack(trackType: 'audio' | 'video') {
        this.mediaStream?.getTracks().forEach(track => {
            if (track.kind === trackType) {
                track.enabled = !track.enabled;
            }
        });
    }

    // Enable all tracks of a specific type
    enableTrack(trackType: 'audio' | 'video') {
        this.mediaStream?.getTracks().forEach(track => {
            if (track.kind === trackType) {
                track.enabled = true;
            }
        });
    }

    // Disable all tracks of a specific type
    disableTrack(trackType: 'audio' | 'video') {
        this.mediaStream?.getTracks().forEach(track => {
            if (track.kind === trackType) {
                track.enabled = false;
            }
        });
    }

    // Check if any track of a specific type is enabled
    isTrackEnabled(trackType: 'audio' | 'video'): boolean {
        return this.mediaStream?.getTracks().some(track => track.kind === trackType && track.enabled) ?? false;
    }

    // Get the current media stream
    getMediaStream(): MediaStream | null {
        return this.mediaStream;
    }

    // Enumerate devices (input and output)
    async enumerateDevices(): Promise<MediaDeviceInfo[] | undefined> {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new Error('enumerateDevices is not supported in this browser.');
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.audioInputDevices = devices.filter(device => device.kind === "audioinput")
            this.videoInputDevices = devices.filter(device => device.kind === "videoinput");
            this.audioOutputDevices = devices.filter(device => device.kind === "audiooutput");
            return devices;
        } catch (err) {
            console.error("Error enumerating devices:", err);
            throw err;
        }
    }

    // Get audio input devices
    getAudioInputDevices(): MediaDeviceInfo[] {
        return this.audioInputDevices;
    }

    // Get audio output devices
    getAudioOutputDevices(): MediaDeviceInfo[] {
        return this.audioOutputDevices;
    }

    // Get video input devices
    getVideoInputDevices(): MediaDeviceInfo[] {
        return this.videoInputDevices;
    }

    // Set input device for audio
    async setAudioInputDevice(deviceId: string, onStream: (stream: MediaStream) => void): Promise<void> {
        const constraints: MediaStreamConstraints = { ...this.constraints, audio: { deviceId: { exact: deviceId } } };

        try {
            const stream = await this.getUserMedia(constraints);
            onStream(stream);
        } catch (error) {
            console.error('Error setting audio input device:', error);
        }
    }
}