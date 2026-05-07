# Android build for TaskFlow

## What is already prepared
- `app.json` has Android package id: `com.taskflow.mobile`
- `app.json` has `android.versionCode = 1`
- `eas.json` contains three profiles:
  - `development` -> dev client APK
  - `preview` -> installable APK
  - `production` -> AAB for Play Store
- `package.json` contains helper scripts for Android builds

## Recommended build for installation on phone
Use `preview`, because it creates a regular APK:

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm run build:android:preview
```

## First-time setup
1. Install EAS CLI:

```powershell
npm install -g eas-cli
```

2. Log in:

```powershell
eas login
```

3. If EAS asks to connect/init the project, confirm it.

## Other build modes
Development build:

```powershell
npm run build:android:development
```

Production AAB:

```powershell
npm run build:android:production
```

## Notes
- `preview` is best for direct installation on Android phone.
- `production` is for Google Play style distribution.
- If app id should use your personal namespace later, change `expo.android.package`.
