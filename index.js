/**
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './App';
import { AuthProvider } from './context/AuthContext';  
import { DriverLocationProvider } from './context/DriverLocationContext';

const RootApp = () => (

  <AuthProvider>
   <DriverLocationProvider>
    <App />
  </DriverLocationProvider>
  </AuthProvider>
);

AppRegistry.registerComponent(appName, () => RootApp);
