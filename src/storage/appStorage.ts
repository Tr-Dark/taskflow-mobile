import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../types';

const STORAGE_KEY = 'taskflow-mobile-state-v1';

export async function loadAppState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RootState;
  } catch {
    return null;
  }
}

export async function saveAppState(state: RootState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearAppState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
