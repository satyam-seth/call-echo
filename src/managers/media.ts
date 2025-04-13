export class MediaManager {
    private static _instance: MediaManager;

    private mediaStream: MediaStream | null = null;

    private constructor() { }

    public static get instance(): MediaManager {
        if (!MediaManager._instance) {
            MediaManager._instance = new MediaManager();
        }
        return MediaManager._instance;
    }

    async getUserMedia(options: MediaStreamConstraints): Promise<MediaStream> {
        try {
            // Check if the browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser.');
            }

            // Stop any existing tracks before starting a new one
            this.stopMediaStream();

            this.mediaStream = await navigator.mediaDevices.getUserMedia(options);
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
}