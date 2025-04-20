import React from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to ProjectVE</Text>
      <Button title="Go to Lesson" onPress={() => navigation.navigate('Lesson')} />
      <Button title="Go to Reward" onPress={() => navigation.navigate('Reward')} />
      <Button title="Admin Panel" onPress={() => navigation.navigate('Admin')} />
    </View>
  );
}
