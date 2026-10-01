# Android build and Google Play release

## Project and configuration

Footspeed remains a React 19 + TypeScript + Vite application. Capacitor 8 wraps the existing UI in Android WebView; there is no React Native rewrite or hosted-server dependency.

- Web build: `npm run build` (`tsc -b && vite build`), output `dist/`, base `/footspeed-free/` for GitHub Pages.
- Android web build: `npm run build:android`, output `dist/`, relative base `./` for bundled assets.
- Capacitor: `capacitor.config.ts`, `webDir: 'dist'`.
- Android package/application ID: `com.ritasilva.footspeedfree`.
- Display name: Footspeed. Initial Android version: `versionCode 1`, `versionName "1.0"` in `android/app/build.gradle`.
- Android minimum API 24; compile and target API 36 in `android/variables.gradle`.
- No live-reload server URL or cleartext network access is configured for release.

Confirm the application ID before the first Google Play upload. Changing it later creates a different app. If changing it now, update the Capacitor app ID, Gradle namespace/applicationId, Java package/directory, and Android string resources together.

## Prerequisites

Use Node.js 22+, Android Studio Otter (2025.2.1) or newer, **JDK 21**, and Android SDK Platform 36. Let Android Studio install the requested SDK build tools. The Gradle wrapper is included; no global Gradle installation is needed.

On this Mac, the default Java is 14 and Android Studio's bundled Java is 25. Select/download **JDK 21** in Android Studio Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK. Do not select the bundled Java 25 for the included Gradle 8.14.3 wrapper.

For terminal builds, set `JAVA_HOME` to your JDK 21 installation. The initial build used a temporary JDK at `/private/tmp/footspeed-jdk21/Contents/Home`; install a persistent JDK for ongoing development instead of relying on this temporary directory.

`android/local.properties` holds the local Android SDK path and is ignored by Git. Android Studio can create it on another machine.

## Open and run

From the repository root:

```sh
npm ci
npm run android:sync
npm run android:open
```

Or use Android Studio → Open and select the project's `android` directory, not the repository root.

In Android Studio:

1. Wait for Gradle sync; select JDK 21 if prompted.
2. Open Tools → Device Manager; create a phone with an API 36 image matching your machine's CPU, then start it. An existing API 24+ device also works.
3. Select the `app` run configuration and your emulator, then click Run ▶.
4. After changing React/CSS/assets, run `npm run android:sync` before running again. Native files remain in `android/`; do not delete/recreate the directory.

With JDK 21 selected in your terminal, `npm run android:run` builds/syncs and lets Capacitor choose a device. `npm run android:build` produces `android/app/build/outputs/apk/debug/app-debug.apk`.

## Android behavior and smoke checks

- LocalStorage keys and serialization are unchanged. Android uses its own persistent WebView storage; website history is not automatically imported. Force-stop/relaunch and app updates retain data; clearing app data or uninstalling removes it. Cloud backup and device transfer are excluded for local-only data.
- There are no active API/authentication/payment calls in the current app. The conversion does not reintroduce them.
- Back closes an open cone editor, otherwise returns from History/Exercise to Settings, then minimizes at Settings. The Android keyboard consumes Back while visible. Leaving an exercise cancels it, like the existing Back control.
- Capacitor SystemBars supplies safe-area insets and light status/navigation icons for the existing dark UI. The native scroll container leaves room for cutouts and gesture navigation. `adjustResize` and Capacitor's keyboard inset handling keep input fields scrollable above the keyboard.
- HTTP(S) anchor links open Android Custom Tabs through Capacitor Browser. Same-origin links stay local; mail/phone links use Android handlers. There are currently no external links in the app UI.
- Native text-to-speech preserves countdown and color calls in Android, where browser speech support is unreliable. Web builds continue to use `speechSynthesis`. Install an English voice in Android's text-to-speech settings for offline audio. A visible error appears if speech fails. No microphone permission is needed.
- Launcher/splash artwork is derived from the existing `public/favicon.svg`.

Before release, test on both an emulator and a real device, including API 36:

1. Cold launch without a network connection; verify settings and all assets load.
2. Edit a cone name/color with the keyboard open; test Save, keyboard dismissal, and Back.
3. Run a 10-second exercise with 1-second calls; verify audible countdown/colors and completed history.
4. Force-stop/relaunch; check settings, dates, and history persist. Confirm Clear History persists after relaunch.
5. Test Back from History, during countdown/exercise, in the editor, and on Settings.
6. Test gesture navigation, three-button navigation, rotation, cutouts, and larger font sizes.
7. Review timer behavior when backgrounding/locking the device. The existing foreground web timer architecture is retained; this is not a background exercise service.

## Generate a signed Google Play bundle

1. Run `npm run android:sync` and open Android Studio.
2. Choose **Build → Generate Signed Bundle / APK → Android App Bundle**.
3. Select module `app`. Choose your upload keystore, or **Create new**. Store it outside the repository, use a strong password, set an alias, and keep a secure backup. Use a validity of at least 25 years.
4. Choose the **release** variant and generate the bundle. Android Studio shows the destination; normally it is `android/app/release/app-release.aab` for this wizard.
5. Create the app in Google Play Console, enable Play App Signing, and upload the signed bundle to the **Internal testing** track first.
6. For every later upload, increment `versionCode` and update `versionName` in `android/app/build.gradle`.

`npm run android:bundle` verifies the release build and generates `android/app/build/outputs/bundle/release/app-release.aab`, but it is **unsigned** until signing is configured. Do not upload that unsigned build or the debug APK to Google Play. Signing keys/passwords are intentionally not created or stored by this conversion; `.jks`, `.keystore`, and `keystore.properties` are ignored.

## Remaining Play Console work

Supply the developer account and identity verification, final app name/package choice, store description, screenshots, store icon/feature graphic, support details, public privacy policy, Data safety form, content rating, target audience, ads declaration, and any other declarations Play Console requests for the app. Review data handling by the chosen device TTS engine when completing disclosures. There are no analytics, ads, login, or payment SDKs added here.

Complete the testing requirements applicable to your developer account before requesting production access. A locally successful build does not mean Google Play review or production access has been granted.

## References

- [Capacitor Android requirements](https://capacitorjs.com/docs/updating/8-0)
- [Capacitor SystemBars and safe areas](https://capacitorjs.com/docs/apis/system-bars)
- [Android signing guide](https://developer.android.com/studio/publish/app-signing)
- [Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk)
- [Play testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)

## Validation performed during conversion

- `npm run build`: passed (GitHub Pages build).
- `npm run lint`: passed.
- `npm run android:sync`: passed (Android web build and Capacitor sync).
- JDK 21 + `./gradlew assembleDebug bundleRelease :app:lintDebug`: passed. Android lint reports zero errors; remaining warnings concern template resources, dependency update suggestions, and detailed vector artwork.
- Installed/launched on the existing API 34 Pixel 3a emulator. Verified the rendered UI, dark native status/navigation backgrounds, History-to-Settings Back handling, and retained history after replacing the APK and force-stopping/relaunching.
- Inspected the release AAB: no bundled native `.so` libraries; no release signature is present.
- Physical-device audio, complete keyboard/rotation coverage, API 36 runtime checks, and Play Console pre-launch tests remain manual. No signed production release or Play Console upload was performed.

## Emulator has no sound

Do not launch the emulator with `-no-audio`: it disables host sound output even when Android's media volume is high and text-to-speech succeeds. Restart from Android Studio Device Manager, or launch without that flag. Check both Android media volume and the Mac output volume/device. The emulator also needs an installed English TTS voice.

## Exercise timing

Countdown cues are scheduled at 0, 1, and 2 seconds; the first color is the start cue at 3 seconds. There is no additional spoken "Go" competing with the first color. Exercise duration and subsequent calls use a single `performance.now()` clock, so callback/render delay does not accumulate. Overdue calls are skipped after a stall rather than replayed; the exercise still ends at its original deadline. Speech replaces unfinished cues, which can truncate long custom names at short intervals.

Run `node --test tests/exercise-clock.test.mjs` for deterministic scheduling tests, including delayed callbacks, cancellation, and completion boundaries. These tests verify scheduling, not audible onset. Android TTS synthesis, device load, and audio output can still delay sound; validate the first color and 1-second intervals on the target phone before relying on precision timing. This is a foreground trainer, not a hard real-time or background audio scheduler.

## Configurable cones

Training preferences now store `coneCount` (2–6) and all six cone configurations in the existing `exerciseSettings` localStorage key. Changing the count hides extra cards without deleting their names or colors. Count changes and saved edits persist immediately; old settings without a count retain their custom palette and infer the count from their saved cones. New users start with six.

Only a cloned slice of active cones enters a training session. New history records use the physical cone count and include `configuredCones` plus the actual `colorSequence`, both copied at completion. Old history records remain untouched: their historical count badges retain the legacy call-count values because the original physical configuration cannot be reconstructed reliably.

The pencil opens a labelled native HTML dialog with a color picker, editable hex value, and the name spoken during training. Save applies the edit; Cancel, Escape, or Android Back discards the draft and returns focus to the edit button. Duplicate colors and labels are allowed.

`npm test` covers counts 2–6, rendered card counts, migration, persistence, hidden configuration restoration, duplicate labels, active-only random selection, session snapshot isolation, and timing. Desktop/mobile visual checks and physical TTS playback must still be verified on the target device; no browser was connected during this change. On Samsung, test the keyboard, native color picker, Save/Cancel/Back, counts 2–6, a short session with custom labels, and relaunch persistence.
