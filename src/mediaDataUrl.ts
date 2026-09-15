export function dataUrlDecodedSize(dataUrl: string) {
  const base64Marker = ';base64,'
  const markerIndex = dataUrl.toLowerCase().indexOf(base64Marker)
  if (markerIndex < 0) return -1

  const payload = dataUrl.slice(markerIndex + base64Marker.length)
  if (!payload || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) return -1

  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
  return Math.floor((payload.length * 3) / 4) - padding
}
