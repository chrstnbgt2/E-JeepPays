import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginRegister from './pages/LoginRegister';
import LoginScreen from './pages/Login';
import RegisterScreen from './pages/Register';
import Dashboard from './pages/Dashboard';
import Next from './pages/RegisterCont';
import Tracker from './pages/JeepTracker';
import MyQR from './pages/QrCode';
import History from './pages/Transactions';
import ProfileScreen from './pages/Profile';
import CashInScreen from './pages/Cashin';
import MyQRScreenShare from './pages/QrCodeShare';
import DiscountScreen from './pages/Discount';
import BusDetail from './pages/BusDetail';


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
           <Stack.Screen
          name="Next"
          component={Next}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Tracker"
          component={Tracker}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="MyQR"
          component={MyQR}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="History"
          component={History}
          options={{ headerShown: false }}
        />
          <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
          <Stack.Screen
          name="Cashin"
          component={CashInScreen}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="Share"
          component={MyQRScreenShare}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="Discount"
          component={DiscountScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BusDetail"
          component={BusDetail}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
