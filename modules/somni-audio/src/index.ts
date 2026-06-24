import { requireNativeModule, EventEmitter } from 'expo-modules-core';

const SomniAudio = requireNativeModule('SomniAudioModule');
const emitter = new EventEmitter(SomniAudio);

export function startBedtime(voicePath: string, deltaPath: string): Promise<void> {
  return SomniAudio.startBedtime(voicePath, deltaPath);
}

export function startMorning(voicePath: string): Promise<void> {
  return SomniAudio.startMorning(voicePath);
}

export function stop(): Promise<void> {
  return SomniAudio.stop();
}

export function addSessionEndListener(
  listener: (event: { type: 'bedtime' | 'waketime' }) => void
) {
  return emitter.addListener('onSessionEnd', listener);
}
