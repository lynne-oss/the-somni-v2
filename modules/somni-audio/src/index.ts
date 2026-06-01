import { NativeModulesProxy } from 'expo-modules-core';

const SomniAudio = NativeModulesProxy.SomniAudioModule;

export function startBedtime(voicePath: string, deltaPath: string): void {
  SomniAudio.startBedtime(voicePath, deltaPath);
}

export function startMorning(voicePath: string): void {
  SomniAudio.startMorning(voicePath);
}

export function stop(): void {
  SomniAudio.stop();
}
