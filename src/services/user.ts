import { db } from './firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getHashedDeviceId } from './device-id';

export const initUserProfile = async () => {
  const firebaseUser = auth().currentUser;
  if (!firebaseUser) throw new Error('Not signed in.');

  const deviceId = await getHashedDeviceId();
  const userRef = db.collection('users').doc(deviceId);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    await userRef.set({
      device_id: deviceId,
      auth_uid: firebaseUser.uid,
      points: 0,
      streak: 0,
      last_lesson_date: null,
      completed_lessons: [],
      redemption_requests: [],
    });
    console.log(`🆕 New user profile created: ${deviceId}`);
  } else {
    console.log(`👤 Existing user loaded: ${deviceId}`);
  }

  return userRef;
};
