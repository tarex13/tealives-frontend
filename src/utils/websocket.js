// src/utils/websocket.js

export function createWebSocket(pathWithLeadingSlash, token = null) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  const port = '8000'; // Must match your ASGI/Daphne backend port
  const basePath = `${protocol}://${host}:${port}${pathWithLeadingSlash}`;

  if (token) {
    return new WebSocket(`${basePath}?token=${token}`);
  }
  return new WebSocket(basePath);
}
