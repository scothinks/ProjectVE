import DeviceInfo from 'react-native-device-info';
import { sha256 } from 'js-sha256';

export const getHashedDeviceId = async (): Promise<string> => {
  const androidId = await DeviceInfo.getAndroidId();
  return sha256(androidId);
};
