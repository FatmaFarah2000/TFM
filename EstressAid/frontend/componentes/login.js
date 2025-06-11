import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { adaptToHeight, adaptToWidth } from '../../config/Demensions';
import { loginUser, loginWithGoogle } from '../api';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = ({ navigation }) => {
  const [email, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
 

  const handleLogin = async () => {
    if (!email|| !password) {
      Alert.alert('Error', 'Por favor ingresa tu nombre de usuario y contraseña');
      return;
    }
    
    setLoading(true);
    try {
      const loginData= {
        email,
        password,
      };
      console.log("Datos a enviar:", loginData);
      const response = await loginUser(loginData);
      console.log('Login exitoso:', response);
      
      navigation.navigate("ESTRESSAID");
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
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
        <Text style={styles.sectionTitle}>Iniciar sesión</Text>
        
        <Text style={styles.inputLabel}>Correo electrónico</Text>
        <TextInput 
          style={styles.input} 
          value={email}
          onChangeText={setUserEmail}
          autoCapitalize="none"
          placeholder="Ingresa tu correo electrónico"
        />
        
        <Text style={styles.inputLabel}>Contraseña</Text>
        <TextInput 
          style={styles.input} 
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Ingresa tu contraseña"
        />
        
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Cargando...' : 'Acceso'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <TouchableOpacity
        style={styles.googleButton}
      
        >
          <Image 
            source={require('../../assets/Google.webp')} 
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Iniciar sessión con Google</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomLinks}>
          <Text style={styles.link}>¿No tienes una cuenta? <Text style={styles.linkHighlight} onPress={() => navigation.navigate("CREARCUENTA")}>Regístrate</Text></Text>
          <Text style={styles.linkHighlight} onPress={() => navigation.navigate("CONTRASEÑAOLVIDADA")}>¿Olvidaste tu contraseña?</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  disabledButton: {
    opacity: 0.6,
  },
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
  },
  inputLabel: {
    fontSize: 16,
    fontWeight:'600',
    color: '#555',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  input: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#D7CFFA',
    width: '100%',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  primaryButtonText: {
    color: '#FFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#888',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    width: '100%',
    height: 50,
    marginBottom: 15,
  },
  googleIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 20
  },
  googleButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '500', 
  },
  bottomLinks: {
    width: '100%',
    marginTop: 'auto', 
    alignItems: 'center',
    paddingBottom: 20, 
  },
  link: {
    color: '#666',
    fontSize: 14,
   
    marginVertical: 5,
  },
  linkHighlight: {
    color: '#333',
    fontWeight: '500',
  },
});

export default Login;