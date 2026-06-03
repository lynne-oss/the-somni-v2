import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (error) {
      return (
        <View style={{ flex: 1, backgroundColor: 'red', padding: 28, paddingTop: 60 }}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
            App crashed
          </Text>
          <ScrollView>
            <Text style={{ color: 'white', fontSize: 11, fontFamily: 'monospace' }} selectable>
              {(error as Error).message}{'\n\n'}{(error as Error).stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <RootErrorBoundary>
      <View style={styles.container}>
        <Text style={styles.title}>The Somni</Text>
        <StatusBar style="light" />
      </View>
    </RootErrorBoundary>
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
