import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import LessonScreen from './src/screens/LessonScreen';
import RewardScreen from './src/screens/RewardScreen';
import AdminScreen from './src/screens/AdminScreen';
import CommunityFeedScreen from './src/screens/CommunityFeedScreen';

import { signInAnonymously } from './src/services/firebase/auth';
import { initUserProfile } from './src/services/user';

LogBox.ignoreLogs(['AsyncStorage']); // Optional: suppress RN Firebase warning spam

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const setup = async () => {
      try {
        const uid = await signInAnonymously();
        console.log('✅ Signed in anonymously:', uid);

        const userRef = await initUserProfile();
        console.log('📦 Firestore user profile ready at:', userRef.path);
      } catch (error) {
        console.error('🔥 Firebase setup error:', error);
      }
    };

    setup();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Lesson" component={LessonScreen} />
        <Stack.Screen name="Reward" component={RewardScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Community" component={CommunityFeedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
