import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import LessonScreen from './src/screens/LessonScreen';
import RewardScreen from './src/screens/RewardScreen';
import AdminScreen from './src/screens/AdminScreen';

import { signInAnonymously } from './src/services/firebase/auth';

LogBox.ignoreLogs(['AsyncStorage']); // Optional: suppress RN Firebase warning spam

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const login = async () => {
      try {
        const uid = await signInAnonymously();
        console.log('✅ Signed in anonymously:', uid);
      } catch (error) {
        console.error('🔥 Firebase sign-in error:', error);
      }
    };
    login();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Lesson" component={LessonScreen} />
        <Stack.Screen name="Reward" component={RewardScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
