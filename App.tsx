import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginRegister from './pages/LoginRegister';
import LoginScreen from './pages/Login';
import RegisterScreen from './pages/Register';
import Dashboard from './pages/Dashboard';

const Stack = createStackNavigator();

const App = (): React.ReactElement => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="index">
        <Stack.Screen
          name="index"
          component={LoginRegister}
          options={{ headerShown: false }}
        />
      <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="Home"
          component={Dashboard}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
