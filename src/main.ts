import './style.css'
import { getPermissionContainer } from './pemissionsDemo.ts'

const app = document.querySelector<HTMLDivElement>('#app')!

// Append the permission container to the app
app.appendChild(getPermissionContainer());