import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAlerts } from '@/context/AlertsContext';
import { testVoice, stopSpeaking } from '@/services/ttsService';

type Language = 'en' | 'hi' | 'ta';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
];

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.subtext, fontFamily: 'Inter_500Medium' },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.sectionContent,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { settings, voiceSettings, updateSettings, updateVoiceSettings, clearAlerts, isOnline, alerts } = useAlerts();

  const [cameraUrlInput, setCameraUrlInput] = useState(settings.cameraUrl);
  const [isTesting, setIsTesting] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSaveCameraUrl = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateSettings({ cameraUrl: cameraUrlInput });
  }, [cameraUrlInput, updateSettings]);

  const handleToggleNotifications = useCallback(
    (value: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateSettings({ notificationsEnabled: value });
    },
    [updateSettings],
  );

  const handleToggleVoice = useCallback(
    (value: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!value) stopSpeaking();
      updateVoiceSettings({ enabled: value });
    },
    [updateVoiceSettings],
  );

  const handleSelectLanguage = useCallback(
    (code: Language) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateVoiceSettings({ language: code });
    },
    [updateVoiceSettings],
  );

  const handleTestVoice = useCallback(async () => {
    setIsTesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await testVoice(voiceSettings.language);
    setTimeout(() => setIsTesting(false), 2000);
  }, [voiceSettings.language]);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear Alert History',
      `This will permanently delete all ${alerts.length} detection records. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAlerts();
          },
        },
      ],
    );
  }, [alerts.length, clearAlerts]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={[
          styles.title,
          { color: colors.text, fontFamily: 'Inter_700Bold' },
        ]}
      >
        Settings
      </Text>

      {/* Status Card */}
      <View
        style={[
          styles.statusCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? Colors.accent : Colors.alertRed },
            ]}
          />
          <View>
            <Text
              style={[
                styles.statusTitle,
                { color: colors.text, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              System {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text
              style={[
                styles.statusSub,
                { color: colors.subtext, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {isOnline ? `${alerts.length} alerts synced` : 'Check connection'}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isOnline
                ? 'rgba(45,190,108,0.15)'
                : 'rgba(224,59,59,0.15)',
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              {
                color: isOnline ? Colors.accent : Colors.alertRed,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            {isOnline ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Camera Configuration */}
      <SettingsSection title="CAMERA">
        <View style={styles.cameraInputContainer}>
          <View style={styles.cameraInputHeader}>
            <View
              style={[
                styles.rowIcon,
                { backgroundColor: 'rgba(45,190,108,0.12)' },
              ]}
            >
              <Ionicons name="videocam" size={18} color={Colors.accent} />
            </View>
            <Text
              style={[
                styles.rowLabel,
                { color: colors.text, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Raspberry Pi Camera URL
            </Text>
          </View>
          <TextInput
            value={cameraUrlInput}
            onChangeText={setCameraUrlInput}
            placeholder="http://192.168.1.100:5000"
            placeholderTextColor={colors.subtext}
            style={[
              styles.urlInput,
              {
                color: colors.text,
                backgroundColor: isDark ? '#0B1012' : '#F0F4F5',
                borderColor: colors.cardBorder,
                fontFamily: 'Inter_400Regular',
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Pressable
            onPress={handleSaveCameraUrl}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: Colors.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="checkmark" size={16} color="#0B1012" />
            <Text
              style={[
                styles.saveBtnText,
                { fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              Save URL
            </Text>
          </Pressable>
        </View>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="NOTIFICATIONS">
        <View style={styles.row}>
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: 'rgba(245,166,35,0.12)' },
            ]}
          >
            <Ionicons name="notifications" size={18} color={Colors.amber} />
          </View>
          <Text
            style={[
              styles.rowLabel,
              { color: colors.text, fontFamily: 'Inter_400Regular', flex: 1 },
            ]}
          >
            Alert Notifications
          </Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.cardBorder, true: Colors.accent }}
            thumbColor="#ffffff"
          />
        </View>
      </SettingsSection>

      {/* Voice Alerts */}
      <SettingsSection title="VOICE ALERTS">
        {/* Toggle */}
        <View
          style={[
            styles.row,
            { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
          ]}
        >
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: 'rgba(45,190,108,0.12)' },
            ]}
          >
            <Ionicons name="volume-high" size={18} color={Colors.accent} />
          </View>
          <Text
            style={[
              styles.rowLabel,
              { color: colors.text, fontFamily: 'Inter_400Regular', flex: 1 },
            ]}
          >
            Auto Voice Alerts
          </Text>
          <Switch
            value={voiceSettings.enabled}
            onValueChange={handleToggleVoice}
            trackColor={{ false: colors.cardBorder, true: Colors.accent }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Language Selection */}
        <View style={styles.languageContainer}>
          <Text
            style={[
              styles.languageTitle,
              { color: colors.subtext, fontFamily: 'Inter_500Medium' },
            ]}
          >
            Alert Language
          </Text>
          <View style={styles.languageRow}>
            {LANGUAGES.map((lang) => {
              const isSelected = voiceSettings.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleSelectLanguage(lang.code)}
                  style={({ pressed }) => [
                    styles.langOption,
                    {
                      backgroundColor: isSelected
                        ? Colors.accent
                        : isDark
                          ? '#0B1012'
                          : '#F0F4F5',
                      borderColor: isSelected
                        ? Colors.accent
                        : colors.cardBorder,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langLabel,
                      {
                        color: isSelected ? '#0B1012' : colors.text,
                        fontFamily: isSelected
                          ? 'Inter_700Bold'
                          : 'Inter_400Regular',
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  <Text
                    style={[
                      styles.langNative,
                      {
                        color: isSelected
                          ? 'rgba(11,16,18,0.7)'
                          : colors.subtext,
                        fontFamily: 'Inter_400Regular',
                      },
                    ]}
                  >
                    {lang.native}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Test Button */}
        <View
          style={[
            styles.testContainer,
            { borderTopWidth: 1, borderTopColor: colors.cardBorder },
          ]}
        >
          <Pressable
            onPress={handleTestVoice}
            disabled={isTesting}
            style={({ pressed }) => [
              styles.testBtn,
              {
                backgroundColor: isDark ? '#0B1012' : '#F0F4F5',
                borderColor: Colors.accent,
                opacity: isTesting || pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name={isTesting ? 'volume-high' : 'play-circle'}
              size={18}
              color={Colors.accent}
            />
            <Text
              style={[
                styles.testBtnText,
                { color: Colors.accent, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              {isTesting ? 'Speaking...' : 'Test Voice'}
            </Text>
          </Pressable>
        </View>

        {/* Info note */}
        <View style={[styles.infoNote, { borderTopWidth: 1, borderTopColor: colors.cardBorder }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.subtext} />
          <Text
            style={[
              styles.infoText,
              { color: colors.subtext, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Alerts are throttled to one voice message per minute. Silent mode is respected.
          </Text>
        </View>
      </SettingsSection>

      {/* Data */}
      <SettingsSection title="DATA">
        <View style={styles.row}>
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: 'rgba(45,190,108,0.12)' },
            ]}
          >
            <Ionicons name="server" size={18} color={Colors.accent} />
          </View>
          <Text
            style={[
              styles.rowLabel,
              { color: colors.text, fontFamily: 'Inter_400Regular', flex: 1 },
            ]}
          >
            Total Records
          </Text>
          <Text
            style={[
              styles.valueText,
              { color: colors.subtext, fontFamily: 'Inter_500Medium' },
            ]}
          >
            {alerts.length} alerts
          </Text>
        </View>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="DANGER ZONE">
        <Pressable
          onPress={handleClearHistory}
          style={({ pressed }) => [
            styles.dangerRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: 'rgba(224,59,59,0.12)' },
            ]}
          >
            <Ionicons name="trash" size={18} color={Colors.alertRed} />
          </View>
          <Text
            style={[
              styles.dangerLabel,
              { color: Colors.alertRed, fontFamily: 'Inter_400Regular', flex: 1 },
            ]}
          >
            Clear Alert History
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.alertRed} />
        </Pressable>
      </SettingsSection>

      <View style={styles.appInfo}>
        <Text
          style={[
            styles.appInfoText,
            { color: colors.subtext, fontFamily: 'Inter_400Regular' },
          ]}
        >
          ElephantWatch v1.0.0
        </Text>
        <Text
          style={[
            styles.appInfoText,
            { color: colors.subtext, fontFamily: 'Inter_400Regular' },
          ]}
        >
          AI-Based Elephant Movement Monitoring
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28, letterSpacing: -0.5, marginBottom: 20 },
  statusCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTitle: { fontSize: 15 },
  statusSub: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.2, marginBottom: 8 },
  sectionContent: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15 },
  valueText: { fontSize: 14 },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dangerLabel: { fontSize: 15 },
  cameraInputContainer: { padding: 16, gap: 12 },
  cameraInputHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  urlInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnText: { fontSize: 15, color: '#0B1012' },
  languageContainer: { padding: 16, gap: 12 },
  languageTitle: { fontSize: 12, letterSpacing: 0.5 },
  languageRow: { flexDirection: 'row', gap: 8 },
  langOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 3,
  },
  langLabel: { fontSize: 13 },
  langNative: { fontSize: 11 },
  testContainer: { padding: 16 },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  testBtnText: { fontSize: 15 },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  appInfo: { alignItems: 'center', gap: 4, marginTop: 8 },
  appInfoText: { fontSize: 12 },
});
