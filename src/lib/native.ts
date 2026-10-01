import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { TextToSpeech, QueueStrategy } from '@capacitor-community/text-to-speech';

export const isAndroid = Capacitor.getPlatform() === 'android';

export function initializeNative() {
  if (!isAndroid) return;
  document.documentElement.classList.add('native-android');

  // Keep external pages out of the app WebView, including target="_blank" links.
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || !(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin === window.location.origin) return;
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      event.preventDefault();
      void Browser.open({ url: url.href }).catch(() => {
        window.alert('This link could not be opened. Please try again.');
      });
    }
    // Capacitor delegates mailto: and tel: navigation to Android intent handlers.
  });
}

export function speak(text: string): Promise<void> {
  if (isAndroid) {
    return TextToSpeech.speak({ text, lang: 'en-US', rate: 1, pitch: 1, queueStrategy: QueueStrategy.Flush });
  }
  if ('speechSynthesis' in window) {
    // Discard an unfinished cue rather than delay the current interval.
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
  return Promise.resolve();
}

export function stopSpeech() {
  if (isAndroid) {
    void TextToSpeech.stop().catch(console.error);
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
