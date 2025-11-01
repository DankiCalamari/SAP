import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import InventoryScreen from '../screens/InventoryScreen';
import InventoryAdjustScreen from '../screens/InventoryAdjustScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Components
import SyncIndicator from '../components/SyncIndicator';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tabs navigator
function BottomTabsNavigator() {
  const user = useSelector((state) => state.auth.user);
  const isStaff = user && (user.role === 'stock_staff' || user.role === 'manager' || user.role === 'admin');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: '#999',
        headerRight: () => <SyncIndicator />,
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductListScreen}
        options={{ title: 'Products' }}
      />
      {isStaff && (
        <Tab.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{ title: 'Inventory' }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main stack navigator with bottom tabs and modal screens
export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={BottomTabsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product Details' }}
      />
      <Stack.Screen
        name="InventoryAdjust"
        component={InventoryAdjustScreen}
        options={{ title: 'Adjust Inventory' }}
      />
      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScannerScreen}
        options={{
          title: 'Scan Barcode',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
