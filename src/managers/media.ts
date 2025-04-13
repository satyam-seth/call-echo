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

    stopMediaStream() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }
}