import { PermissionManager } from "./managers/permission";

const PERMISSIONS: PermissionName[] = [
  'microphone',
  'camera',
  'geolocation',
  'notifications',
]

function getButton(innerText: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.innerText = innerText;
  button.addEventListener('click', onClick)
  return button;
}

function getPermissionStatusButton(permissionName: PermissionName): HTMLButtonElement {
  return getButton(`Get ${permissionName} permission Status`, async () => {
    const status = await PermissionManager.queryPermissionStatus(permissionName);
    if (status) {
      alert(`Permission ${permissionName} status: ${status}`);
    } else {
      alert(`Permission ${permissionName} is not supported or an error occurred.`);
    }
  });
}

function getPermissionCheckButton(permissionName: PermissionName): HTMLButtonElement {
  return getButton(`Check have ${permissionName} permission or not`, async () => {
    const granted = await PermissionManager.checkPermission(permissionName);
    if (granted) {
      alert(`Have ${permissionName} permission.`);
    } else {
      alert(`Do not have ${permissionName} Permission.`);
    }
  });
}

function watchPermissionStateButton(permissionName: PermissionName): HTMLButtonElement {
  return getButton(`Watch ${permissionName} permission state`, async () => {
    await PermissionManager.watchPermissionState(permissionName, (state) => {
      alert(`Permission ${permissionName} state changed to: ${state}`);
    });
  });
}

export function getPermissionContainer() {
  const container = document.createElement('div');
  container.className = 'permission-container';

  PERMISSIONS.forEach(permissionName => {
    const permissionSection = document.createElement('div');
    permissionSection.className = 'permission-section';
    permissionSection.innerHTML = `<h3>${permissionName}</h3>`;
    permissionSection.appendChild(getPermissionStatusButton(permissionName));
    permissionSection.appendChild(getPermissionCheckButton(permissionName));
    permissionSection.appendChild(watchPermissionStateButton(permissionName));
    container.appendChild(permissionSection);
  });

  return container;
} 