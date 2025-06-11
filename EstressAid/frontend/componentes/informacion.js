import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { adaptToHeight, adaptToWidth } from '../../config/Demensions';

const headerLogoPath = require('../../assets/Logo2.png'); 
const appVersion = '1.0.0'; 
const supportEmail = 'soporte@estressaid.com';
const supportPhone = '+34 610 705 980'; 

const Informacion = () => {
  const navigation = useNavigation();

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const sendEmail = () => {
    Linking.openURL(`mailto:${supportEmail}?subject=Soporte EstressAid App`).catch(err => console.error("Couldn't open email client", err));
  };

  const callSupport = () => {
    Linking.openURL(`tel:${supportPhone}`).catch(err => console.error("Couldn't open dialer", err));
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
        <View style={styles.section}>
          <MaterialCommunityIcons name="information-outline" size={32} color="#1a2431" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Acerca de EstressAid</Text>
          <Text style={styles.sectionText}>
            EstressAid es tu compañero personal diseñado para ayudarte a manejar el estrés, la ansiedad y otros desafíos emocionales. Como un mini-terapeuta siempre disponible, te escucha activamente y te ofrece apoyo basado en técnicas comprobadas de Programación Neurolingüística (PNL).
          </Text>
        </View>

        <View style={styles.section}>
          <Ionicons name="chatbubbles-outline" size={30} color="#1a2431" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>¿Cómo Funciona?</Text>
          <Text style={styles.sectionText}>
            Inicia una conversación en cualquier momento. Comparte lo que sientes o piensas, y EstressAid responderá con empatía, comprensión y sugerencias útiles para ayudarte a encontrar claridad y calma. Nuestro objetivo es proporcionarte un espacio seguro y de apoyo.
          </Text>
        </View>

        <View style={styles.section}>
          <MaterialCommunityIcons name="brain" size={30} color="#1a2431" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Técnicas Utilizadas</Text>
          <Text style={styles.sectionText}>
            La aplicación integra principios de la Programación Neurolingüística (PNL) para ayudarte a reformular pensamientos, gestionar emociones y desarrollar estrategias de afrontamiento más efectivas. Estas técnicas están diseñadas para promover un cambio positivo y duradero.
          </Text>
        </View>

        <View style={styles.section}>
          <MaterialIcons name="support-agent" size={30} color="#1a2431" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Soporte Técnico</Text>
          <Text style={styles.sectionText}>
            Si encuentras algún problema con la aplicación o tienes alguna pregunta, nuestro equipo de soporte está aquí para ayudarte.
          </Text>
          <TouchableOpacity style={styles.supportButton} onPress={sendEmail}>
            <MaterialIcons name="email" size={20} color="#1e88e5" style={styles.supportIcon} />
            <Text style={styles.supportButtonText}>Enviar Email: {supportEmail}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton} onPress={callSupport}>
            <MaterialIcons name="phone" size={20} color="#1e88e5" style={styles.supportIcon} />
            <Text style={styles.supportButtonText}>Llamar a Soporte: {supportPhone}</Text>
          </TouchableOpacity>
          <Text style={styles.supportInfoText}>Horario de atención: Lunes a Viernes, 9:00 - 17:00.</Text>
        </View>

         <View style={styles.section}>
          <MaterialCommunityIcons name="shield-lock-outline" size={30} color="#1a2431" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Privacidad y Seguridad</Text>
          <Text style={styles.sectionText}>
            Tu privacidad es primordial. Todas las conversaciones son confidenciales. Consulta nuestra Política de Privacidad para más detalles (enlace simulado).
          </Text>
           <TouchableOpacity onPress={() => openLink('https://EstressAid.com/privacy')}> 
             <Text style={styles.linkText}>Leer Política de Privacidad</Text>
           </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Versión de la aplicación: {appVersion}</Text>
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
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.22,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8eaef',
    alignItems: 'center', 
  },
  sectionIcon: {
    marginBottom: 10,
    color: '#6a1b9a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a2431',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    textAlign: 'left', 
    marginBottom: 10,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd', 
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  supportIcon: {
    marginRight: 10,
  },
  supportButtonText: {
    fontSize: 15,
    color: '#1e88e5', 
    fontWeight: '500',
  },
  supportInfoText: {
      fontSize: 13,
      color: '#666',
      marginTop: 15,
      textAlign: 'center',
  },
  linkText: {
      fontSize: 15,
      color: '#1e88e5', 
      marginTop: 5,
      textDecorationLine: 'underline',
  },
  versionText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
});

export default Informacion;

