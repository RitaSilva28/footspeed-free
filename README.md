# Footspeed

A free exercise trainer with no registration, sign-in, payment, or backend configuration required.

## Development

```sh
npm install
npm run dev
```

Run `npm run build` for a production build and `npm run lint` for code checks.

## Local data

Exercise settings (`exerciseSettings`) and completed exercise history (`exerciseHistory`) are saved in browser localStorage. History is restored after reloading, including dates and called colors. Clear History removes saved exercises after confirmation.

Data belongs to the current browser and site address; it does not sync between devices. Clearing site data removes saved exercises. Existing Supabase history is not automatically imported. If browser storage is unavailable or full, completed exercises remain available for the current session and the app displays a save error.

The `supabase` directory contains legacy backend files and is not required by this app.

## Android app

The existing React app is also packaged with Capacitor 8 for Android. Run `npm run android:sync`, then `npm run android:open`. See [Android setup, emulator testing, and Google Play signing](docs/ANDROID.md) for JDK 21 setup, build commands, and release steps.
