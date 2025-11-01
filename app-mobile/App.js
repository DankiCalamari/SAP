import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore specific warnings if needed
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <AppNavigator />
      </Provider>
    </GestureHandlerRootView>
  );
}
