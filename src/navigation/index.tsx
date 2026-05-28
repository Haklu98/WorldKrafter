import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LandingPage from '../pages/Landing';
import SignInPage from '../pages/SignIn';
import RegisterPage from '../pages/Register';

export type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0f1a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="SignIn" component={SignInPage} />
        <Stack.Screen name="Register" component={RegisterPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
