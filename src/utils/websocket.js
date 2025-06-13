// src/utils/websocket.js

export function createWebSocket(pathWithLeadingSlash, token = null) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host     = window.location.hostname;
  const port     = '8000';
  const basePath = `${protocol}://${host}:${port}${pathWithLeadingSlash}`;
  const url      = token
    ? `${basePath}?token=${token}`
    : basePath;
  return new WebSocket(url);
}