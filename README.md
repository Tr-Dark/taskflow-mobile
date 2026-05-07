# TaskFlow Mobile

TaskFlow to mobilna aplikacja do organizacji zadań zbudowana w `Expo`, `React Native` i `TypeScript`.

Aplikacja jest nastawiona na szybkie zapisywanie zadań, proste planowanie dnia, lokalne przechowywanie danych i wygodny workflow bez backendu.

## Najważniejsze funkcje

- szybkie dodawanie zadań
- szczegóły zadania: kategoria, priorytet, data, czas trwania i notatki
- planer dnia z zadaniami zaplanowanymi i bez godziny
- kolejki zadań do doprecyzowania, na później i wstrzymanych
- moduł notatek z kilkoma sekcjami
- lokalny import / eksport danych w JSON
- motyw jasny i ciemny
- obsługa języków: polski, angielski, ukraiński
- lokalne powiadomienia
- tryb demo i tryb prywatny

## Technologie

- Expo
- React Native
- TypeScript
- React Navigation
- AsyncStorage

## Wymagania

- Node.js 20+
- npm
- opcjonalnie:
  - `Expo Go` na telefonie
  - emulator Android
  - przeglądarka internetowa

## Instalacja

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm install
```

## Dostępne skrypty

Aby zobaczyć wszystkie komendy:

```powershell
npm run
```

Podstawowy serwer developerski:

```powershell
npm run dev
```

Ta komenda uruchamia Expo na porcie `8090`.

## Uruchamianie aplikacji

### 1. Telefon z Expo Go

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm start
```

Następnie:

- zainstaluj `Expo Go` na telefonie
- połącz telefon i komputer z tą samą siecią Wi-Fi
- zeskanuj kod QR wyświetlony przez Expo

### 2. Telefon z innej sieci lub problem z lokalnym LAN

Jeżeli telefon nie jest w tej samej sieci co komputer albo lokalne połączenie nie działa, użyj tunelu:

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm run tunnel
```

To uruchomi Expo przez `tunnel`, co zwykle działa stabilniej poza jedną siecią lokalną.

### 3. Emulator Android

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm run android
```

Wymaga to uruchomionego emulatora Android na komputerze.

### 4. Przeglądarka internetowa

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm run web
```

Wersja web została ograniczona do wąskiego kontenera, żeby wyglądała bardziej jak aplikacja mobilna i nie rozjeżdżała się na szerokim ekranie.

Jeśli port `8090` jest zajęty, można uruchomić Expo na innym porcie, np.:

```powershell
npx expo start --web --port 8091
```

## Statyczny export web

Aby zbudować wersję web do statycznych plików:

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm run build:web
```

Pliki zostaną zapisane w katalogu `web-dist/`.

## Build Android

### APK do instalacji testowej

```powershell
cd "X:\Praca Dyplomowa\taskflow-mobile"
npm run build:android:preview
```

### Development build

```powershell
npm run build:android:development
```

### Produkcyjny AAB

```powershell
npm run build:android:production
```

## Struktura projektu

- `src/screens` - ekrany aplikacji
- `src/components` - komponenty wielokrotnego użytku
- `src/context` - stan aplikacji i akcje
- `src/data` - dane demo i dane początkowe
- `src/navigation` - konfiguracja nawigacji
- `src/utils` - helpery i logika dat
- `assets` - ikony i statyczne zasoby

## Uwagi

- aplikacja działa bez backendu
- dane użytkownika są zapisywane lokalnie na urządzeniu
- tryb demo ma rozszerzone mock dane do prezentacji i testów
- wersja web nadaje się do szybkiego klikania i przeglądu interfejsu
- część funkcji mobilnych, szczególnie powiadomienia, najlepiej testować na Android buildzie
