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
- Na ekranie `Today` dodano swipe actions:
  - aktywne zadanie: `Wykonaj` lub `Wstrzymaj`
  - wykonane zadanie: `Przywróć`
- Nazewnictwo kolejek zostało uproszczone:
  - `Zaplanowane wkrótce`
  - `Zaplanowane później`
  - `Wstrzymane`
- `Później` ustawia teraz zadanie na około 14 dni do przodu.
- W szczegółach zadania dodano osobną szybką akcję `Daleko` (około 60 dni do przodu).
- `Planner` pokazuje już tylko aktywne zadania przypisane do wybranego dnia.
- Sekcja `Niezaplanowane na ten dzień` została wyniesiona wyżej, a modal dodawania do slotu pokazuje tylko zadania bez godziny.
- Godziny planera są teraz ustawiane przez użytkownika w `Settings` (`plannerStartHour` / `plannerEndHour`).
- `TaskDetails` i `Planner` korzystają z tego samego zakresu godzin.
- `Planner` działa teraz na slotach 15-minutowych, więc zadania typu `8:00-8:15` i `8:30-9:00` są widoczne osobno.
- Zadania z godziną poza aktualnym zakresem planera są traktowane jak `bez godziny` na dany dzień.
- `Planner` pozwala już na nakładające się zadania; są one rozkładane na osobne poziome widoki całego grafiku zamiast wciskania wielu kart w jeden slot.
- Główny widok planera pozostaje czysty, a dodatkowe konfliktujące zadania można zobaczyć, przesuwając cały harmonogram w bok.
- Krótkie bloki w planerze mają uproszczone renderowanie:
  - bardzo krótkie pokazują tylko tytuł
  - krótkie pokazują tytuł i czas
  - dłuższe mogą pokazać też kategorię
- Tytuły i kategorie w blokach są przycinane wielokropkiem, żeby nie rozpychały małych slotów.
- Planer ma też linię aktualnego czasu dla bieżącego dnia; pojawia się w odpowiednim miejscu siatki albo wewnątrz trwającego bloku.
- Podsumowanie planera rozróżnia teraz sumę czasów zadań od realnie zajętego czasu, żeby overlapy nie psuły obrazu dnia.
- Dodano ekran `FAQ / Help` dostępny z `Settings`.
- Przygotowano gotowy prompt do generowania ikon w `notes/icon_generation_prompt.md`.
- Krótkie bloki w `Planner` mają teraz bardziej kompaktowy wygląd, z lepszą czytelnością dla 15-minutowych zadań.
- `app.json` korzysta teraz z wygenerowanych ikon `taskflow-icon`, `taskflow-splash-icon` i `taskflow-favicon`.
- Projekt jest przygotowany do Android build:
  - `expo.android.package = com.taskflow.mobile`
  - `expo.android.versionCode = 1`
  - `expo.scheme = taskflow`
  - `eas.json` ma profile `development`, `preview`, `production`
  - `package.json` ma skrypty `build:android:*`
- Dodano instrukcję builda w `notes/android_build.md`.
- Dodano bezpośrednio `expo-font@~14.0.11`, dzięki czemu `@expo/vector-icons` i `expo` używają tej samej wersji bez duplikatów.
- Android launcher icon korzysta teraz z `taskflow-icon.png` jako `adaptiveIcon.foregroundImage` zamiast starego domyślnego assetu Expo.
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
