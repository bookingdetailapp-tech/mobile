import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

// Set in app.json -> expo.extra.webUrl (or override with EXPO_PUBLIC_WEB_URL).
// Dev: your PC's LAN IP, e.g. http://192.168.1.9:3000 (phone and PC on same Wi-Fi).
// Prod: the deployed HTTPS URL of the Next.js app.
const WEB_URL: string =
  process.env.EXPO_PUBLIC_WEB_URL ??
  (Constants.expoConfig?.extra?.webUrl as string) ??
  'http://192.168.1.9:3000';

export default function App() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Android hardware back button navigates the WebView history first.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const reload = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setAttempt((n) => n + 1);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      {failed ? (
        <View style={styles.center}>
          <Text style={styles.title}>Can't reach Slotkaro</Text>
          <Text style={styles.sub}>Check your connection and try again.</Text>
          <Pressable style={styles.btn} onPress={reload}>
            <Text style={styles.btnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={attempt}
          ref={webRef}
          source={{ uri: WEB_URL }}
          style={styles.web}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setFailed(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500) setFailed(true);
          }}
          onNavigationStateChange={(s) => setCanGoBack(s.canGoBack)}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
        />
      )}
      {loading && !failed && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  web: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  sub: { fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' },
  btn: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
