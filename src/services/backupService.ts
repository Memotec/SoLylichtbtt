import { Equipment } from '../types';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  dateFormatted: string;
  equipmentsCount: number;
  note: string;
  source: 'auto_sync' | 'manual' | 'pre_restore' | 'import';
  equipments: Equipment[];
}

export const BACKUP_STORAGE_KEY = 'cns_vatm_equipment_backups_v1';
const MAX_BACKUPS = 30;

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  const secs = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
}

/**
 * Get list of all backup snapshots sorted by newest first
 */
export function getBackupHistory(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) return [];
    const parsed: BackupSnapshot[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error('Failed to load backup history:', e);
    return [];
  }
}

/**
 * Create and save a new backup snapshot
 */
export function createBackupSnapshot(
  equipments: Equipment[],
  note: string = 'Sao lưu thủ công',
  source: BackupSnapshot['source'] = 'manual'
): BackupSnapshot {
  const now = new Date();
  const snapshot: BackupSnapshot = {
    id: `BK-${now.getTime()}`,
    timestamp: now.toISOString(),
    dateFormatted: formatDateTime(now),
    equipmentsCount: Array.isArray(equipments) ? equipments.length : 0,
    note,
    source,
    equipments: Array.isArray(equipments) ? JSON.parse(JSON.stringify(equipments)) : []
  };

  try {
    const existing = getBackupHistory();
    // Prepend new backup
    const updated = [snapshot, ...existing].slice(0, MAX_BACKUPS);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save backup snapshot:', e);
  }

  return snapshot;
}

/**
 * Delete a specific backup snapshot by ID
 */
export function deleteBackupSnapshot(backupId: string): BackupSnapshot[] {
  try {
    const existing = getBackupHistory();
    const filtered = existing.filter(b => b.id !== backupId);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error('Failed to delete backup snapshot:', e);
    return getBackupHistory();
  }
}

/**
 * Clear all backup history
 */
export function clearAllBackups(): void {
  try {
    localStorage.removeItem(BACKUP_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear backups:', e);
  }
}

/**
 * Download snapshot as JSON file
 */
export function exportBackupAsJson(snapshot: BackupSnapshot): void {
  const dataStr = JSON.stringify(snapshot.equipments, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeDate = snapshot.dateFormatted.replace(/[/ :]/g, '_');
  link.href = url;
  link.download = `SaoLuu_ThietBi_CNS_VATM_${safeDate}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
