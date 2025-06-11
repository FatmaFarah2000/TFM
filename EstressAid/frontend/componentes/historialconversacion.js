import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConversationHistory } from '../api'; 
import { useNavigation } from '@react-navigation/native';

const Historialconversacion = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userId = await AsyncStorage.getItem('user_id');
        if (!userId) {
          throw new Error('No se pudo encontrar el ID de usuario.');
        }
        const fetchedHistory = await getConversationHistory(userId);
       
        setHistory(Array.isArray(fetchedHistory) ? fetchedHistory : []);
      } catch (err) {
        console.error("Error fetching conversation history:", err);
        setError(err.message || 'No se pudo cargar el historial.');
        Alert.alert("Error", err.message || 'No se pudo cargar el historial.');
      
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
    
      <Text style={[styles.messageText, item.sender === 'user' ? styles.userMessageText : styles.botMessageText]}>
        {item.text}
      </Text>
      <Text style={styles.timestampText}>
       
        {item.timestamp instanceof Date
          ? item.timestamp.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          : new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1a2431" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
     
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.emptyText}>No hay historial de conversaciones disponible.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.sender}-${item.timestamp?.toISOString()}-${index}`}
        style={styles.flatList}
        contentContainerStyle={styles.messagesContainer}
        inverted={false} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  emptyText: {
      fontSize: 16,
      color: '#555',
      textAlign: 'center',
  },
  flatList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  messageBubble: {
    padding: 12,
    marginVertical: 5,
    borderRadius: 18,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e8eaef',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#d9c9f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: { color: '#353535' },
  botMessageText: { color: '#353535' },
  topicText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  timestampText: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});

export default Historialconversacion;

