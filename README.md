# TaskFlow Mobile

TaskFlow is a mobile task management application built with Expo, React Native and TypeScript.

The app focuses on fast task capture, simple day planning, local-first usage and a practical mobile workflow without a backend.

## Main features

- quick task capture
- task details with category, priority, date, duration and notes
- day planner with scheduled and unscheduled tasks
- queue for tasks to refine, planned later and paused tasks
- notes module with multiple sections
- local JSON import / export
- light and dark theme
- Polish, English and Ukrainian language support
- local notifications
- demo mode and personal mode

## Tech stack

- Expo
- React Native
- TypeScript
- React Navigation
- AsyncStorage

## Run locally

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm install
npm start
```

Then open the app with Expo Go or an emulator.

## Android build

Preview APK:

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm run build:android:preview
```

Production AAB:

```powershell
npm run build:android:production
```

## Project structure

- `src/screens` - application screens
- `src/components` - reusable UI components
- `src/context` - app state and actions
- `src/data` - demo and initial data
- `src/navigation` - navigation setup
- `src/utils` - helpers and date logic
- `assets` - icons and static assets

## Notes

- The application is designed to work without a backend.
- User data is stored locally on the device.
- Demo mode contains expanded mock data for presentation and testing.
