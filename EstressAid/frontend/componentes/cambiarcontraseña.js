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
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adaptToHeight, adaptToWidth } from '../../config/Demensions';
import { Ionicons } from '@expo/vector-icons'; 
import { updateUserProfile } from '../api';

const CustomHeader = ({ navigation }) => {
  const handlePress = () => {
  
    if (navigation.canGoBack()) {
      navigation.goBack();
    } 
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity title='Go Back' onPress={handlePress} style={styles.headerIconContainerLeft}>
        <Ionicons name="arrow-back-outline" size={styles.headerIcon.width + 5} color={styles.headerIcon.tintColor} />
      </TouchableOpacity>
      <Image source={require('../../assets/Logo2.png')} style={styles.headerLogo} resizeMode="contain" />
      <View style={styles.headerIconContainerRight} /> 
    </View>
  );
};

const Cambiarcontraseña = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => null,
      headerLeft: () => null,
      headerRight: () => null,
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 1,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        height: adaptToHeight(0.12),
      },
      header: ({ navigation }) => <CustomHeader navigation={navigation} />
    });
  }, [navigation]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('user_id');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          throw new Error('User ID not found');
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
        Alert.alert('Error', 'No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
        navigation.goBack(); 
      }
    };
    fetchUserId();
  }, [navigation]);

  const handleChangePassword = async () => {
    // ... (validaciones existentes)
    if (!userId) {
        Alert.alert('Error', 'No se pudo identificar al usuario.');
        return;
    }

    setIsLoading(true);
    try {
      const passwordData = {
     
        password: currentPassword,
        new_password: newPassword, 
      };
 
      console.log("Intentando cambiar contraseña para user:", userId, "con datos:", {password: '***', new_password: '***'});
      await updateUserProfile(userId, passwordData); 

      Alert.alert('Éxito', 'Contraseña actualizada correctamente.');
      navigation.goBack();

    } catch (error) {
      console.error("Error actualizando contraseña:", error);
      let errorMessage = 'No se pudo actualizar la contraseña.';
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        errorMessage = error.message || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Cambiar Contraseña</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña Actual</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Introduce tu contraseña actual"
          secureTextEntry
        />
      </View>

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
        onPress={handleChangePassword} 
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Actualizar Contraseña</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.cancelButton]} 
        onPress={() => navigation.goBack()}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Cancelar</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Header Styles
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
  headerIcon: {
    width: 25, 
    height: 25,
    tintColor: '#333', 
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
    marginBottom: 35,
    color: '#333',
    textAlign: 'center',
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
    marginTop: 10,
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
  cancelButton: {
    backgroundColor: '#A8C3A9',
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

export default Cambiarcontraseña;

