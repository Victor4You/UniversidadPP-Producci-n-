// main.js
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendProcess;

function startBackend() {
  const isProd = app.isPackaged;
  // En producción, el backend estará dentro de la carpeta de la app
  const backendDir = isProd 
    ? path.join(process.resourcesPath, 'backend') 
    : path.resolve(__dirname, '../backend');

  const nodeExe = process.execPath;
  // Si es prod, ejecutamos el JS compilado. Si es dev, el nest.js
  const scriptPath = isProd
    ? path.join(backendDir, 'dist', 'main.js')
    : path.join(backendDir, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

  const args = isProd ? [scriptPath] : [scriptPath, 'start'];

  backendProcess = spawn(nodeExe, args, {
    cwd: backendDir,
    shell: false,
    env: { ...process.env }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Universidad Puro Pollo",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
  });

  // Ignorar ruidos de SSL en la consola
 win.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});

  const startURL = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'out/index.html')}`;

  win.loadURL(startURL).catch(() => {
    setTimeout(() => win.loadURL(startURL), 5000);
  });
}

app.whenReady().then(() => {
  //startBackend();
  setTimeout(createWindow, 4000);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});