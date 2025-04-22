// TODO: Add support to record and download in specific formats

// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
export class RecordingManager {
    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private recordingBlob: Blob | null = null;
    private dataCallback: ((blob: Blob) => void) | null = null;
    private stopCallback: ((finalBlob: Blob) => void) | null = null;

    start(stream: MediaStream): void {
        this.mediaRecorder = new MediaRecorder(stream);
        this.chunks = [];

        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
            if (e.data && e.data.size > 0) {
                this.chunks.push(e.data);
                this.dataCallback?.(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const finalBlob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType });
            this.stopCallback?.(finalBlob);
        };

        this.mediaRecorder.start();
    }

    stop(): Promise<Blob> {
        return new Promise((resolve) => {
            if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
                this.mediaRecorder.onstop = () => {
                    this.recordingBlob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType });
                    this.stopCallback?.(this.recordingBlob);
                    resolve(this.recordingBlob);
                };
                this.mediaRecorder.stop();
            } else {
                resolve(new Blob()); // Return empty blob if not recording
            }
        });
    }

    pause(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.pause();
        }
    }

    resume(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
            this.mediaRecorder.resume();
        }
    }

    get mimeType(): string | undefined {
        return this.mediaRecorder?.mimeType;
    }

    get recordingState(): RecordingState | undefined {
        return this.mediaRecorder?.state;
    }

    onData(callback: (blob: Blob) => void): void {
        this.dataCallback = callback;
    }

    onStop(callback: (finalBlob: Blob) => void): void {
        this.stopCallback = callback;
    }

    get chunksBlob(): Blob {
        return new Blob(this.chunks, { type: this.mediaRecorder?.mimeType });
    }

    mimeTypeToFileExtension(mimeType: string): string {
        const value = mimeType.split(';', 1)[0]

        switch (value) {
            case 'video/mp4':
                return 'mp4';
            case 'video/webm':
                return 'webm';
            case 'video/x-matroska':
                return 'mkv';
            default:
                throw new Error(`unsupported mimetype: ${mimeType}`);
        }
    }

    download(filename: string): void {
        if (!(this.recordingBlob && this.mediaRecorder?.mimeType)) return;

        const url = URL.createObjectURL(this.recordingBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.${this.mimeTypeToFileExtension(this.mediaRecorder.mimeType)}`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
