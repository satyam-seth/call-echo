import './style.css';
import { getPermissionContainer } from './ui/permission.ts';
import { getMediaContainer } from './ui/media.ts';

const app = document.querySelector<HTMLDivElement>('#app')!

// Append the permission container to the app
app.appendChild(getPermissionContainer());

// Append the media demo button to the app
app.appendChild(getMediaContainer());
