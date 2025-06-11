// Contraseñaolvidada_jwt.js
// Versión adaptada para enviar enlace de reseteo por email (JWT)

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Dimensions, { adaptToHeight, adaptToWidth } from '../../config/Demensions';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api'; // Asegúrate que apiClient esté configurado

const Contraseñaolvidada = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSendRequest = async () => {
    // Validación básica
    if (!email) {
      setEmailError('Por favor, ingresa tu dirección de email.');
      setSuccessMessage('');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Por favor, ingresa un correo electrónico válido.');
      setSuccessMessage('');
      return;
    }

    setEmailError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // Llamada al nuevo endpoint para solicitar el enlace de reseteo
      const response = await apiClient.post('/users/request-password-reset', { email });
      
      // Mostrar mensaje de éxito (el backend devuelve el mismo mensaje exista o no el email)
      setSuccessMessage(response.data.message || 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.');
      setEmail(''); // Limpiar campo de email

    } catch (error) {
      // Manejo de errores genéricos (ej. error de red, error 500 del servidor)
      setEmailError(error.message || 'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.');
      console.error('Error al solicitar reseteo de contraseña:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        {/* Logo - Sin cambios */}
        <View style={styles.logocontainer}>
          <View style={styles.logocontainer1}>
            <Image 
              source={require("../../assets/Logo3.png")} 
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.logocontainer2} >
            <Image 
              source={require("../../assets/Logo2.png")} 
              style={styles.logoIcon2}
            />
          </View>
        </View>   
        <Text style={styles.sectionTitle}>Recuperar Contraseña</Text>
        
        <Text style={styles.instructions}>
          Introduce tu dirección de email y te enviaremos un enlace con instrucciones para restablecer tu contraseña.
        </Text>
        
        <Text style={styles.inputLabel}>Dirección de email</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={24} color="#888" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
              setSuccessMessage('');
            }}
            placeholder="Ingresa tu email"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>
        
        {/* Mostrar mensaje de error o éxito */}        
        {emailError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={16} color="red" />
            <Text style={styles.errorText}>{emailError}</Text>
          </View>
        ) : null}
        {successMessage ? (
           <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle-outline" size={16} color="green" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}
        
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleSendRequest}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>ENVIAR ENLACE</Text> // Texto del botón actualizado
          )}
        </TouchableOpacity>
        
        {/* Enlaces inferiores - Sin cambios */}
        <View style={styles.bottomLinks}>
          <Text style={styles.link}>
            ¡Ya me acuerdo! <Text style={styles.linkHighlight} onPress={() => navigation.navigate("LOGIN")}>Iniciar sesión</Text>
          </Text>
          <Text style={styles.link}>
            ¿Aún no tienes cuenta? <Text style={styles.linkHighlight} onPress={() => navigation.navigate("CREARCUENTA")}>REGÍSTRATE AQUÍ</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Estilos (mantener los estilos mejorados de Contraseñaolvidada_mejorado.js)
const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logocontainer: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logocontainer1: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logocontainer2: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: adaptToWidth(0.2),
    height: adaptToHeight(0.1),
  },
  logoIcon2: {
    alignItems: 'center',
    justifyContent: 'center',
    width: adaptToWidth(0.7),
    height: adaptToHeight(0.05),
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: '600',
    paddingTop: 20,
    paddingBottom: 40,
    color: '#333',
  },
  instructions: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    alignSelf: 'flex-start',
    fontWeight: '600',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 5,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginLeft: 5,
  },
   successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 5,
    marginBottom: 10,
    paddingHorizontal: 5,
    backgroundColor: '#E8F5E9', // Fondo verde claro
    paddingVertical: 8,
    borderRadius: 4,
    width: '100%',
  },
  successText: {
    color: 'green',
    fontSize: 14,
    marginLeft: 5,
    flexShrink: 1, // Permite que el texto se ajuste
  },
  primaryButton: {
    backgroundColor: '#7B68EE',
    width: '100%',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#B8B5D1',
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomLinks: {
    width: '100%',
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 30,
  },
  link: {
    color: '#666',
    fontSize: 14,
    marginVertical: 5,
  },
  linkHighlight: {
    color: '#7B68EE',
    fontWeight: '500',
  },
});

export default Contraseñaolvidada;

