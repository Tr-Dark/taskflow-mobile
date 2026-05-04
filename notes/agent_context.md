# TaskFlow Agent Context

## Cel projektu
- Mobilna aplikacja `TaskFlow` na `React Native + Expo + TypeScript`.
- Aplikacja ma działać realnie bez backendu, z lokalnym zapisem danych na telefonie.
- Projekt jest rozwijany pod pracę dyplomową i WKCK, ale ma też być używalny na co dzień.

## Aktualna architektura
- Stan aplikacji jest przechowywany lokalnie w `AsyncStorage`.
- Są dwa zestawy danych:
  - `demo`
  - `personal`
- Ekrany główne:
  - `Today`
  - `Queue`
  - `Planner`
  - `Notes`
  - `Extras`
- Ekrany stack:
  - `QuickAdd`
  - `TaskDetails`
  - `NoteEditor`
  - `History`
  - `Settings`

## Zaimplementowane ważne funkcje
- Lokalny zapis danych.
- Tryb demo i prywatny.
- Kategorie własne.
- Edycja koloru kategorii z poziomu ustawień.
- Status `odłożone`.
- Planer dnia z godzinami i wykrywaniem konfliktów.
- Historia / archiwum dni.
- Theme `light/dark`.
- Ustawienia języka: `pl`, `en`, `uk`.
- Ustawienia rozmiaru tekstu: `small`, `medium`, `large`.
- Safe area i poprawki pod wycięcia telefonu.
- Toast/snackbar dla akcji użytkownika.
- Demo-synchronizacja.
- Import / eksport backupu JSON.
- Moduł `Notatki`.
- Lokalne powiadomienia dla aktywnego zestawu danych.
- Fallback dla `Expo Go` przy ograniczeniach `expo-notifications`.
- Lekkie checklisty (`subtaski`) wewnątrz zadania, bez osobnych dat i czasu.

## Co zostało poprawione w obecnej iteracji
- Usunięto twardy import `expo-notifications`, żeby uniknąć problemów w `Expo Go`.
- Dodano komunikat w `Settings`, że pełne testy powiadomień wymagają development build.
- `Settings` pozwalają teraz zmieniać:
  - motyw
  - język
  - rozmiar tekstu
  - kolor kategorii
- Najważniejsze ekrany i komponenty zaczęły korzystać z `useI18n()` i skalowania tekstu.
- Dokończono lokalizację i skalowanie tekstu na kolejnych ekranach:
  - `Planner`
  - `Notes`
  - `History`
  - `NoteEditor`
  - `Extras`
- Dodano lokalizowane helpery dla:
  - formatowania dat
  - list sekcji notatek
- Dodano wyszukiwanie i filtry na ekranach:
  - `Today`
  - `Queue`
  - `Notes`
- Dodano prosty checklist editor na ekranie `TaskDetails`.
- Na listach zadań widać postęp checklisty (`wykonane/całość`).
- Wyszukiwanie zadań obejmuje też tytuły punktów checklisty.
- W interakcyjnych elementach poprawiono:
  - `accessibilityRole`
  - minimalne rozmiary tap targetów
  - sygnalizację wyboru nie tylko kolorem, ale też ikoną `check`

## Notatki WCAG 2.1
- Wdrożone:
  - większe cele dotykowe dla głównych akcji
  - skalowanie typografii
  - poprawki safe area / keyboard overlap
  - selekcje nie opierają się wyłącznie na kolorze
  - lepsza czytelność ustawień i formularzy
- Nadal warto sprawdzić ręcznie na urządzeniu:
  - kontrast w każdej sekcji trybu dark
  - czy wszystkie ekrany z długą treścią dobrze zachowują się przy największym font size
  - spójność lokalizacji w mniej uczęszczanych ekranach (`Planner`, `Notes`, `Extras`, `History`)

## Kolejne sensowne kroki
- Dokończyć pełną lokalizację mniej krytycznych komunikatów systemowych i toastów.
- Rozszerzyć audit WCAG o ręczne przejście po wszystkich ekranach.
- Lepsze planowanie automatyczne (najbliższy wolny slot).
- Subtaski rozszerzone tylko jeśli kiedyś będą naprawdę potrzebne; obecnie zostajemy przy lekkiej wersji checklist.
