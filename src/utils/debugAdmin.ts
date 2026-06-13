export const adminDebugSettingsKey = "sayhi-admin-debug-settings";

export type AdminDebugSettings = {
  captureAlwaysSuccess: boolean;
  nextTrainingEnemyId: string;
};

const defaultSettings: AdminDebugSettings = {
  captureAlwaysSuccess: false,
  nextTrainingEnemyId: ""
};

export function loadAdminDebugSettings(): AdminDebugSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(adminDebugSettingsKey);
    return { ...defaultSettings, ...(raw ? JSON.parse(raw) as Partial<AdminDebugSettings> : {}) };
  } catch {
    return defaultSettings;
  }
}

export function saveAdminDebugSettings(settings: AdminDebugSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(adminDebugSettingsKey, JSON.stringify({ ...defaultSettings, ...settings }));
  window.dispatchEvent(new CustomEvent("sayhiAdminDebugSettingsUpdated"));
}
