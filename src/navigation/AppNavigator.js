import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginMobile from '../components/auth/LoginMobile';
import DashboardMobile from '../pages/members/DashboardMobile';
import GCResolutionPage from '../pages/members/GCResolutionPageMobile';
import BOMResolutionPage from '../pages/members/BOMResolutionPageMobile';
import AGMResolutionPage from '../pages/members/AGMResolutionPageMobile';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Hide default header since we have custom HeaderMobile
        }}
      >
        <Stack.Screen name="Login" component={LoginMobile} />
        <Stack.Screen name="Dashboard" component={DashboardMobile} />
        <Stack.Screen name="GCResolution" component={GCResolutionPage} />
        <Stack.Screen name="BOMResolution" component={BOMResolutionPage} /> 
        <Stack.Screen name="AGMResolution" component={AGMResolutionPage} />
      </Stack.Navigator>
    </NavigationContainer>
  ); 
};

export default AppNavigator; 