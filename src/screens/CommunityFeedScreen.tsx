import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db } from '../services/firebase/firestore';

export default function CommunityFeedScreen() {
  const [reflections, setReflections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReflections = async () => {
      try {
        const snapshot = await db
          .collection('reflections')
          .orderBy('timestamp', 'desc')
          .limit(50)
          .get();

        const data = snapshot.docs.map((doc) => doc.data());
        setReflections(data);
      } catch (err) {
        console.error('🔥 Error fetching reflections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReflections();
  }, []);

  if (loading) {
    return <Text style={styles.loading}>Loading reflections...</Text>;
  }

  return (
    <FlatList
      data={reflections}
      keyExtractor={(_, idx) => idx.toString()}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.lesson}>📝 Lesson: {item.lessonId}</Text>
          <Text style={styles.content}>{item.content}</Text>
          <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  loading: { marginTop: 40, textAlign: 'center', fontSize: 16 },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  lesson: { fontWeight: 'bold', marginBottom: 4 },
  content: { fontSize: 16, marginBottom: 6 },
  timestamp: { fontSize: 12, color: '#888' },
});
