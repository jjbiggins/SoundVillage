import { createStackNavigator } from 'react-navigation';
import StreamingPlayerScreen from "../screens/StreamingPlayerScreen";

const PlayerNavigator = createStackNavigator({
        StreamingPlayer: {screen: StreamingPlayerScreen},

    },
    {initialRouteName: 'StreamingPlayer'});


export default PlayerNavigator;