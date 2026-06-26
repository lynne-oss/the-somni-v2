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
  private var fadeTimer: Timer?
  private var stopTimer: Timer?
  private var voiceURL: URL?
  private var isFading = false
  private var isMorning = false
  private var morningCount = 0
  private var fadingVoice: AVAudioPlayer?
  private var interruptionObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("SomniAudioModule")

    AsyncFunction("startBedtime") { (voicePath: String, deltaPath: String) in
      DispatchQueue.main.async {
        self.startBedtime(voicePath: voicePath, deltaPath: deltaPath)
      }
    }

    AsyncFunction("startMorning") { (voicePath: String) in
      DispatchQueue.main.async {
        self.startMorning(voicePath: voicePath)
      }
    }

    AsyncFunction("stop") {
      DispatchQueue.main.async {
        self.stopAll()
      }
    }

    Events("onSessionEnd")
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

    voiceURL = URL(string: voicePath)
    guard let deltaURL = URL(string: deltaPath) else { return }

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

    interruptionObserver = NotificationCenter.default.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object: nil,
      queue: .main
    ) { [weak self] notification in
      guard let self = self,
            let info = notification.userInfo,
            let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            AVAudioSession.InterruptionType(rawValue: typeValue) == .ended else { return }
      self.activateAudioSession()
      if self.isFading {
        self.fadingVoice?.play()
      } else {
        self.voicePlayer?.play()
      }
      self.deltaPlayer?.play()
    }

    fadeTimer = Timer.scheduledTimer(withTimeInterval: 8 * 60, repeats: false) { [weak self] _ in
      self?.fadeOutVoice(duration: 4 * 60)
    }

    stopTimer = Timer.scheduledTimer(withTimeInterval: 12 * 60, repeats: false) { [weak self] _ in
      self?.stopAll()
      self?.sendEvent("onSessionEnd", ["type": "bedtime"])
    }
  }

  private func playVoiceOnce() {
    guard let url = voiceURL, !isFading else { return }
    if let vp = try? AVAudioPlayer(contentsOf: url) {
      vp.delegate = audioDelegate
      vp.volume = 1.0
      vp.play()
      voicePlayer = vp
    }
  }

  private func handleVoiceFinished() {
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

    // Detach delegate so audioPlayerDidFinishPlaying cannot fire and stop the player mid-fade.
    voicePlayer?.delegate = nil

    // If voice is in its gap (voicePlayer is nil), start it now so we have something to fade.
    if voicePlayer == nil, let url = voiceURL, let vp = try? AVAudioPlayer(contentsOf: url) {
      vp.volume = 1.0
      vp.numberOfLoops = -1
      vp.play()
      voicePlayer = vp
    } else {
      voicePlayer?.numberOfLoops = -1
    }
    let capturedVoice = voicePlayer
    fadingVoice = capturedVoice

    let steps: Double = 96
    let interval = duration / steps
    var step = 0
    let initialVoiceVolume = capturedVoice?.volume ?? 1.0
    let initialDeltaVolume = deltaPlayer?.volume ?? 0.3

    fadeTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] timer in
      guard let self = self else { timer.invalidate(); return }
      step += 1
      let fraction = max(0, Float(1.0 - Double(step) / steps))
      capturedVoice?.volume = initialVoiceVolume * fraction
      self.deltaPlayer?.volume = initialDeltaVolume * fraction
      if step >= Int(steps) {
        timer.invalidate()
        capturedVoice?.numberOfLoops = 0
        capturedVoice?.stop()
      }
    }
  }

  private func startMorning(voicePath: String) {
    stopAll()
    activateAudioSession()
    isMorning = true
    isFading = false
    morningCount = 0
    voiceURL = URL(string: voicePath)

    audioDelegate.onFinish = { [weak self] in
      self?.handleVoiceFinished()
    }

    playMorningVoice()
  }

  private func playMorningVoice() {
    guard morningCount < 5, let url = voiceURL else {
      stopAll()
      sendEvent("onSessionEnd", ["type": "waketime"])
      return
    }
    if let vp = try? AVAudioPlayer(contentsOf: url) {
      vp.delegate = audioDelegate
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
    fadingVoice = nil
    if let obs = interruptionObserver {
      NotificationCenter.default.removeObserver(obs)
      interruptionObserver = nil
    }
    audioDelegate.onFinish = nil
    isFading = false
    isMorning = false
    try? AVAudioSession.sharedInstance().setActive(false)
  }
}
