import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import StatScreen from './screens/StatScreen';
import ScanScreen from './screens/ScanScreen';
import GuideScreen from './screens/GuideScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import CategoryHistoryScreen from './screens/CategoryHistoryScreen';
import ScanHistoryScreen from './screens/ScanHistoryScreen';
import ResultScreen from './screens/ResultScreen';
import EditProfileScreen from './screens/EditProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs({ user, setUser }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#ffffff', 
          height: 80, 
          borderTopColor: '#eee',
          paddingBottom: 10 
        },
        tabBarActiveTintColor: '#059669', // สีเขียวตามรูปต้นฉบับ
        tabBarInactiveTintColor: '#ff76f6',
        tabBarLabelStyle: { fontSize: 11, marginBottom: 5 },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Scan') {
            return (
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#059669',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 35, // ดันปุ่มขึ้นข้างบน
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              }}>
                <MaterialCommunityIcons name="scan-helper" size={32} color="white" />
              </View>
            );
          }

          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Stat') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Guide') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Home' }}>
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Stat" options={{ tabBarLabel: 'Stats' }}>
        {(props) => <StatScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Scan" component={ScanScreen} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="Guide" component={GuideScreen} options={{ tabBarLabel: 'Guide' }} />
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profile' }}>
        {(props) => (
          <ProfileScreen
            {...props}
            onLogout={() => setUser(null)}
            user={user}
            setUser={setUser}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {(props) => <MainTabs {...props} user={user} setUser={setUser} />}
        </Stack.Screen>
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="CategoryHistory" component={CategoryHistoryScreen} />
        <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} />
        <Stack.Screen name="EditProfile">
          {(props) => <EditProfileScreen {...props} user={user} setUser={setUser} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}