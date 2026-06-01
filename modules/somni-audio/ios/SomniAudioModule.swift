import ExpoModulesCore
import AVFoundation

public class SomniAudioModule: Module, AVAudioPlayerDelegate {
  private var voicePlayer: AVAudioPlayer?
  private var deltaPlayer: AVAudioPlayer?
  private var voiceLoopGapTimer: Timer?
  private var fadeTimer: Timer?
  private var stopTimer: Timer?
  private var voiceURL: URL?
  private var isFading = false
  private var isMorning = false
  private var morningCount = 0

  public func definition() -> ModuleDefinition {
    Name("SomniAudioModule")

    Function("startBedtime") { (voicePath: String, deltaPath: String) in
      self.startBedtime(voicePath: voicePath, deltaPath: deltaPath)
    }

    Function("startMorning") { (voicePath: String) in
      self.startMorning(voicePath: voicePath)
    }

    Function("stop") {
      self.stopAll()
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
    isFading = false
    isMorning = false

    voiceURL = URL(fileURLWithPath: voicePath)
    let deltaURL = URL(fileURLWithPath: deltaPath)

    if let dp = try? AVAudioPlayer(contentsOf: deltaURL) {
      dp.numberOfLoops = -1
      dp.volume = 0.3
      dp.play()
      deltaPlayer = dp
    }

    playVoiceOnce()

    fadeTimer = Timer.scheduledTimer(withTimeInterval: 8 * 60, repeats: false) { [weak self] _ in
      self?.fadeOutVoice(duration: 4 * 60)
    }

    stopTimer = Timer.scheduledTimer(withTimeInterval: 12 * 60, repeats: false) { [weak self] _ in
      self?.stopAll()
    }
  }

  private func playVoiceOnce() {
    guard let url = voiceURL, !isFading else { return }
    if let vp = try? AVAudioPlayer(contentsOf: url) {
      vp.delegate = self
      vp.volume = 1.0
      vp.play()
      voicePlayer = vp
    }
  }

  public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    if isMorning {
      Timer.scheduledTimer(withTimeInterval: 1.0, repeats: false) { [weak self] _ in
        self?.playMorningVoice()
      }
    } else if !isFading {
      voiceLoopGapTimer = Timer.scheduledTimer(withTimeInterval: 10, repeats: false) { [weak self] _ in
        self?.playVoiceOnce()
      }
    }
  }

  private func fadeOutVoice(duration: TimeInterval) {
    isFading = true
    voiceLoopGapTimer?.invalidate()
    voiceLoopGapTimer = nil

    guard let player = voicePlayer else { return }
    let steps: Double = 96
    let interval = duration / steps
    var step = 0

    fadeTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] timer in
      step += 1
      player.volume = max(0, Float(1.0 - Double(step) / steps))
      if step >= Int(steps) {
        timer.invalidate()
        self?.voicePlayer?.stop()
        self?.voicePlayer = nil
      }
    }
  }

  private func startMorning(voicePath: String) {
    stopAll()
    activateAudioSession()
    isMorning = true
    isFading = false
    morningCount = 0
    voiceURL = URL(fileURLWithPath: voicePath)
    playMorningVoice()
  }

  private func playMorningVoice() {
    guard morningCount < 5, let url = voiceURL else {
      stopAll()
      return
    }
    if let vp = try? AVAudioPlayer(contentsOf: url) {
      vp.delegate = self
      vp.volume = 0.0
      vp.play()
      voicePlayer = vp
      morningCount += 1

      let steps = 30
      var step = 0
      Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
        step += 1
        vp.volume = min(0.7, 0.7 * Float(step) / Float(steps))
        if step >= steps { timer.invalidate() }
      }
    }
  }

  private func stopAll() {
    voiceLoopGapTimer?.invalidate()
    fadeTimer?.invalidate()
    stopTimer?.invalidate()
    voiceLoopGapTimer = nil
    fadeTimer = nil
    stopTimer = nil
    voicePlayer?.stop()
    deltaPlayer?.stop()
    voicePlayer = nil
    deltaPlayer = nil
    isFading = false
    isMorning = false
    try? AVAudioSession.sharedInstance().setActive(false)
  }
}
