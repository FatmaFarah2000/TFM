import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { adaptToHeight, adaptToWidth } from '../../config/Demensions';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api'; 

const CustomHeader = ({ navigation }) => {

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerIconContainerLeft} />
      <Image source={require('../../assets/Logo2.png')} style={styles.headerLogo} resizeMode="contain" />
      <View style={styles.headerIconContainerRight} />
    </View>
  );
};

const NuevaContraseña = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const token = route.params?.token || '';
  
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert(
        'Token Inválido',
        'El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita uno nuevo.',
        [{ text: 'OK', onPress: () => navigation.navigate('CONTRASEÑAOLVIDADA') }]
      );
    }
  }, [token, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => null,
      headerLeft: () => null,
      headerRight: () => null,
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 1, shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 2,
        borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
        height: adaptToHeight(0.12),
      },
      header: ({ navigation }) => <CustomHeader navigation={navigation} />
    });
  }, [navigation]);

  const evaluatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
    if (password && password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
    } else if (password && strength < 3) {
      setPasswordError('La contraseña es débil. Incluye mayúsculas, números y símbolos.');
    } else {
      setPasswordError('');
    }
  };

  const validatePasswordMatch = () => {
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setConfirmError('Las contraseñas no coinciden');
      return false;
    } else {
      setConfirmError('');
      return true;
    }
  };

  const handleResetPassword = async () => {
   
    if (!token) {
        Alert.alert('Error', 'Token de restablecimiento no encontrado.');
        return;
    }
    if (!newPassword) {
      setPasswordError('Por favor, ingresa una nueva contraseña');
      return;
    }
    if (!confirmPassword) {
      setConfirmError('Por favor, confirma tu contraseña');
      return;
    }
    if (passwordStrength < 3) {
      setPasswordError('La contraseña no es lo suficientemente segura');
      return;
    }
    if (!validatePasswordMatch()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
     
      await apiClient.post('/users/reset-password-with-token', {
        token: token,
        new_password: newPassword
      });
      
      Alert.alert(
        'Contraseña actualizada',
        'Tu contraseña ha sido actualizada correctamente',
        navigation.navigate('ESTRESSAID') 
        
      );
    } catch (error) {
   
      let errorMessage = 'No se pudo actualizar la contraseña. Por favor, intenta más tarde.';
      if (error.status === 400) {
        errorMessage = error.message || 'Token inválido o expirado. Solicita un nuevo enlace.';
      } else if (error.status === 404) {
         errorMessage = 'Usuario no encontrado.';
      }
      Alert.alert('Error', errorMessage);
      console.error('Error al cambiar contraseña con token:', error);
   
      if (error.status === 400) {
          navigation.navigate('CONTRASEÑAOLVIDADA');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const renderStrengthIndicator = () => {
    const indicators = [];
    const maxStrength = 5;
    for (let i = 0; i < maxStrength; i++) {
      let color = '#E0E0E0';
      if (i < passwordStrength) {
        if (passwordStrength <= 2) color = '#FF6B6B';
        else if (passwordStrength <= 3) color = '#FFD166';
        else color = '#06D6A0';
      }
      indicators.push(<View key={i} style={[styles.strengthIndicator, { backgroundColor: color }]} />);
    }
    return (
      <View style={styles.strengthContainer}>
        <Text style={styles.strengthLabel}>
          {passwordStrength === 0 ? 'Fortaleza de contraseña' :
           passwordStrength <= 2 ? 'Débil' :
           passwordStrength <= 3 ? 'Media' : 'Fuerte'}
        </Text>
        <View style={styles.strengthIndicators}>{indicators}</View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Crear Nueva Contraseña</Text>
      <Text style={styles.subtitle}>Crea una contraseña segura para proteger tu cuenta.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nueva Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              evaluatePasswordStrength(text);
              if (confirmPassword) validatePasswordMatch();
            }}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#888" />
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={16} color="red" />
            <Text style={styles.errorText}>{passwordError}</Text>
          </View>
        ) : null}
        {renderStrengthIndicator()}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (newPassword) validatePasswordMatch();
            }}
            placeholder="Confirma tu nueva contraseña"
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#888" />
          </TouchableOpacity>
        </View>
        {confirmError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={16} color="red" />
            <Text style={styles.errorText}>{confirmError}</Text>
          </View>
        ) : null}
      </View>

      {/* Botón de actualizar */}
      <TouchableOpacity 
        style={[styles.button, styles.updateButton, isLoading && styles.buttonDisabled]}
        onPress={handleResetPassword} 
        disabled={isLoading || !token}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Actualizar Contraseña</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.cancelButton]} 
        onPress={() => navigation.navigate('LOGIN')} 
        disabled={isLoading}>
        <Text style={styles.buttonText}>Cancelar</Text>
      </TouchableOpacity>

      {/* Consejos de seguridad (igual que antes) */}
      <View style={styles.securityTips}>
         <Text style={styles.securityTipsTitle}>Consejos de seguridad:</Text>
         <View style={styles.tipContainer}><Ionicons name="checkmark-circle" size={16} color="#06D6A0" /><Text style={styles.tipText}>Usa al menos 8 caracteres</Text></View>
         <View style={styles.tipContainer}><Ionicons name="checkmark-circle" size={16} color="#06D6A0" /><Text style={styles.tipText}>Combina letras mayúsculas y minúsculas</Text></View>
         <View style={styles.tipContainer}><Ionicons name="checkmark-circle" size={16} color="#06D6A0" /><Text style={styles.tipText}>Incluye números y símbolos</Text></View>
         <View style={styles.tipContainer}><Ionicons name="checkmark-circle" size={16} color="#06D6A0" /><Text style={styles.tipText}>Evita información personal o palabras comunes</Text></View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: adaptToHeight(0.04),
    paddingBottom: 10,
    height: adaptToHeight(0.12),
    backgroundColor: '#FFFFFF',
  },
  headerIconContainerLeft: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerIconContainerRight: {
    width: 40,
  },
  headerLogo: {
    width: adaptToWidth(0.35),
    height: adaptToHeight(0.045),
  },
  
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: adaptToWidth(0.07),
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: adaptToWidth(0.04),
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
    width: '90%',
  },
  label: {
    fontSize: adaptToWidth(0.04),
    color: '#555',
    marginBottom: 8,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    height: adaptToHeight(0.06),
    width: '100%',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: adaptToWidth(0.04),
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    color: 'red',
    fontSize: adaptToWidth(0.035),
    marginLeft: 5,
  },
  strengthContainer: {
    marginTop: 10,
  },
  strengthLabel: {
    fontSize: adaptToWidth(0.035),
    color: '#666',
    marginBottom: 5,
  },
  strengthIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthIndicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '90%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  updateButton: {
    backgroundColor: '#7B68EE',
  },
  cancelButton: {
    backgroundColor: '#A8C3A9',
    marginTop: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#B8B5D1',
    elevation: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: adaptToWidth(0.045),
    fontWeight: '600',
  },
  securityTips: {
    width: '90%',
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F8F7FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7B68EE',
  },
  securityTipsTitle: {
    fontSize: adaptToWidth(0.04),
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  tipText: {
    fontSize: adaptToWidth(0.035),
    color: '#555',
    marginLeft: 8,
  },
});

export default NuevaContraseña;

