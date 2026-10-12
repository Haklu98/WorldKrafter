// Optional Steamworks integration via steamworks.js.
// Everything is wrapped in try/catch so the app still launches outside Steam
// (or before you've installed the package).
let client = null;
let lastError = null;

function init() {
  try {
    const steamworks = require('steamworks.js');
    // With no argument it reads steam_appid.txt during development.
    // For release, pass your real App ID explicitly: steamworks.init(1234567)
    client = steamworks.init();
    // Enables the Steam overlay (Shift+Tab) in Electron.
    // Check the steamworks.js README for any extra flags your Electron version needs.
    steamworks.electronEnableSteamOverlay();
  } catch (err) {
    client = null;
    lastError = err && err.message ? err.message : String(err);
  }
}

function status() {
  if (!client) return { available: false, reason: lastError || 'Not initialized' };
  return { available: true, userName: client.localplayer.getName() };
}

module.exports = { init, status };
