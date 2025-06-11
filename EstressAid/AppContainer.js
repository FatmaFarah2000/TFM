import React from 'react';
import {Text } from 'react-native';
import { Provider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native'
import GuestStack from "./navigation/GuestStack"; 

import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/'); 

const linkingConfig = {
  prefixes: [prefix],
  config: {
    
    
    screens: {
      NUEVACONTRASEÑA: { 
        path: 'reset-password/:token?', 
        parse: {
          token: (token) => `${token}`,
        },
      },
      
      NotFound: '*', 
    },
  },
};

export default function AppContainer() {
  return (
    <Provider>
      <NavigationContainer linking={linkingConfig} fallback={<Text>Cargando...</Text>}>
        <GuestStack />
      </NavigationContainer>
    </Provider>
  )
}

