import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.logo}>Shellff</Text>
        <Text style={styles.subtitle}>
          Mobile shell coming in Slices 12–13. This scaffold keeps brand parity while we focus on the web PWA.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#121212',
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#9B5DE5',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
    lineHeight: 24,
  },
});
