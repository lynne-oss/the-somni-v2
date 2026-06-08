import { NativeModulesProxy } from 'expo-modules-core';

const SomniAudio = NativeModulesProxy.SomniAudioModule;

export function startBedtime(voicePath: string, deltaPath: string): Promise<void> {
  return SomniAudio.startBedtime(voicePath, deltaPath);
}

export function startMorning(voicePath: string): Promise<void> {
  return SomniAudio.startMorning(voicePath);
}

export function stop(): Promise<void> {
  return SomniAudio.stop();
}
