import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JogosScreen from '../screens/JogosTela';
import AvaliacoesScreen from '../screens/AvaliacoesTela';
import PerfilScreen from '../screens/PerfilTela';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#A259FF',
        tabBarInactiveTintColor: '#888888',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Jogos') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Avaliações') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Jogos" component={JogosScreen} />
      <Tab.Screen name="Avaliações" component={AvaliacoesScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#130027',
    borderTopWidth: 0,
    elevation: 10,
    height: 100,
    paddingBottom: 0,
    paddingTop: 16,
    marginBottom: 0,
  },
});
