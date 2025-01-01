/**
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider

const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

AppRegistry.registerComponent(appName, () => RootApp);
