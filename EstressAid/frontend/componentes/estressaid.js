import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLayoutEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { botService } from '../api';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Dimensions, { adaptToHeight, adaptToWidth } from '../../config/Demensions';

const logoIconPath = require('../../assets/Logo3.png');
const headerLogoPath = require('../../assets/Logo2.png');

const Estressaid = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [isInitializing, setIsInitializing] = useState(true); 
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      setIsInitializing(true); 
      let currentUserId = null;
      try {
        const storedUserId = await AsyncStorage.getItem("user_id");
        if (storedUserId) {
          currentUserId = storedUserId;
          setUserId(storedUserId);
          await botService.startConversation(storedUserId);
        } else { console.warn("User ID not found during chat initialization."); }

        if (currentUserId) {
          setIsLoading(true); 
          try {
            const initialPrompt = "Hola"; 
            const response = await botService.sendMessage(initialPrompt);
            const initialBotMessage = {
              text: response.response,
              sender: 'bot',
              timestamp: new Date(),
              topic: response.topic || 'Bienvenida',
              isError: response.isError || false
            };
            setMessages([initialBotMessage]); 
          } catch (botError) {
            console.error("Error getting initial bot message:", botError);
            const initialErrorMessage = {
              text: botError.message || "No se pudo obtener el saludo inicial del bot.",
              sender: 'bot',
              timestamp: new Date(),
              isError: true
            };
            setMessages([initialErrorMessage]);
          } finally {
            setIsLoading(false); 
          }
        }
      
      } catch (error) {
        console.error("Error initializing chat session:", error);
        const sessionErrorMessage = {
          text: "Hubo un problema al iniciar la sesión de chat.",
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        };
        setMessages([sessionErrorMessage]);
      } finally {
        setIsInitializing(false);
      }
    };
    initializeChat()
    return () => {
      if (messages && messages.length > 1) {
        saveConversation();
      }
    };
  }, []); 

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);}
    );
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);}
    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages]);

  const saveConversation = async () => {
    if (isSaving || !userId || !messages || messages.length <= 1) return;
    setIsSaving(true);
    try {
      await botService.endConversation();
    } catch (error) {
      console.error("Error saving conversation:", error);
      Alert.alert("Error", "No se pudo guardar la conversación.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading || isInitializing) return; 
    const userMessageText = inputValue;
    const userMessage = { text: userMessageText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    try {
      const response = await botService.sendMessage(userMessageText);
      const botMessage = { text: response.response, sender: 'bot', topic: response.topic || 'General', timestamp: new Date(), isError: response.isError || false };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { text: error.message || "Error al conectar con el bot.", sender: 'bot', isError: true, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userMessage : styles.botMessage, item.isError && styles.errorMessage]}>
      {item.topic && item.sender === 'bot' && !item.isError && (
        <Text style={styles.topicText}>Tema: {item.topic}</Text>
      )}
      <Text style={[styles.messageText, item.sender === 'user' ? styles.userMessageText : styles.botMessageText, item.isError && styles.errorText]}>
        {item.text}
      </Text>
      <Text style={styles.timestampText}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const handlePress = () => navigation.openDrawer();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handlePress} style={styles.headerIconContainer}>
          <Ionicons name="menu-outline" size={28} color="#1a2431" />
        </TouchableOpacity>
      ),
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Image source={headerLogoPath} style={styles.headerLogoIcon} resizeMode="contain" />
      ),
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e8eaef',
      },
    });
  }, [navigation]);

  const keyboardVerticalOffset = Platform.OS === 'ios' ? 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.backgroundLogoContainer} pointerEvents="none">
          <Image
            source={logoIconPath}
            style={[styles.backgroundLogo, styles.backgroundLogoIcon]}
            resizeMode="contain"
          />
        </View>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <View style={styles.contentWrapper}>
            {isInitializing ? (
              <View style={styles.centeredContainer}> 
                <ActivityIndicator size="large" color="#1a2431" />
                <Text style={styles.loadingText}>Iniciando chat...</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.sender}-${item.timestamp?.toISOString()}-${index}`}
                style={styles.flatList}
                contentContainerStyle={styles.messagesContainer}
              />
            )}
            <View style={styles.inputContainer}>
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Escribe tu mensaje..."
                placeholderTextColor="#999"
                style={styles.inputField}
                editable={!isLoading && !isInitializing} 
                multiline={true}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                style={styles.sendButton}
                disabled={isLoading || isInitializing || inputValue.trim() === ''} 
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#1a2431" />
                ) : (
                  <Ionicons name="send" size={24} color="#1a2431" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundLogo: {
    opacity: 0.2,
  },
  backgroundLogoIcon: {
    width: adaptToWidth(0.9),
    height: adaptToHeight(0.6),
    marginBottom: 5,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    zIndex: 1,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centeredContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  headerIconContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerLogoIcon: {
    width: adaptToWidth(0.30),
    height: adaptToHeight(0.05),
  },
  flatList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
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
  errorMessage: {
    backgroundColor: '#ffebee',
    borderColor: '#ef5350',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: { color: '#353535' },
  botMessageText: { color: '#353535' },
  errorText: { color: '#d32f2f' },
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
  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#dcdcdc',
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    color: '#1a2431',
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
});

export default Estressaid;

