export function generateUUID() {
  return `${Math.floor(Math.random() * 100000)}${Date.now()}`;
}
