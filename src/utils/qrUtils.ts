import QRCode from 'qrcode';
import { Equipment } from '../types';

/**
 * Builds the standard deep-link URL or identifier payload for an equipment
 */
export function generateEquipmentQrUrl(equipment: Equipment): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return `${origin}${pathname}?equipmentId=${encodeURIComponent(equipment.id)}&action=pdf`;
}

/**
 * Generates a base64 Data URL for a QR Code
 */
export async function generateEquipmentQrDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: 320,
    color: {
      dark: '#0f172a', // Slate 900
      light: '#ffffff'
    }
  };

  try {
    return await QRCode.toDataURL(text, { ...defaultOptions, ...options });
  } catch (err) {
    console.error('Error generating QR code data URL:', err);
    throw err;
  }
}

/**
 * Finds an equipment matching the scanned QR code content.
 * Supports:
 * - Direct deep-link URLs (e.g. ?equipmentId=... or ?id=...)
 * - Structured prefixes (e.g. "VATM:id", "EQUIPMENT:id")
 * - Exact equipment ID
 * - Serial number (S/N)
 * - Booklet number or Asset number
 * - Substring matches
 */
export function findEquipmentByQrCode(code: string, equipments: Equipment[]): Equipment | null {
  if (!code || !equipments.length) return null;
  const trimmed = code.trim();

  // 1. Check if it's a URL with query parameters
  try {
    if (trimmed.includes('?') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(
        trimmed.startsWith('http://') || trimmed.startsWith('https://') 
          ? trimmed 
          : `https://dummy.cns.vatm/${trimmed.startsWith('?') ? trimmed : '?' + trimmed}`
      );
      const eqId = url.searchParams.get('equipmentId') || url.searchParams.get('id') || url.searchParams.get('eq');
      if (eqId) {
        const found = equipments.find(e => e.id.toLowerCase() === eqId.toLowerCase());
        if (found) return found;
      }
    }
  } catch {
    // Ignore URL parse errors
  }

  // 2. Check prefixed formats e.g. "VATM:id", "EQUIPMENT:id", "CNS:id"
  const prefixMatch = trimmed.match(/^(?:vatm|equipment|cns|so_ly_lich|profile)[:=]([a-zA-Z0-9_-]+)/i);
  if (prefixMatch && prefixMatch[1]) {
    const candidateId = prefixMatch[1].toLowerCase();
    const found = equipments.find(e => e.id.toLowerCase() === candidateId);
    if (found) return found;
  }

  // 3. Exact match by Equipment ID
  const directId = equipments.find(e => e.id.toLowerCase() === trimmed.toLowerCase());
  if (directId) return directId;

  // 4. Exact match by Serial Number
  const serialMatch = equipments.find(
    e => e.general.serial && e.general.serial.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (serialMatch) return serialMatch;

  // 5. Match by Asset Number or Booklet Number
  const assetOrBooklet = equipments.find(e => 
    (e.general.assetNo && e.general.assetNo.trim().toLowerCase() === trimmed.toLowerCase()) ||
    (e.general.bookletNo && e.general.bookletNo.trim().toLowerCase() === trimmed.toLowerCase())
  );
  if (assetOrBooklet) return assetOrBooklet;

  // 6. Substring match: If scanned text contains an equipment ID or Serial
  for (const eq of equipments) {
    if (eq.id && trimmed.includes(eq.id)) return eq;
    if (eq.general.serial && eq.general.serial.length >= 4 && trimmed.includes(eq.general.serial)) {
      return eq;
    }
  }

  return null;
}

/**
 * Synthesizes a crisp electronic chime upon successful QR scan
 */
export function playBeepSuccess() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.setValueAtTime(1320, now + 0.08); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  } catch (err) {
    // Audio might not play if user hasn't interacted yet
  }
}
