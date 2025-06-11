import React from 'react';


import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { adaptToHeight, adaptToWidth } from '../../config/Demensions'; 


const headerLogoPath = require('../../assets/Logo2.png');
const Payment = () => {
  const navigation = useNavigation();

  const handlePaymentSelection = (planType) => {
    console.log(`Selected plan: ${planType}`);
   
    alert(`Has seleccionado el plan ${planType}. ¡Integración de pago pendiente!`);

  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#1a2431" />
        </TouchableOpacity>
        <Image source={headerLogoPath} style={styles.headerLogo} resizeMode="contain" />
        <View style={{ width: adaptToWidth(0.1) }} /> 
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Elige tu Plan de Suscripción</Text>
        <Text style={styles.subtitle}>Accede a todas las funcionalidades premium.</Text>

        <TouchableOpacity 
          style={[styles.planOption, styles.monthlyPlan]} 
          onPress={() => handlePaymentSelection('Mensual')}
        >
          <View style={styles.planIconContainer}>
            <MaterialCommunityIcons name="calendar-month-outline" size={40} color="#6a1b9a" />
          </View>
          <View style={styles.planDetails}>
            <Text style={styles.planTitle}>Plan Mensual</Text>
            <Text style={styles.planPrice}>10 € / mes</Text>
            <Text style={styles.planDescription}>Flexibilidad total, cancela cuando quieras.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#6a1b9a" style={styles.planArrow} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.planOption, styles.annualPlan]} 
          onPress={() => handlePaymentSelection('Anual')}
        >
           <View style={styles.planIconContainer}>
             <MaterialCommunityIcons name="calendar-star" size={40} color="#1e88e5" />
           </View>
          <View style={styles.planDetails}>
            <Text style={styles.planTitle}>Plan Anual</Text>
            <Text style={styles.planPrice}>80 € / año</Text>
            <Text style={styles.planDescription}>Ahorra un 33% en comparación con el plan mensual.</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>MEJOR VALOR</Text></View>
          </View>
           <Ionicons name="chevron-forward" size={24} color="#1e88e5" style={styles.planArrow} />
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Los pagos se procesan de forma segura. Puedes gestionar tu suscripción en cualquier momento desde la configuración de tu cuenta.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8eaef', 
    height: adaptToHeight(0.08), 
  },
  backButton: {
     padding: 5,
  },
  headerLogo: {
    width: adaptToWidth(0.30),
    height: adaptToHeight(0.05),
    alignSelf: 'center',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a2431', 
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  planOption: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  monthlyPlan: {
     borderColor: '#d9c9f0', 
  },
  annualPlan: {
     borderColor: '#bbdefb', 
  },
  planIconContainer: {
    marginRight: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  planDetails: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  planPrice: {
    fontSize: 16,
    color: '#1a2431',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
  },
  planArrow: {
    marginLeft: 10,
  },
  badge: {
    backgroundColor: '#1e88e5', 
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
});

export default Payment;

