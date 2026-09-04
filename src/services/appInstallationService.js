import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALLATION_ID_STORAGE_KEY = 'autobingo:installation-id:v1';

function createInstallationId() {
  const randomParts = Array.from({ length: 3 }, () => Math.random().toString(36).slice(2, 10));
  return `install-${Date.now().toString(36)}-${randomParts.join('')}`;
}

export async function getOrCreateInstallationId() {
  const storedInstallationId = await AsyncStorage.getItem(INSTALLATION_ID_STORAGE_KEY);

  if (storedInstallationId) {
    return storedInstallationId;
  }

  const installationId = createInstallationId();
  await AsyncStorage.setItem(INSTALLATION_ID_STORAGE_KEY, installationId);
  return installationId;
}
