import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from './theme';
import Btn from './Btn';

type Plan = 'monthly' | 'annual';

interface Props {
  intentionPreview: string;
  onSubscribe: (plan: Plan) => void;
  onRestore: () => void;
  onClose: () => void;
}

export default function PaywallScreen({ intentionPreview, onSubscribe, onRestore, onClose }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.6} style={s.closeWrap}>
          <Text style={s.close}>Close</Text>
        </TouchableOpacity>

        <Text style={s.eyebrow}>Your intention</Text>
        {!!intentionPreview && <Text style={s.preview}>{'"'}{intentionPreview}{'"'}</Text>}

        <View style={s.rule} />

        <Text style={s.headline}>Say it. Mean it.{'\n'}Become it.</Text>
        <Text style={s.subhead}>Record it in your own voice, choose your state, and hear it play back until it's true.</Text>

        <TouchableOpacity
          onPress={() => setSelectedPlan('annual')}
          activeOpacity={0.7}
          style={[s.planRow, selectedPlan === 'annual' && s.planRowSelected]}
        >
          <View style={s.planRowTop}>
            <Text style={[s.planName, selectedPlan === 'annual' && s.planNameSelected]}>Annual</Text>
            <Text style={[s.planBadge, selectedPlan === 'annual' && s.planBadgeSelected]}>Founding price</Text>
          </View>
          <Text style={[s.planPrice, selectedPlan === 'annual' && s.planPriceSelected]}>£79.99/year</Text>
          <Text style={[s.planSub, selectedPlan === 'annual' && s.planSubSelected]}>Regular price £99.99/year. Locked in at this rate.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedPlan('monthly')}
          activeOpacity={0.7}
          style={[s.planRow, selectedPlan === 'monthly' && s.planRowSelected]}
        >
          <View style={s.planRowTop}>
            <Text style={[s.planName, selectedPlan === 'monthly' && s.planNameSelected]}>Monthly</Text>
            <Text style={[s.planBadge, selectedPlan === 'monthly' && s.planBadgeSelected]}>First 3 months £7.99</Text>
          </View>
          <Text style={[s.planPrice, selectedPlan === 'monthly' && s.planPriceSelected]}>£9.99/month</Text>
          <Text style={[s.planSub, selectedPlan === 'monthly' && s.planSubSelected]}>After 3 months, £9.99/month.</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 28 }}>
          <Btn label="Subscribe" onPress={() => onSubscribe(selectedPlan)} />
        </View>

        <Text style={s.finePrint}>
          Billed at the plan price shown above. Cancel anytime in your Apple ID settings.
        </Text>

        <TouchableOpacity onPress={onRestore} activeOpacity={0.6} style={s.restoreWrap}>
          <Text style={s.restore}>Restore purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0D' },
  inner: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 60 },
  closeWrap: { alignSelf: 'flex-end', marginBottom: 24 },
  close: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 11, color: C.secondary, letterSpacing: 2, textTransform: 'uppercase', textDecorationLine: 'underline' },
  eyebrow: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 11, color: C.secondary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  preview: { fontFamily: 'CormorantGaramond_300Light', fontWeight: '300', fontSize: 22, color: C.primary, lineHeight: 32, letterSpacing: 0.3, marginBottom: 20 },
  rule: { height: 1, backgroundColor: C.border, marginVertical: 28 },
  headline: { fontFamily: 'CormorantGaramond_300Light', fontWeight: '300', fontSize: 34, color: C.primary, lineHeight: 42, marginBottom: 14 },
  subhead: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 15, color: C.secondary, lineHeight: 22, marginBottom: 24 },
  planRow: { borderWidth: 1, borderColor: C.border, backgroundColor: C.inputBg, borderRadius: 2, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 12 },
  planRowSelected: { backgroundColor: C.btnBg, borderColor: C.btnBg },
  planRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  planName: { fontFamily: 'CormorantGaramond_300Light', fontWeight: '300', fontSize: 20, color: C.primary },
  planNameSelected: { color: C.btnText },
  planBadge: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 10, color: C.secondary, letterSpacing: 1, textTransform: 'uppercase' },
  planBadgeSelected: { color: C.btnText },
  planPrice: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 18, color: C.primary, marginBottom: 4 },
  planPriceSelected: { color: C.btnText },
  planSub: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 12, color: C.secondary },
  planSubSelected: { color: C.btnText },
  finePrint: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 11, color: C.secondary, lineHeight: 17, textAlign: 'center', marginTop: 16 },
  restoreWrap: { alignItems: 'center', marginTop: 20 },
  restore: { fontFamily: 'Inter_300Light', fontWeight: '300', fontSize: 12, color: C.secondary, textDecorationLine: 'underline' },
});