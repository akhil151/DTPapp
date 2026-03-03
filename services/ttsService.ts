import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

const THROTTLE_MS = 60_000;
let lastSpokenAt = 0;

const MESSAGES: Record<string, (lat: number, lon: number) => string> = {
  en: (lat, lon) =>
    `Elephant detected near ${lat.toFixed(3)}, ${lon.toFixed(3)}. Please stay indoors and alert local authorities.`,
  hi: (lat, lon) =>
    `${lat.toFixed(3)}, ${lon.toFixed(3)} के पास हाथी का पता चला। कृपया घर के अंदर रहें और स्थानीय अधिकारियों को सूचित करें।`,
  ta: (lat, lon) =>
    `${lat.toFixed(3)}, ${lon.toFixed(3)} அருகில் யானை கண்டறியப்பட்டது. தயவுசெய்து உள்ளே இருங்கள்.`,
};

const LANG_CODES: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  ta: 'ta-IN',
};

export function speakAlert(
  latitude: number,
  longitude: number,
  language: 'en' | 'hi' | 'ta',
): void {
  const now = Date.now();
  if (now - lastSpokenAt < THROTTLE_MS) return;
  lastSpokenAt = now;

  const messageFn = MESSAGES[language] ?? MESSAGES.en;
  const text = messageFn(latitude, longitude);
  const langCode = LANG_CODES[language] ?? 'en-US';

  Speech.speak(text, {
    language: langCode,
    rate: Platform.OS === 'android' ? 0.9 : 0.85,
    pitch: 1.0,
    onError: () => {
      // Fallback to English if language not available
      if (language !== 'en') {
        Speech.speak(MESSAGES.en(latitude, longitude), {
          language: 'en-US',
          rate: 0.85,
        });
      }
    },
  });
}

export async function testVoice(language: 'en' | 'hi' | 'ta'): Promise<void> {
  const TEST_MESSAGES: Record<string, string> = {
    en: 'Voice alert test. English language selected.',
    hi: 'आवाज़ अलर्ट परीक्षण। हिंदी भाषा चुनी गई है।',
    ta: 'குரல் எச்சரிக்கை சோதனை. தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது.',
  };
  const langCode = LANG_CODES[language] ?? 'en-US';

  Speech.stop();
  Speech.speak(TEST_MESSAGES[language] ?? TEST_MESSAGES.en, {
    language: langCode,
    rate: 0.85,
    onError: () => {
      Speech.speak(TEST_MESSAGES.en, { language: 'en-US', rate: 0.85 });
    },
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
