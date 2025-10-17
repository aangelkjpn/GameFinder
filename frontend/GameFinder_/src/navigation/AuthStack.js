import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BemVindoTela from '../screens/BemVindoTela';
import LoginTela     from '../screens/LoginTela';
import RegistroTela  from '../screens/RegistroTela';
import BottomTabs    from './BottomTabs';
import PerfilTela      from '../screens/PerfilTela';
import EditarPerfil    from '../screens/EditarPerfil';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="BemVindo"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="BemVindo"    component={BemVindoTela} />
      <Stack.Screen name="Login"       component={LoginTela} />
      <Stack.Screen name="Registro"    component={RegistroTela} />

      <Stack.Screen name="Home"        component={BottomTabs} />

      <Stack.Screen name="PerfilTela"    component={PerfilTela} />
      <Stack.Screen name="EditarPerfil"  component={EditarPerfil} />
    </Stack.Navigator>
  );
}
