import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { setUser } from '../store/authSlice';
import { initDatabase } from '../database/schema';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await initDatabase();

        // Check if user is already logged in
        const token = await AsyncStorage.getItem('auth_token');
        const userJson = await AsyncStorage.getItem('user_data');

        if (token && userJson) {
          const user = JSON.parse(userJson);
          dispatch(setUser(user));
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, [dispatch]);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
