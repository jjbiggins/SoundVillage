import { createStackNavigator } from 'react-navigation';
import LoadingScreen from "../screens/LoadingScreen";

const LoadingNavigator = createStackNavigator({
        Loading: {screen: LoadingScreen}
    },
    {initialRouteName: 'Loading'});


export default LoadingNavigator;