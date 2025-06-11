import React, { useState, useEffect } from "react";
import {View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { adaptToHeight, adaptToWidth } from "../../config/Demensions";
import { logoutUser } from "../api"; 
import { useNavigation } from '@react-navigation/native';

const Customdrawer = (props) => {
  const [userName, setUserName] = useState("Usuario");
  const [isLoadingLogout, setIsLoadingLogout] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedUserName = await AsyncStorage.getItem("user_name");
        if (storedUserName) {
          setUserName(storedUserName);
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
  }, []);

  const handleLogout = async () => {
    setIsLoadingLogout(true);
    try {
      await logoutUser();
      navigation.reset({ index: 0, routes: [{ name: 'LOGIN' }] }); 
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    } finally {
      setIsLoadingLogout(false);
    }
  };

  const topRoutes = props.state.routes.filter(
    (route) => 
      route.name !== 'GESTIONCUENTA' && route.name !== 'INFORMACION' && route.name !== 'PAYMENT'
  );

  const gestionCuentaRoute = props.state.routes.find(route => route.name === 'GESTIONCUENTA');
  const informacionRoute = props.state.routes.find(route => route.name === 'INFORMACION');
  const paymentRoute = props.state.routes.find(route => route.name === 'PAYMENT');
  const filteredState = {
    ...props.state,
    routes: topRoutes,
    
    index: topRoutes.findIndex(route => route.key === props.state.routes[props.state.index]?.key),
  };

  return (
    <View style={styles.container}>
    
      <View style={styles.drawerHeader}>
        <Image
          source={require('../../assets/Logo2.png')} 
          style={styles.drawerLogo}
          resizeMode="contain"
        />
      </View>

      
      <DrawerContentScrollView 
        {...props} 
        state={filteredState}
        contentContainerStyle={styles.scrollContainer}
      >
        <DrawerItemList {...props} state={filteredState} />
        <DrawerItem
          label="Historial de Conversaciones"
          icon={({ color, size }) => (
            <Ionicons name="chatbox-ellipses-outline" size={size} color={color} style={styles.iconStyle} />
          )}
          onPress={() => {
           
            navigation.navigate('CONVERSACION'); 
          }}
          labelStyle={styles.drawerLabel}
          style={styles.drawerItem}
        />

      </DrawerContentScrollView>

 
      <View style={styles.bottomSection}>
      <View style={styles.divider} />
      {gestionCuentaRoute && (
          <DrawerItem
            label="Gestión de cuenta"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="cog-outline" size={size} color={color} style={styles.iconStyle} />
            )}
            onPress={() => navigation.navigate(gestionCuentaRoute.name)}
            labelStyle={styles.drawerLabel}
            style={styles.drawerItem}
          />
        )}
        <View style={styles.divider} />

        <DrawerItem
          label="Suscripción"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="credit-card-outline" size={size} color={color} style={styles.iconStyle} />
          )}
          onPress={() => navigation.navigate(paymentRoute)}
          labelStyle={styles.drawerLabel}
          style={styles.drawerItem}
        />

       
        <View style={styles.divider} />
        {informacionRoute && (
          <DrawerItem
            label="Información"
            icon={({ color, size }) => (
              <MaterialIcons name="info-outline" size={size} color={color} style={styles.iconStyle} />
            )}
            onPress={() => navigation.navigate(informacionRoute.name)}
            labelStyle={styles.drawerLabel}
            style={styles.drawerItem}
          />
        )}

        <View style={styles.divider} />
        <View style={styles.userInfoContainer}>
           <Ionicons name="person-circle-outline" size={24} color="#555" style={styles.userIcon} />
           <Text style={styles.userNameText}>{userName}</Text>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoadingLogout}
        >
          {isLoadingLogout ? (
            <ActivityIndicator size="small" color="#D32F2F" style={styles.logoutIcon} />
          ) : (
            <MaterialIcons name="logout" size={22} color="#D32F2F" style={styles.logoutIcon} />
          )}
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', 
  },
  drawerHeader: {
    paddingTop: 40, 
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
  },
  drawerLogo: {
    width: adaptToWidth(0.3),
    height: adaptToHeight(0.05),
  },
  scrollContainer: {
    paddingTop: 10, 
    backgroundColor: '#f8f9fa', 
  },
  drawerItem: {
    marginHorizontal: 10,
    marginVertical: 2, 
    borderRadius: 8,
  },
  iconStyle: { 
    marginRight: 10,
  },
  drawerLabel: { 
    marginLeft: 0, 
    fontSize: 15, 
    fontWeight: '500',
    color: '#333', 
  },
  bottomSection: {
    paddingBottom: 30, 
    paddingHorizontal: 0, 
    backgroundColor: '#ffffff', 
    borderTopColor: '#e0e0e0',
    borderTopWidth: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e8eaef',
    marginVertical: 8, 
    marginHorizontal: 20, 
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20, 
    marginTop: 5, 
  },
  userIcon: {
    marginRight: 15,
  },
  userNameText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 5, 
  },
  logoutIcon: {
    marginRight: 15,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#D32F2F', 
  },
});

export default Customdrawer;

