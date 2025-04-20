import { db } from './firebase/firestore';
import { getHashedDeviceId } from './device-id';

export const initUser = async () => {
  const deviceId = await getHashedDeviceId();
  const userRef = db.collection('users').doc(deviceId);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      device_id: deviceId,
      email: null,
      points: 0,
      streak: 0,
      completed_modules: [],
      redemption_log: [],
    });
  }

  return userRef;
};
