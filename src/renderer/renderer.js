(async () => {
  const info = await window.api.getAppInfo();
  document.getElementById('info').textContent =
    `${info.name} v${info.version} on ${info.platform}`;
})();
