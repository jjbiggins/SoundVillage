import { createStackNavigator } from 'react-navigation';
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import LoadingScreen from "../screens/LoadingScreen";

const AuthNavigator = createStackNavigator({
        Login: {screen: LoginScreen},
        SignUp: {screen: SignUpScreen}
    },
    {initialRouteName: 'Login'});


export default AuthNavigator;