import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {NavigationContainer, useNavigation} from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Route from './Route';
import Login from "../frontend/componentes/login";
import Estressaid from "../frontend/componentes/estressaid";
import Bienvenido from '../frontend/componentes/bienvenido';
import Crearcuenta from '../frontend/componentes/crearcuenta';
import Contraseñaolvidada from'../frontend/componentes/contraseñaolvidada';
import Gestiondecuenta from '../frontend/componentes/gestiondecuenta';
import Cambiarcontraseña from '../frontend/componentes/cambiarcontraseña';
import Customdrawer from '../frontend/componentes/customdrawer';
import Informacion from '../frontend/componentes/informacion';
import Borrarcuenta from '../frontend/componentes/borrarcuenta';
import Historialconversacion from '../frontend/componentes/historialconversacion';
import Payment from '../frontend/componentes/payment';
import {
  SimpleLineIcons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome
} from "@expo/vector-icons";
import NuevaContraseña from '../frontend/componentes/nuevacontraseña';
import Cambiarcontraseña1 from '../frontend/componentes/cambiarcontraseña1';



const Stack = createStackNavigator ();
const Drawer = createDrawerNavigator();

function PantallaPrincipal () {
  return (
    <Drawer.Navigator 
      screenOptions={{headerShown: false}} 
      drawerContent={props => <Customdrawer {...props}/>}
    >
      <Drawer.Screen
        name={'EstressAid'}
        options={{
          headerShown: true,
          title: 'EstressAid',drawerIcon: ({ color, size }) => ( <MaterialCommunityIcons name="brain" size={size} color={color} /> ), drawerLabelStyle: {color:'black'}
        }}
        children={() => <Estressaid />}
      />

      <Drawer.Screen
        name='GESTIONCUENTA'
        options={{
          headerShown: true,
          title: 'Gestión de cuenta',drawerIcon: ({ color, size }) => (  <MaterialCommunityIcons name="cog-outline" size={size} color={color} style={styles.iconStyle} /> ),          drawerLabelStyle: {color:'black'}
        }}
        children={() => <Gestiondecuenta />}
      />

      <Drawer.Screen
        name='INFORMACION'
        options={{
          headerShown: true,
          title: 'Información',drawerIcon: ({ color, size }) => ( <MaterialIcons name="info" size={size} color={color} /> ), drawerLabelStyle: {color:'black'},
        }}
        children={() => <Informacion />}
      />  
            <Drawer.Screen
        name='PAYMENT'
        options={{
          headerShown: true,
          title: 'Payment',drawerIcon: ({ color, size }) => ( <MaterialIcons name="info" size={size} color={color} /> ),drawerLabelStyle: {color:'black'},
        }}
        children={() => <Payment/>}
      /> 
    </Drawer.Navigator>
  );
}



const GuestStack = () => {
  return (
    
    
        <Stack.Navigator>
      

      <Stack.Screen name='BIENVENIDO' component={Bienvenido}   options={{ headerShown: false }}/>
      <Stack.Screen name='LOGIN' component={Login}  options={{ headerShown: false }} />
      <Stack.Screen name='ESTRESSAID' component={PantallaPrincipal} options={{headerShown:false}}/>
      <Stack.Screen name='CREARCUENTA' component={Crearcuenta}   options={{ headerShown: false }}/>
      <Stack.Screen name='CONTRASEÑAOLVIDADA' component={Contraseñaolvidada}   options={{ headerShown: false }}/>
      <Stack.Screen name='GESTIONCUENTA' component={Gestiondecuenta}   options={{ headerShown: false }}/>
      <Stack.Screen name='INFORMACION' component={Informacion}   options={{ headerShown: false }}/>
      <Stack.Screen name='CAMBIOCONTRASEÑA' component={Cambiarcontraseña}   options={{ headerShown: false }}/>
      <Stack.Screen name='CAMBIOCONTRASEÑA1' component={Cambiarcontraseña1}   options={{ headerShown: false }}/>
      <Stack.Screen name='BORRARCUENTA' component={Borrarcuenta}   options={{ headerShown: false }}/>
      <Stack.Screen name='CONVERSACION' component={Historialconversacion}   options={{ headerShown: false }}/>
      <Stack.Screen name='PAYMENT' component={Payment}   options={{ headerShown: false }}/>
      <Stack.Screen name='NUEVACONTRASEÑA' component={NuevaContraseña}   options={{ headerShown: false }}/>
    </Stack.Navigator>
   
  )
}  

export default GuestStack

const styles = StyleSheet.create({})