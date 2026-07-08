
import ExpoModulesCore
import AVFoundation

private class AudioDelegate: NSObject, AVAudioPlayerDelegate {
  var onFinish: (() -> Void)?

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    onFinish?()
  }
}

public class SomniAudioModule: Module {
  private var voicePlayer: AVAudioPlayer?
  private var deltaPlayer: AVAudioPlayer?
  private var audioDelegate = AudioDelegate()
  private var voiceLoopGapTimer: Timer?
  private var fadeStartTimer: Timer?
  private var fadeStepTimer: Timer?
  private var stopTimer: Timer?
  private var voiceURL: URL?
  private var fadeLevel: Float = 1.0

  public func definition() -> ModuleDefinition {
    Name("SomniAudioModule")

    AsyncFunction("startBedtime") { (voicePath: String, deltaPath: String) in
      DispatchQueue.main.async {
        self.startBedtime(voicePath: voicePath, deltaPath: deltaPath)
      }
    }

    AsyncFunction("startMorning") { (voicePath: String) in
      // Morning is screen-only. No audio.
    }

    AsyncFunction("stop") {
      DispatchQueue.main.async {
        self.stopAll()
      }
    }
  }

  private func activateAudioSession() {
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playback, mode: .default)
    try? session.setActive(true)
  }

  private func startBedtime(voicePath: String, deltaPath: String) {
    stopAll()
    activateAudioSession()
    fadeLevel = 1.0

    voiceURL = URL(string: voicePath) ?? URL(fileURLWithPath: voicePath)
    let deltaURL = URL(string: deltaPath) ?? URL(fileURLWithPath: deltaPath)

    if let dp = try? AVAudioPlayer(contentsOf: deltaURL) {
      dp.numberOfLoops = -1
      dp.volume = 0.3
      dp.play()
      deltaPlayer = dp
    }

    audioDelegate.onFinish = { [weak self] in
      self?.handleVoiceFinished()
    }

    playVoiceOnce()

    fadeStartTimer = Timer.scheduledTimer(withTimeInterval: 8 * 60, repeats: false) { [weak self] _ in
      self?.beginFade(duration: 4 * 60)
    }

    stopTimer = Timer.scheduledTimer(withTimeInterval: 12 * 60, repeats: false) { [weak self] _ in
      self?.stopAll()
    }
  }

  private func playVoiceOnce() {
    guard let url = voiceURL, fadeLevel > 0 else { return }
    if let vp = try? AVAudioPlayer(contentsOf: url) {
      vp.delegate = audioDelegate
      vp.volume = fadeLevel
      vp.play()
      voicePlayer = vp
    }
  }

  private func handleVoiceFinished() {
    guard fadeLevel > 0 else { return }
    voiceLoopGapTimer = Timer.scheduledTimer(withTimeInterval: 10, repeats: false) { [weak self] _ in
      self?.playVoiceOnce()
    }
  }

  private func beginFade(duration: TimeInterval) {
    let steps: Double = 240
    let interval = duration / steps
    var step = 0

    fadeStepTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] timer in
      guard let self = self else { timer.invalidate(); return }
      step += 1
      self.fadeLevel = max(0, Float(1.0 - Double(step) / steps))

      if let vp = self.voicePlayer, vp.isPlaying {
        vp.volume = self.fadeLevel
      }
      if let dp = self.deltaPlayer {
        dp.volume = 0.3 * self.fadeLevel
      }

      if step >= Int(steps) {
        timer.invalidate()
      }
    }
  }

  private func stopAll() {
    voiceLoopGapTimer?.invalidate()
    fadeStartTimer?.invalidate()
    fadeStepTimer?.invalidate()
    stopTimer?.invalidate()
    voiceLoopGapTimer = nil
    fadeStartTimer = nil
    fadeStepTimer = nil
    stopTimer = nil
    voicePlayer?.stop()
    deltaPlayer?.stop()
    voicePlayer = nil
    deltaPlayer = nil
    audioDelegate.onFinish = nil
    fadeLevel = 1.0
    try? AVAudioSession.sharedInstance().setActive(false)
  }
}