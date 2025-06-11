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
import { logoutUser, deleteUserAccount } from '../api';
import { adaptToHeight, adaptToWidth } from '../../config/Demensions'; 
import { MaterialIcons, Ionicons } from '@expo/vector-icons'; 


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

const Borrarcuenta = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
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

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('Confirmación requerida', 'Por favor, introduce tu contraseña actual para confirmar.');
      return;
    }
    if (!userId) {
        Alert.alert('Error', 'No se pudo identificar al usuario.');
        return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y todos tus datos se perderán.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar Cuenta',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
            
              await logoutUser(); 
              Alert.alert('Cuenta Eliminada', 'Tu cuenta ha sido eliminada correctamente (simulado).');
              navigation.reset({ index: 0, routes: [{ name: 'LOGIN' }] }); 

            } catch (error) {
              console.error("Error eliminando cuenta:", error);
              Alert.alert('Error', error.message || 'No se pudo eliminar la cuenta.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Eliminar Cuenta</Text>

      <View style={styles.warningBox}>
        <MaterialIcons name="warning" size={adaptToWidth(0.06)} color="#FF6B6B" style={styles.warningIcon} />
        <Text style={styles.warningText}>
          ¡Atención! Eliminar tu cuenta es una acción permanente e irreversible. Perderás acceso a tu perfil, historial y todos los datos asociados.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmar Contraseña Actual</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Introduce tu contraseña actual"
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.deleteButton, (!password || isLoading) && styles.buttonDisabled]}
        onPress={handleDeleteAccount} 
        disabled={!password || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Eliminar Mi Cuenta</Text>
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
    marginBottom: 25,
    color: '#333',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFC0C0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: adaptToWidth(0.038),
    color: '#A00000',
    lineHeight: adaptToHeight(0.025),
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
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButton: {
    backgroundColor: '#A8C3A9',
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#FFAAAA',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: adaptToWidth(0.045),
    fontWeight: '600',
  },
});

export default Borrarcuenta;

