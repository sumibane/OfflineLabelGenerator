import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#142B4A',
  background: '#F7F8FA',
  secondaryText: '#667085',
};

export default function SettingsScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.subtitle}>
          Printer and application settings will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.navy,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.secondaryText,
  },
});