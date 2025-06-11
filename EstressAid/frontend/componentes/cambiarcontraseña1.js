import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { adaptToHeight, adaptToWidth } from '../../config/Demensions';
import { Ionicons } from '@expo/vector-icons';

import { resetPasswordWithToken } from '../api'; 
import Cambiarcontraseña from './cambiarcontraseña';

const ResetPasswordHeader = ({ navigation }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity onPress={() => navigation.replace('LOGIN')} style={styles.headerIconContainerLeft}>
      <Ionicons name="arrow-back-outline" size={styles.headerIcon.width + 5} color={styles.headerIcon.tintColor} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Restablecer Contraseña</Text>
    <View style={styles.headerIconContainerRight} />
  </View>
);

function Cambiarcontraseña1() {
  const route = useRoute();
  const navigation = useNavigation();
  const token = route.params?.token;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: ({ navigation }) => <ResetPasswordHeader navigation={navigation} />,
    });
  }, [navigation]);

  const handleResetPassword = async () => {
    // Validaciones
    if (!token) {
      Alert.alert('Error', 'Token inválido o no encontrado. Por favor, solicita el restablecimiento de nuevo.');
      navigation.replace('LOGIN'); 
      return;
    }
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor, introduce y confirma la nueva contraseña.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
  
      await resetPasswordWithToken(token, newPassword);
      Alert.alert(
        'Éxito',
        'Contraseña restablecida correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
        [{ text: 'OK', onPress: () => navigation.replace('LOGIN') }] 
      );
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);

      Alert.alert('Error', `No se pudo restablecer la contraseña: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nueva Contraseña</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirma tu nueva contraseña"
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.updateButton, isLoading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Actualizar Contraseña</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerIconContainerLeft: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerIconContainerRight: {
    width: 40,
  },
  headerIcon: {
    width: 25,
    height: 25,
    tintColor: '#333',
  },
  headerTitle: {
    fontSize: adaptToWidth(0.05), 
    fontWeight: '600',
    color: '#333',
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
  input: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: adaptToHeight(0.06),
    fontSize: adaptToWidth(0.04),
    color: '#333',
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20, 
    width: '90%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  updateButton: {
    backgroundColor: '#D7CFFA',
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#D8BFD8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: adaptToWidth(0.045),
    fontWeight: '600',
  },
});

export default Cambiarcontraseña1;

