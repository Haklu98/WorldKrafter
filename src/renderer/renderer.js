(async () => {
  const info = await window.api.getAppInfo();
  document.getElementById('info').textContent =
    `${info.name} v${info.version} on ${info.platform}`;

  const steam = await window.api.getSteamStatus();
  document.getElementById('steam').textContent = steam.available
    ? `Steam connected as ${steam.userName}`
    : `Steam not available (${steam.reason})`;
})();
