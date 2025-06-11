import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View,Text,  StyleSheet, TouchableOpacity,Image,ActivityIndicator,ScrollView, TextInput,KeyboardAvoidingView,  Platform, Alert} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adaptToHeight, adaptToWidth } from '../../config/Demensions'; 
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { updateUserProfile, getUserProfile } from '../api'; 

const headerLogoPath = require('../../assets/Logo2.png');

const Gestiondecuenta = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [userId, setUserId] = useState(null);


  const [editingField, setEditingField] = useState(null); 
  const [tempValue, setTempValue] = useState(''); 

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 

  

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

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) {
        throw new Error("User ID not found in storage.");
      }
      setUserId(storedUserId);

      const storedProfile = await AsyncStorage.getItem('user_profile');
      if (storedProfile) {
        const profileData = JSON.parse(storedProfile);
        setFirstName(profileData.firstName || '');
        setLastName(profileData.lastName || ''); 
        setUserName(profileData.userName || '');
        setEmail(profileData.email || '');
        setDateOfBirth(profileData.dateOfBirth || ''); 
        setGender(profileData.gender || '');
        console.log("Profile loaded from AsyncStorage:", profileData);
      } else {
         console.log("No profile found in AsyncStorage, attempting fetch from API.");
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert('Error', 'No se pudo cargar la información del perfil. Asegúrate de que el backend esté enviando todos los datos (incluyendo apellido, fecha de nacimiento, género).');
   
      setFirstName('');
      setLastName('');
      setUserName('');
      setEmail('');
      setDateOfBirth('');
      setGender('');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchUserData);
    fetchUserData(); 
    return unsubscribe; 
  }, [navigation]);

  const handleEdit = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue || ''); 
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleSaveEdit = async () => {
    if (!editingField || tempValue.trim() === '') {
      Alert.alert('Campo vacío', 'El campo no puede estar vacío.');
      return;
    }
    if (!userId) {
        Alert.alert('Error', 'No se pudo obtener el ID de usuario.');
        return;
    }

    setIsSaving(true);
    const dataToUpdate = { [editingField]: tempValue }; 

    try {
      console.log(`Attempting to update profile for user ${userId} with data:`, dataToUpdate);
    
      const response = await updateUserProfile(userId, dataToUpdate);
      console.log("Update response from API:", response); 

  
      switch (editingField) {
        case 'firstName': setFirstName(tempValue); break;
        case 'lastName': setLastName(tempValue); break;
        case 'userName': setUserName(tempValue); break;
        case 'email': setEmail(tempValue); break;
        case 'dateOfBirth': setDateOfBirth(tempValue); break;
        case 'gender': setGender(tempValue); break;
        default: break;
      }

      Alert.alert('Éxito', 'Campo actualizado correctamente en el servidor.');
      setEditingField(null); 
      setTempValue('');
    } catch (error) {
      console.error("Error saving field via API:", error);
      const errorMessage = error.message || `No se pudo guardar el campo ${editingField} en el servidor.`;
      Alert.alert('Error al Guardar', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };


  const renderProfileField = (label, value, fieldName, iconName) => {
    const isEditingThisField = editingField === fieldName;

    return (
      <View style={styles.userInfoContainer}>
        <MaterialIcons name={iconName} size={24} color="#555" style={styles.infoIcon} />
        <View style={styles.fieldContent}>
          <Text style={styles.userInfoTextLabel}>{label}: </Text>
          {isEditingThisField ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={tempValue}
                onChangeText={setTempValue}
                placeholder={`Nuevo ${label.toLowerCase()}`}
                autoCapitalize={fieldName === 'email' || fieldName === 'userName' ? 'none' : 'words'}
                keyboardType={fieldName === 'email' ? 'email-address' : 'default'}
                autoFocus={true} 
              />
              <TouchableOpacity onPress={handleSaveEdit} style={[styles.editButton, styles.saveButton]} disabled={isSaving}>
                {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="checkmark-circle-outline" size={24} color="#ffffff" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelEdit} style={[styles.editButton, styles.cancelButton]} disabled={isSaving}>
                 <Ionicons name="close-circle-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              <Text style={styles.userInfoTextValue}>{value || 'No especificado'}</Text>
              <TouchableOpacity onPress={() => handleEdit(fieldName, value)} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D7CFFA" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.keyboardAvoidingContainer}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Gestión de Cuenta</Text>

        <View style={styles.infoBox}>
      
          {renderProfileField('Nombre', firstName, 'firstName', 'person-outline')}
          {renderProfileField('Apellido', lastName, 'lastName', 'person-outline')}
          {renderProfileField('Usuario', userName, 'userName', 'account-circle')}
          {renderProfileField('Fecha de Nac.', dateOfBirth, 'dateOfBirth', 'cake')}
          {renderProfileField('Género', gender, 'gender', 'wc')}
          {renderProfileField('Email', email, 'email', 'mail-outline')}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CAMBIOCONTRASEÑA')}>
            <MaterialIcons name="lock-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Cambiar Contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => navigation.navigate('BORRARCUENTA')}>
            <MaterialIcons name="delete-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 50,
    alignItems: 'center',
  },
  headerIconContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerLogoIcon: {
    width: adaptToWidth(0.30),
    height: adaptToHeight(0.05),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: adaptToWidth(0.07),
    fontWeight: '600',
    marginBottom: 35,
    color: '#333',
    textAlign: 'center',
  },
  infoBox: {
    width: '100%',
    marginBottom: 30,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10, 
    paddingHorizontal: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    minHeight: adaptToHeight(0.08),
  },
  infoIcon: {
    marginRight: 15,
  },
  fieldContent: {
    flex: 1, 
    flexDirection: 'column', 
  },
  userInfoTextLabel: {
    fontSize: adaptToWidth(0.04),
    color: '#333',
    fontWeight: '600',
    marginBottom: 3,
  },
  displayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  userInfoTextValue: {
    fontSize: adaptToWidth(0.04),
    color: '#555',
    flexShrink: 1,
    marginRight: 10,
  },
  changeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  changeButtonText: {
    fontSize: adaptToWidth(0.035),
    color: '#333',
    fontWeight: '500',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: adaptToHeight(0.05),
    fontSize: adaptToWidth(0.04),
    color: '#333',
    marginRight: 5,
  },
  editButton: {
    padding: 5,
    borderRadius: 5,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#A8C3A9',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonContainer: {
    width: '90%',
    marginTop: 20,
  },
  actionButton: { 
    flexDirection: 'row',
    backgroundColor: '#D7CFFA',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: adaptToWidth(0.045),
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
});

export default Gestiondecuenta;

