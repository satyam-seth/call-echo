// https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API
export class PermissionManager {
    // Query the current permission status (granted, denied, prompt)
    static async queryPermissionStatus(permissionName: PermissionName): Promise<PermissionState | null> {
        if ('permissions' in navigator === false) {
            console.warn(`Permission '${permissionName}' is not supported by this browser.`);
            return null;
        }

        try {
            const status = await navigator.permissions.query({ name: permissionName });
            return status.state;
        } catch (error) {
            console.error(`Error querying permission '${permissionName}':`, error);
            return null;
        }
    }


    // To check permission is granted or not
    static async checkPermission(permissionName: PermissionName): Promise<boolean> {
        try {
            const status = await this.queryPermissionStatus(permissionName);
            if (status === 'granted') {
                return true;
            } else if (status === 'prompt') {
                // Native permission prompts are usually triggered by specific API calls (e.g., Notification.requestPermission)
                console.warn(`Permission '${permissionName}' requires a specific API call to trigger the prompt.`);
                return false;
            }
            return false;
        } catch (error) {
            console.error(`Error checking permission '${permissionName}':`, error);
            return false;
        }
    }

    // Watch for permission state changes
    static async watchPermissionState(permissionName: PermissionName, callback: (state: PermissionState) => void): Promise<void> {
        if ('permissions' in navigator === false) {
            console.warn(`Permission '${permissionName}' is not supported by this browser.`);
            return;
        }

        try {
            const status = await navigator.permissions.query({ name: permissionName });
            callback(status.state);

            status.onchange = () => {
                callback(status.state);
            };
        } catch (error) {
            console.error(`Error watching permission '${permissionName}':`, error);
        }
    }
}
