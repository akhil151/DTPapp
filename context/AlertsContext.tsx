import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '@/lib/query-client';
import { speakAlert } from '@/services/ttsService';

export interface Alert {
  id: string;
  timestamp: string;
  confidence: number;
  image_url: string;
  latitude: number;
  longitude: number;
}

export interface Node {
  id: string;
  node_id: string;
  latitude: number;
  longitude: number;
  last_detection_timestamp: string | null;
  is_active: boolean;
}

export interface Settings {
  cameraUrl: string;
  notificationsEnabled: boolean;
}

export interface VoiceSettings {
  enabled: boolean;
  language: 'en' | 'hi' | 'ta';
}

interface AlertsContextValue {
  alerts: Alert[];
  nodes: Node[];
  settings: Settings;
  voiceSettings: VoiceSettings;
  isOnline: boolean;
  isLoading: boolean;
  refreshAlerts: () => Promise<void>;
  refreshNodes: () => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  updateVoiceSettings: (s: Partial<VoiceSettings>) => Promise<void>;
  clearAlerts: () => Promise<void>;
}

const ALERTS_KEY = '@elephant_alerts';
const SETTINGS_KEY = '@elephant_settings';
const VOICE_KEY = '@elephant_voice';

const DEFAULT_SETTINGS: Settings = {
  cameraUrl: '',
  notificationsEnabled: true,
};

const DEFAULT_VOICE: VoiceSettings = {
  enabled: false,
  language: 'en',
};

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Track last known top alert to detect new arrivals
  const lastAlertIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);
  // Use a ref for voiceSettings so refreshAlerts doesn't need it as a dependency
  const voiceSettingsRef = useRef<VoiceSettings>(DEFAULT_VOICE);

  useEffect(() => {
    (async () => {
      try {
        const [storedAlerts, storedSettings, storedVoice] = await Promise.all([
          AsyncStorage.getItem(ALERTS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(VOICE_KEY),
        ]);
        if (storedAlerts) {
          const parsed: Alert[] = JSON.parse(storedAlerts);
          setAlerts(parsed);
          lastAlertIdRef.current = parsed[0]?.id ?? null;
        }
        if (storedSettings)
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
        if (storedVoice) {
          const parsed = { ...DEFAULT_VOICE, ...JSON.parse(storedVoice) };
          setVoiceSettings(parsed);
          voiceSettingsRef.current = parsed;
        }
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
      setIsOnline(true);

      // Detect new alert for voice
      const newestId = sorted[0]?.id ?? null;
      if (
        !isFirstLoadRef.current &&
        newestId &&
        newestId !== lastAlertIdRef.current &&
        voiceSettingsRef.current.enabled
      ) {
        const newest = sorted[0];
        speakAlert(newest.latitude, newest.longitude, voiceSettingsRef.current.language);
      }

      if (isFirstLoadRef.current) isFirstLoadRef.current = false;
      lastAlertIdRef.current = newestId;

      setAlerts(sorted);
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(sorted));
    } catch {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshNodes = useCallback(async () => {
    try {
      const res = await apiRequest('GET', '/api/nodes');
      const data: Node[] = await res.json();
      setNodes(data);
    } catch {
      // keep cached nodes on error
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
    refreshNodes();
    const alertInterval = setInterval(refreshAlerts, 10000);
    const nodeInterval = setInterval(refreshNodes, 15000);
    return () => {
      clearInterval(alertInterval);
      clearInterval(nodeInterval);
    };
  }, [refreshAlerts, refreshNodes]);

  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    },
    [settings],
  );

  const updateVoiceSettings = useCallback(
    async (newVoice: Partial<VoiceSettings>) => {
      const updated = { ...voiceSettingsRef.current, ...newVoice };
      voiceSettingsRef.current = updated;
      setVoiceSettings(updated);
      await AsyncStorage.setItem(VOICE_KEY, JSON.stringify(updated));
    },
    [],
  );

  const clearAlerts = useCallback(async () => {
    setAlerts([]);
    lastAlertIdRef.current = null;
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
      nodes,
      settings,
      voiceSettings,
      isOnline,
      isLoading,
      refreshAlerts,
      refreshNodes,
      updateSettings,
      updateVoiceSettings,
      clearAlerts,
    }),
    [
      alerts,
      nodes,
      settings,
      voiceSettings,
      isOnline,
      isLoading,
      refreshAlerts,
      refreshNodes,
      updateSettings,
      updateVoiceSettings,
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
