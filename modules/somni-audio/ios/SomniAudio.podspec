require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SomniAudio'
  s.module_name    = 'SomniAudio'
  s.version        = package['version']
  s.summary        = package['description']
  s.license        = { :type => 'MIT' }
  s.author         = 'The Somni'
  s.homepage       = 'https://thesomni.com'
  s.platform       = :ios, '16.0'
  s.swift_version  = '5.9'
  s.source         = { :path => '.' }
  s.source_files   = '*.swift'
  s.dependency 'ExpoModulesCore'
end
