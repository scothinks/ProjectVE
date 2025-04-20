import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, Button, TextInput, StyleSheet, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sampleLesson } from '../data/lessons';
import { db } from '../services/firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getHashedDeviceId } from '../services/device-id';
import { useInterval } from '../utils/useInterval';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

interface LessonPage {
  id: string;
  type: 'content' | 'quiz' | 'reflection';
  title?: string;
  question?: string;
  options?: string[];
  answerIndex?: number;
  prompt?: string;
}

export default function LessonScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [reflectionText, setReflectionText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [reflectionMeta, setReflectionMeta] = useState<{ id: string, deviceId: string } | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation();
  const current = sampleLesson.pages[currentPage] as LessonPage;
  const quizPages = sampleLesson.pages.filter(p => p.type === 'quiz');

  // Get server time offset on mount
  useEffect(() => {
    const getServerTime = async () => {
      try {
        const docRef = db.collection('metadata').doc('serverTime');
        const doc = await docRef.get();
        const serverTime = doc.exists ? doc.get('timestamp')?.toDate() : null;
        if (serverTime) {
          const offset = Date.now() - serverTime.getTime();
          setServerTimeOffset(offset);
        }
      } catch (error) {
        console.error('Failed to get server time:', error);
      }
    };
    getServerTime();
  }, []);

  useEffect(() => {
    const checkLessonLock = async () => {
      try {
        const stored = await AsyncStorage.getItem(`lesson_${sampleLesson.id}`);
        if (stored) {
          // TESTING: 2 minute lock instead of 24 hours
          const lockDuration = 2 * 60 * 1000; // 2 minutes for testing
          const diff = Date.now() - new Date(stored).getTime();
          if (diff < lockDuration) setIsLocked(true);
        }
      } catch (error) {
        console.error('Error checking lesson lock:', error);
      }
    };
    checkLessonLock();
  }, []);

  const updateCountdown = () => {
    const adjustedTime = Date.now() - serverTimeOffset;
    const now = new Date(adjustedTime);
    const nextUnlock = new Date(now.getTime() + (2 * 60 * 1000)); // 2 minute lock
    nextUnlock.setSeconds(0); // Align to whole minute
    
    const diffMs = nextUnlock.getTime() - adjustedTime;
    if (diffMs <= 0) {
      setIsLocked(false);
      return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    setCountdown(`${minutes}m ${seconds}s`);
  };

  useInterval(updateCountdown, isLocked ? 1000 : null);

  const handleQuizSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Calculate score based on all quiz answers
      const score = quizPages.reduce((acc, page) => {
        return acc + (quizAnswers[page.id] === page.answerIndex ? 1 : 0);
      }, 0);

      setQuizScore(score);
      setQuizSubmitted(true);
      setCurrentPage(p => p + 1);

      const deviceId = await getHashedDeviceId();
      const userRef = db.collection('users').doc(deviceId);
      const userDoc = await userRef.get();

      const lessonData = {
        lessonId: sampleLesson.id,
        date: firestore.FieldValue.serverTimestamp(),
        score,
        total: quizPages.length,
        points: score,
      };

      await userRef.set({
        points: (userDoc.data()?.points || 0) + score,
        last_lesson_date: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      const lessonRef = await userRef.collection('completed_lessons').add(lessonData);
      setReflectionMeta({ id: lessonRef.id, deviceId });

      // Store lock time using server timestamp
      const serverTime = Date.now() - serverTimeOffset;
      await AsyncStorage.setItem(`lesson_${sampleLesson.id}`, new Date(serverTime).toISOString());
      
    } catch (error) {
      Alert.alert('Submission Error', 'Failed to submit quiz results');
      console.error('Quiz submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReflectionSubmit = async () => {
    if (!reflectionMeta || !reflectionText.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      await db.collection('users')
        .doc(reflectionMeta.deviceId)
        .collection('completed_lessons')
        .doc(reflectionMeta.id)
        .update({
          reflection: reflectionText.trim(),
          points: firestore.FieldValue.increment(1),
          reflection_date: firestore.FieldValue.serverTimestamp()
        });

      await db.collection('reflections').add({
        lessonId: sampleLesson.id,
        content: reflectionText.trim(),
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      setIsSubmitted(true);
      setIsLocked(true);

    } catch (error) {
      Alert.alert('Submission Error', 'Failed to submit reflection');
      console.error('Reflection submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContentPage = (page: LessonPage) => (
    <View>
      <Text style={styles.pageTitle}>{page.title}</Text>
      {page.image && <Image source={page.image} style={styles.image} />}
      <Text style={styles.text}>{page.text}</Text>
    </View>
  );

  const renderQuizPage = (page: LessonPage) => (
    <View>
      <Text style={styles.pageTitle}>{page.question}</Text>
      {page.options?.map((opt, idx) => (
        <Button
          key={idx}
          title={opt}
          onPress={() => setQuizAnswers(prev => ({...prev, [page.id]: idx}))}
          color={
            quizAnswers[page.id] === idx 
              ? (idx === page.answerIndex ? 'green' : 'red')
              : undefined
          }
        />
      ))}
      {!quizSubmitted && (
        <Button
          title={isSubmitting ? "Submitting..." : "Submit Quiz"}
          onPress={handleQuizSubmit}
          disabled={isSubmitting || typeof quizAnswers[page.id] === 'undefined'}
        />
      )}
      {quizSubmitted && (
        <Text style={styles.feedback}>
          🎯 You scored {quizScore}/{quizPages.length} points!
        </Text>
      )}
    </View>
  );

  const renderReflectionPage = (page: LessonPage) => {
    if (!quizSubmitted) {
      return <Text style={styles.info}>🧠 Complete the quiz first to unlock reflection.</Text>;
    }
    return (
      <View>
        <Text style={styles.pageTitle}>{page.prompt}</Text>
        <TextInput
          multiline
          placeholder="Type your reflection..."
          value={reflectionText}
          onChangeText={setReflectionText}
          style={styles.input}
        />
        <Button
          title={isSubmitting ? "Submitting..." : "Submit Reflection & Finish"}
          onPress={handleReflectionSubmit}
          disabled={isSubmitted || !reflectionText.trim() || isSubmitting}
        />
        {isSubmitted && (
          <Text style={styles.feedback}>✅ Lesson submitted. See you tomorrow!</Text>
        )}
      </View>
    );
  };

  const renderPage = () => {
    if (current.type === 'content') return renderContentPage(current);
    if (current.type === 'quiz') return renderQuizPage(current);
    if (current.type === 'reflection') return renderReflectionPage(current);
    return null;
  };

  if (isLocked) {
    return (
      <View style={styles.centered}>
        <Text style={styles.locked}>⏳ Next lesson unlocks in: {countdown}</Text>
        <Text style={styles.subtext}>✨ Check out today’s reflections from the community.</Text>
        <Button title="Go to Community Feed" onPress={() => navigation.navigate("Community")} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.lessonTitle}>{sampleLesson.title}</Text>
      {renderPage()}
      <View style={styles.navButtons}>
        {currentPage > 0 && (
          <Button 
            title="Back" 
            onPress={() => setCurrentPage(p => p - 1)} 
            disabled={isSubmitting}
          />
        )}
        {!isSubmitted && currentPage < sampleLesson.pages.length - 1 && (
          <Button 
            title="Next" 
            onPress={() => setCurrentPage(p => p + 1)} 
            disabled={isSubmitting}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  lessonTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  pageTitle: { fontSize: 18, fontWeight: '600', marginVertical: 10 },
  text: { fontSize: 16, marginBottom: 20 },
  image: { width: '100%', height: 200, resizeMode: 'contain', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, minHeight: 80 },
  feedback: { fontSize: 16, marginTop: 10, color: 'green' },
  info: { fontSize: 14, fontStyle: 'italic', marginBottom: 10 },
  locked: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 10 },
  subtext: { fontSize: 14, marginTop: 10, marginBottom: 20, color: '#888', textAlign: 'center' },
  navButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }
});