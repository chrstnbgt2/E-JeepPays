import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import screens
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

const AuthStack = createStackNavigator();
const MainTabs = createBottomTabNavigator();
const RootStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="LoginRegister" component={LoginRegister} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="Next" component={Next} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainTabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = 'home-outline';
        } else if (route.name === 'Tracker') {
          iconName = 'location-outline';
        } else if (route.name === 'Profile') {
          iconName = 'person-outline';
        } else if (route.name === 'MyQR') {
          iconName = 'qr-code-outline';
        } else if (route.name === 'History') {
          iconName = 'time-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#8FCB81',
      tabBarInactiveTintColor: '#FFFFFF',
      tabBarLabel: ({ focused }) => (
        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
          {route.name}
        </Text>
      ),
    })}
  >
    <MainTabs.Screen name="Home" component={Dashboard} />
    <MainTabs.Screen name="Tracker" component={Tracker} />
    <MainTabs.Screen name="MyQR" component={MyQR} />
    <MainTabs.Screen name="History" component={History} />
    <MainTabs.Screen name="Profile" component={ProfileScreen} />
  </MainTabs.Navigator>
);

const App = () => (
  <NavigationContainer>
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Auth" component={AuthNavigator} />
      <RootStack.Screen name="Main" component={MainNavigator} />
      <RootStack.Screen name="CashIn" component={CashInScreen} />
      <RootStack.Screen name="Share" component={MyQRScreenShare} />
      <RootStack.Screen name="Discount" component={DiscountScreen} />
      <RootStack.Screen name="BusDetail" component={BusDetail} />
    </RootStack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#466B66',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: 70,
    paddingBottom: 10,
    paddingTop: 5,
  },
  tabLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
  tabLabelFocused: {
    color: '#8FCB81',
    fontWeight: 'bold',
  },
});

export default App;
