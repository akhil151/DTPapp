import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '@/lib/query-client';

export interface Alert {
  id: string;
  timestamp: string;
  confidence: number;
  image_url: string;
  latitude: number;
  longitude: number;
}

export interface Settings {
  cameraUrl: string;
  notificationsEnabled: boolean;
}

interface AlertsContextValue {
  alerts: Alert[];
  settings: Settings;
  isOnline: boolean;
  isLoading: boolean;
  refreshAlerts: () => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  clearAlerts: () => Promise<void>;
}

const ALERTS_KEY = '@elephant_alerts';
const SETTINGS_KEY = '@elephant_settings';

const DEFAULT_SETTINGS: Settings = {
  cameraUrl: '',
  notificationsEnabled: true,
};

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedAlerts, storedSettings] = await Promise.all([
          AsyncStorage.getItem(ALERTS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (storedAlerts) setAlerts(JSON.parse(storedAlerts));
        if (storedSettings)
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      } catch (e) {
        console.error('Failed to load stored data:', e);
      }
    })();
  }, []);

  const refreshAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('GET', '/api/alerts');
      const data: Alert[] = await res.json();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setAlerts(sorted);
      setIsOnline(true);
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(sorted));
    } catch {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 10000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    },
    [settings],
  );

  const clearAlerts = useCallback(async () => {
    setAlerts([]);
    await AsyncStorage.removeItem(ALERTS_KEY);
    try {
      await apiRequest('DELETE', '/api/alerts');
    } catch {
      // ignore if offline
    }
  }, []);

  const value = useMemo(
    () => ({
      alerts,
      settings,
      isOnline,
      isLoading,
      refreshAlerts,
      updateSettings,
      clearAlerts,
    }),
    [
      alerts,
      settings,
      isOnline,
      isLoading,
      refreshAlerts,
      updateSettings,
      clearAlerts,
    ],
  );

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts must be used within AlertsProvider');
  return context;
}
