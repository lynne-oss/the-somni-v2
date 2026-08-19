import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogEntry, LOG_KEY, DIAG_LOG_KEY } from './types';

const CREAM = '#F5F1EB';
const DARK  = '#0B0B0D';
const MID   = '#7A7068';
const RULE  = '#D8D2C8';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDate(ts: number): string {
  try {
    const d = new Date(ts);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '';
  }
}

type Tab = 'intentions' | 'diagnostics';

interface Props {
  onBack: () => void;
}

export default function LogScreen({ onBack }: Props) {
  const [tab,         setTab]         = useState<Tab>('intentions');
  const [entries,     setEntries]     = useState<LogEntry[]>([]);
  const [diagLines,   setDiagLines]   = useState<string[]>([]);
  const [titleTaps,   setTitleTaps]   = useState(0);
  const [diagUnlocked, setDiagUnlocked] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);

  function handleTitleTap() {
    const next = titleTaps + 1;
    setTitleTaps(next);
    if (next >= 5) {
      setDiagUnlocked(true);
    }
  }

  useEffect(() => {
    loadEntries();
    loadDiag();
  }, []);

  function loadEntries() {
    AsyncStorage.getItem(LOG_KEY)
      .then(raw => {
        if (!raw) return;
        const p = JSON.parse(raw);
        setEntries(Array.isArray(p) ? p : []);
      })
      .catch(() => {});
  }

  function loadDiag() {
    AsyncStorage.getItem(DIAG_LOG_KEY)
      .then(raw => {
        if (!raw) return;
        const p = JSON.parse(raw);
        setDiagLines(Array.isArray(p) ? [...p].reverse() : []);
      })
      .catch(() => {});
  }

  function clearDiag() {
    AsyncStorage.setItem(DIAG_LOG_KEY, JSON.stringify([])).catch(() => {});
    setDiagLines([]);
  }

  function confirmDeleteEntry(entry: LogEntry) {
    Alert.alert(
      'Delete intention',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry) },
      ]
    );
  }

  function deleteEntry(entry: LogEntry) {
    const updated = entries.filter(e => e.id !== entry.id);
    setEntries(updated);
    AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated)).catch(() => {});
    setSelectedEntry(null);
  }

  if (selectedEntry) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
          <View style={s.headerRow}>
            <Text style={s.title}>Intention</Text>
            <TouchableOpacity onPress={() => setSelectedEntry(null)} activeOpacity={0.6} style={s.backWrap}>
              <Text style={s.back}>← Back</Text>
            </TouchableOpacity>
          </View>
          <View style={s.rule} />
          <Text style={s.detailDate}>{formatDate(selectedEntry.timestamp)}</Text>
          {!!selectedEntry.text && <Text style={s.detailStatement}>{selectedEntry.text}</Text>}
          {(!!selectedEntry.ans1 || !!selectedEntry.ans2) && (
            <>
              <View style={s.detailRule} />
              {!!selectedEntry.ans1 && (
                <>
                  <Text style={s.detailLabel}>What you were committed to</Text>
                  <Text style={s.detailAnswer}>{selectedEntry.ans1}</Text>
                </>
              )}
              {!!selectedEntry.ans2 && (
                <>
                  <Text style={[s.detailLabel, { marginTop: 24 }]}>What was pulling you off it</Text>
                  <Text style={s.detailAnswer}>{selectedEntry.ans2}</Text>
                </>
              )}
            </>
          )}
          <TouchableOpacity onPress={() => confirmDeleteEntry(selectedEntry)} activeOpacity={0.6} style={s.deleteWrap}>
            <Text style={s.deleteBtn}>Delete this intention</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
            <Text style={s.title}>{tab === 'intentions' ? 'Intentions' : 'Diagnostics'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} activeOpacity={0.6} style={s.backWrap}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={s.rule} />
        <View style={s.tabRow}>
          <TouchableOpacity onPress={() => setTab('intentions')} activeOpacity={0.6} style={[s.tab, tab === 'intentions' && s.tabActive]}>
            <Text style={[s.tabLabel, tab === 'intentions' && s.tabLabelActive]}>Intentions</Text>
          </TouchableOpacity>
          {diagUnlocked && (
            <TouchableOpacity onPress={() => { setTab('diagnostics'); loadDiag(); }} activeOpacity={0.6} style={[s.tab, tab === 'diagnostics' && s.tabActive]}>
              <Text style={[s.tabLabel, tab === 'diagnostics' && s.tabLabelActive]}>Diagnostics</Text>
            </TouchableOpacity>
          )}
        </View>
        {tab === 'intentions' && (
          entries.length === 0 ? (
            <Text style={s.empty}>No intentions recorded yet.</Text>
          ) : (
            entries.filter(Boolean).map((entry, i) => (
              <View key={entry.id}>
                <TouchableOpacity onPress={() => setSelectedEntry(entry)} activeOpacity={0.6} style={s.entry}>
                  <Text style={s.entryDate}>{formatDate(entry.timestamp)}</Text>
                  {!!entry.text && <Text style={s.entryText} numberOfLines={2}>{entry.text}</Text>}
                </TouchableOpacity>
                {i < entries.length - 1 && <View style={s.entryRule} />}
              </View>
            ))
          )
        )}
        {tab === 'diagnostics' && (
          <>
            <View style={s.diagToolbar}>
              <Text style={s.diagCount}>{diagLines.length} lines · newest first</Text>
              <TouchableOpacity onPress={clearDiag} activeOpacity={0.6}>
                <Text style={s.clearBtn}>Clear</Text>
              </TouchableOpacity>
            </View>
            {diagLines.length === 0 ? (
              <Text style={s.empty}>No diagnostic logs yet.</Text>
            ) : (
              diagLines.map((line, i) => (
                <Text key={i} style={s.diagLine}>{line}</Text>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  inner: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  title: { fontFamily: 'CormorantGaramond_300Light', fontWeight: '300', fontSize: 42, color: DARK, letterSpacing: 2 },
  backWrap: { paddingBottom: 6 },
  back: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 11, color: MID, letterSpacing: 2, textTransform: 'uppercase', textDecorationLine: 'underline' },
  rule: { height: 1, backgroundColor: RULE, marginBottom: 24 },
  tabRow: { flexDirection: 'row', marginBottom: 28 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: RULE },
  tabActive: { borderBottomWidth: 1, borderBottomColor: DARK },
  tabLabel: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 11, color: MID, letterSpacing: 2, textTransform: 'uppercase' },
  tabLabelActive: { color: DARK },
  empty: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 14, color: MID, letterSpacing: 0.5, marginTop: 48, textAlign: 'center', lineHeight: 22 },
  entry: { paddingVertical: 24 },
  entryDate: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 10, color: MID, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  entryText: { fontFamily: 'CormorantGaramond_300Light', fontWeight: '300', fontSize: 22, color: DARK, lineHeight: 32, letterSpacing: 0.3 },
  entryRule: { height: 1, backgroundColor: RULE },
  diagToolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  diagCount: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 10, color: MID, letterSpacing: 1.5, textTransform: 'uppercase' },
  clearBtn: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 10, color: MID, letterSpacing: 1.5, textTransform: 'uppercase', textDecorationLine: 'underline' },
  diagLine: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 10, color: DARK, lineHeight: 17, letterSpacing: 0.2, marginBottom: 4 },
  detailDate: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 11, color: MID, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  detailStatement: { fontFamily: 'CormorantGaramond_300Light', fontWeight: '300', fontSize: 28, color: DARK, lineHeight: 40, letterSpacing: 0.3 },
  detailRule: { height: 1, backgroundColor: RULE, marginTop: 36, marginBottom: 28 },
  detailLabel: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 11, color: MID, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  detailAnswer: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 16, color: DARK, lineHeight: 24 },
  deleteWrap: { marginTop: 48, alignItems: 'center' },
  deleteBtn: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 12, color: '#B33A3A', letterSpacing: 1, textTransform: 'uppercase', textDecorationLine: 'underline' },
});