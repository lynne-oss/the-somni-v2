import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as Font from 'expo-font';
import Purchases from 'react-native-purchases';
import RecordScreen from './RecordScreen';
import LogScreen from './LogScreen';

const REVENUECAT_API_KEY_IOS = 'test_uKRxeKRteBRopOeYcovQCkrUyJc';

type Tab = 'main' | 'log';
interface BoundaryProps { onBack: () => void; children: React.ReactNode; }
interface BoundaryState { error: Error | null; }
class LogErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };
  static getDerivedStateFromError(error: Error): BoundaryState { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[LogScreen crash]', error.message, '\n', error.stack, '\n', info.componentStack);
  }
  render() {
    const { error } = this.state;
    if (error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#F5F1EB', padding: 28, paddingTop: 60 }}>
          <TouchableOpacity onPress={this.props.onBack}>
            <Text style={{ fontSize: 13, color: '#7A7068', marginBottom: 24 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#cc0000', fontWeight: '600', marginBottom: 8 }}>
            LogScreen error
          </Text>
          <ScrollView>
            <Text style={{ fontSize: 12, color: '#333', fontFamily: 'monospace' }} selectable>
              {error.message}{'\n\n'}{error.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
interface RootBoundaryProps { children: React.ReactNode; }
interface RootBoundaryState { error: Error | null; }
class RootErrorBoundary extends React.Component<RootBoundaryProps, RootBoundaryState> {
  state: RootBoundaryState = { error: null };
  static getDerivedStateFromError(error: Error): RootBoundaryState { return { error }; }
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
  const [tab, setTab] = useState<Tab>('main');
  useEffect(() => {
    Font.loadAsync({
      CormorantGaramond_300Light: require('./assets/CormorantGaramond_300Light.ttf'),
      Inter_300Light: require('./assets/Inter_300Light.ttf'),
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
    }
  }, []);
  const goBack = () => setTab('main');
  return (
    <RootErrorBoundary>
      <>
        <View style={[{ flex: 1 }, tab === 'log' && { display: 'none' }]}>
          <RecordScreen onShowLog={() => setTab('log')} />
        </View>
        {tab === 'log' && (
          <LogErrorBoundary onBack={goBack}>
            <LogScreen onBack={goBack} />
          </LogErrorBoundary>
        )}
      </>
    </RootErrorBoundary>
  );
}