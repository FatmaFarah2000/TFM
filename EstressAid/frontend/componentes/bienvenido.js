import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Dimensions, { adaptToHeight, adaptToWidth } from '../../config/Demensions';

const Bienvenido = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require("../../assets/Logo3.png")} 
          style={styles.logoMain}
          resizeMode="contain"
        />
        <Image 
          source={require("../../assets/Logo2.png")} 
          style={styles.logoText}
          resizeMode="contain"
        />
      </View>   

      <Text style={styles.title}>Bienvenido a EstressAid</Text>
      <Text style={styles.subtitle}>Tu compañero para gestionar el estrés</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('LOGIN')}
      >
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.signupButton]} 
        onPress={() => navigation.navigate('CREARCUENTA')}
      >
        <Text style={styles.buttonText}>Crear Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoMain: {
    width: adaptToWidth(0.5), 
    height: adaptToHeight(0.2),
    marginBottom: 10,
  },
  logoText: {
    width: adaptToWidth(0.9), 
    height: adaptToHeight(0.1),
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#A8C3A9",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25, 
    width: '85%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3, 
  },
  signupButton: {
    backgroundColor:'#D7CFFA' ,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Bienvenido;
