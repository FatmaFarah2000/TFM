import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Platform } from 'react-native';
import Dimensions, { adaptToHeight, adaptToWidth } from '../../config/Demensions';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { createUser } from "../api";

import AsyncStorage from '@react-native-async-storage/async-storage';
const Crearcuenta = ({ navigation }) => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [password, setPassword] = useState('');
  const [validate_password, setValidatePassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordStrengthColor, setPasswordStrengthColor] = useState('#ccc');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [name, setName] = useState('');
  const [last_name, setLastName] = useState('');
  const [user_name, setUsername] = useState('');

  const [date_of_birth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateText, setDateText] = useState('');
  const [dateError, setDateError] = useState('');
  const [gender, setGender] = useState('');
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const genderOptions = ['Masculino', 'Femenino', 'Otro'];
  
  const validateAge = (selectedDate) => {
    const today = new Date();
    const minAgeDate = new Date();
    minAgeDate.setFullYear(today.getFullYear() - 12);
    
    if (selectedDate > minAgeDate) {
      setDateError('Debes tener al menos 12 años para registrarte');
      return false;
    } else {
      setDateError('');
      return true;
    }
  };
  
  const checkPasswordStrength = (pass) => {
    setPassword(pass);
    
    if (validate_password !== '') {
      setPasswordMatch(pass === validate_password);
    }
    
    if (pass.length === 0) {
      setPasswordStrength('');
      setPasswordStrengthColor('#ccc');
      return;
    }
    
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(pass);
    
    if (pass.length < 6) {
      setPasswordStrength('Débil');
      setPasswordStrengthColor('#FF6B6B');
    } else if (pass.length >= 8 && hasLetters && hasNumbers && hasSpecialChars) {
      setPasswordStrength('Fuerte');
      setPasswordStrengthColor('#4CAF50');
    } else if (pass.length >= 6 && ((hasLetters && hasNumbers) || (hasLetters && hasSpecialChars))) {
      setPasswordStrength('Medio');
      setPasswordStrengthColor('#FFD700');
    } else {
      setPasswordStrength('Débil');
      setPasswordStrengthColor('#FF6B6B');
    }
  };
  
  const validatePassword = (validatePass) => {
    setValidatePassword(validatePass);
    setPasswordMatch(password === validatePass);
  };
  
  const validateEmail = (text) => {
    setEmail(text);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text.length > 0 && !emailRegex.test(text)) {
      setEmailError('Por favor, introduce un correo electrónico válido');
    } else {
      setEmailError('');
    }
  };
  
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date_of_birth;
    setShowDatePicker(Platform.OS === 'ios');
    
    if (validateAge(currentDate)) {
      setDateOfBirth(currentDate);
      
      const day = currentDate.getDate().toString().padStart(2, '0');
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const year = currentDate.getFullYear();
      setDateText(`${day}/${month}/${year}`);
    }
  };
  
  const validateDateInput = (text) => {
    const formattedText = text.replace(/[^0-9/]/g, '');
        let newText = formattedText;
    if (formattedText.length === 2 && !formattedText.includes('/')) {
      newText = `${formattedText}/`;
    } else if (formattedText.length === 5 && formattedText.charAt(2) === '/' && !formattedText.includes('/', 3)) {
      newText = `${formattedText}/`;
    }
    
    setDateText(newText);
    
    if (formattedText.length >= 5) {
      const parts = formattedText.split('/');
      
      if (parts.length >= 1) {
        const day = parseInt(parts[0]);
        if (isNaN(day) || day < 1 || day > 31) {
          setDateError('El día debe estar entre 1 y 31');
          return;
        }
      }
      
      if (parts.length >= 2) {
        const month = parseInt(parts[1]);
        if (isNaN(month) || month < 1 || month > 12) {
          setDateError('El mes debe estar entre 1 y 12');
          return;
        }
        
        if (parts.length >= 1) {
          const day = parseInt(parts[0]);
          
          if (month === 2) { 
            if (day > 29) {
              setDateError('Febrero no puede tener más de 29 días');
              return;
            }
          } else if ([4, 6, 9, 11].includes(month)) {
            if (day > 30) {
              setDateError('Este mes no puede tener más de 30 días');
              return;
            }
          }
        }
      }
      
      if (parts.length === 3 && parts[2].length === 4) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const inputDate = new Date(year, month, day);
          
          if (inputDate.getDate() !== day || inputDate.getMonth() !== month || inputDate.getFullYear() !== year) {
            setDateError('Fecha inválida');
            return;
          }
          
          validateAge(inputDate);
          return;
        }
      }
    }
    
    if (formattedText.length < 10) {
      setDateError('');
    }
  };

  const handleSubmit = async () => {
    if (!acceptTerms || !passwordMatch || password.length < 8 || validate_password === '' || 
        emailError !== '' || dateError !== '' || !dateText || !gender || !name || !last_name || !user_name) {
      return  
    }
  
    try {
      
      const [day, month, year] = dateText.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
      const userData = {
        name,
        last_name,
        user_name,
        email,
        password,
        validate_password,
        date_of_birth: formattedDate,
        gender: gender || null
      };
      navigation.navigate("ESTRESSAID");
      console.log("Datos a enviar:", userData); 
      
      const newUser = await createUser(userData);
      console.log("Usuario creado:", newUser);
      if (newUser && newUser.id) { 
        try {
          await AsyncStorage.setItem("user_id", newUser.id.toString());
          console.log("User ID guardado en AsyncStorage:", newUser.id);
        } catch (storageError) {
          console.error("Error guardando user_id en AsyncStorage:", storageError);
       
        }
      } else {
        console.warn("No se encontró user_id en la respuesta de createUser.");
   
      }
      alert("Usuario registrado exitosamente");
   
    } catch (error) {
      console.error("Error completo:", error.response?.data || error.message);
      alert("Error al registrar usuario: " + (error.message || "Verifica los datos e intenta nuevamente"));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.logocontainer}>
          <View style={styles.logocontainer1}>
            <Image 
              source={require("../../assets/Logo3.png")} 
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.logocontainer2}>
            <Image 
              source={require("../../assets/Logo2.png")} 
              style={styles.logoIcon2}
              resizeMode="contain"
            />
          </View>
        </View>   
        
        <Text style={styles.sectionTitle}>Crear Cuenta</Text>
        
        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput 
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ingresa tu nombre"
        />
        
        <Text style={styles.inputLabel}>Apellido</Text>
        <TextInput 
          style={styles.input}
          value={last_name}
          onChangeText={setLastName}
          placeholder="Ingresa tu apellido"
        />
        
        <Text style={styles.inputLabel}>Nombre de usuario</Text>
        <TextInput 
          style={styles.input}
          value={user_name}
          onChangeText={setUsername}
          placeholder="Crea un nombre de usuario"
          autoCapitalize="none"
        />
        
        <Text style={styles.inputLabel}>Correo electrónico</Text>
        <TextInput 
          style={[styles.input, emailError ? styles.inputError : null]} 
          keyboardType="email-address"
          value={email}
          onChangeText={validateEmail}
          placeholder="ejemplo@correo.com"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        
        <Text style={styles.inputLabel}>Contraseña</Text>
        <TextInput 
          style={styles.input}
          value={password}
          onChangeText={checkPasswordStrength}
          secureTextEntry
          placeholder="Mínimo 8 caracteres"
        />
        {passwordStrength !== '' && (
          <View style={styles.passwordStrengthContainer}>
            <Text style={styles.passwordStrengthLabel}>Seguridad: </Text>
            <View style={[styles.passwordStrengthIndicator, { backgroundColor: passwordStrengthColor }]}>
              <Text style={styles.passwordStrengthText}>{passwordStrength}</Text>
            </View>
          </View>
        )}
        <Text style={styles.passwordRequirement}>
          Mínimo 8 caracteres con letras y números
        </Text>
        
        <Text style={styles.inputLabel}>Validar contraseña</Text>
        <TextInput 
          style={[styles.input, !passwordMatch && styles.inputError]} 
          value={validate_password}
          onChangeText={validatePassword}
          secureTextEntry
          placeholder="Confirma tu contraseña"
        />
        {!passwordMatch && validate_password !== '' && (
          <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
        )}
        
        <Text style={styles.inputLabel}>Fecha de nacimiento</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <View style={styles.dateInputContainer}>
            <TextInput 
              style={styles.dateInput}
              value={dateText}
              onChangeText={validateDateInput}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
            />
            <TouchableOpacity 
              style={styles.calendarIcon}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.calendarIconText}>📅</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
        
        {showDatePicker && (
          <DateTimePicker
            value={date_of_birth}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
        
        <Text style={styles.inputLabel}>Género</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowGenderPicker(true)}
        >
          <Text style={gender ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
            {gender || "Seleccionar género"}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={showGenderPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                  <Text style={styles.cancelButton}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                  <Text style={styles.doneButton}>Aceptar</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                {genderOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.genderOption}
                    onPress={() => {
                      setGender(option);
                      setShowGenderPicker(false);
                    }}
                  >
                    <Text style={styles.genderOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox} 
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            {acceptTerms && <View style={styles.checkboxSelected} />}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            Acepto los términos y condiciones de EstressAid
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.primaryButton, 
            (!acceptTerms || !passwordMatch || password.length < 8 || validate_password=== '' || 
             emailError !== '' || dateError !== '' || !dateText || !gender || !name || !last_name || !user_name) && styles.disabledButton
          ]}
          disabled={!acceptTerms || !passwordMatch || password.length < 8 || validate_password === '' || 
                   emailError !== '' || dateError !== '' || !dateText || !gender || !name || !last_name || !user_name}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
        </TouchableOpacity>
        
        <View style={styles.links}>
          <Text style={styles.link}>¿Ya tienes una cuenta? <Text 
            style={styles.linkHighlight}
            onPress={() => navigation.navigate("LOGIN")}
          >
            Iniciar sesión
          </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
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
    paddingBottom: 10,
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
    fontSize: 28,
    fontWeight: '700',
    paddingTop: 10,
    paddingBottom: 20
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555',
    alignSelf: 'flex-start',
    paddingLeft: 20,
    marginBottom: 5,
  },
  input: {
    height: 50,
    width: '90%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    alignSelf: 'flex-start',
    paddingLeft: 20,
    marginTop: -10,
    marginBottom: 10,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingLeft: 20,
    marginTop: -10,
    marginBottom: 5,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: '#555',
  },
  passwordStrengthIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  passwordStrengthText: {
    fontSize: 12,
    color: 'white',
  },
  passwordRequirement: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-start',
    paddingLeft: 20,
    marginTop: -10,
    marginBottom: 10,
  },
  dateInputContainer: {
    flexDirection: 'row',
    width: '90%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
  },
  calendarIcon: {
    padding: 10,
    height: '100%',
    justifyContent: 'center',
  },
  calendarIconText: {
    fontSize: 20,
  },
  dropdownButton: {
    flexDirection: 'row',
    width: '90%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: '#000',
  },
  dropdownButtonPlaceholder: {
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#555',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cancelButton: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  doneButton: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  genderOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderOptionText: {
    fontSize: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D7CFFA',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    backgroundColor: '#D7CFFA',
    borderRadius: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  primaryButton: {
    backgroundColor: '#D7CFFA',
    width: '90%',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  links: {
    width: '100%',
    marginTop: 15,
    marginBottom: 20,
    alignItems: 'center',
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

export default Crearcuenta;