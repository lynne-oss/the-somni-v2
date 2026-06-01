import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Somni</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F5F1EB',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 4,
  },
});
