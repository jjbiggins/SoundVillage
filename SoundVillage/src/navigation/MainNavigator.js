import { createMaterialTopTabNavigator, createBottomTabNavigator } from 'react-navigation';
import { Platform } from 'react-native';
import MainFeed from "../screens/MainFeed";
import StreamingNavigator from "./StreamingNavigator";
import FeedNavigator from "./FeedNavigator";
import PlayerNavigator from "./PlayerNavigator";
import ProfileNavigator from "./ProfileNavigator";
import Icon from "react-native-vector-icons/FontAwesome";
import React from 'react';

let MainNavigator = null;

if (Platform.OS == 'ios'){
    MainNavigator =createBottomTabNavigator({
            MainFeed: {screen: FeedNavigator},
            Streaming: {screen: StreamingNavigator},
            Player: {screen: PlayerNavigator},
            Profile: {screen: ProfileNavigator}
        },
        {
            order: ['MainFeed', 'Streaming', 'Player', 'Profile'],
            lazy: false,
            defaultNavigationOptions: ({ navigation }) => ({
                tabBarIcon: ({ focused, horizontal, tintColor }) => {
                    const { routeName } = navigation.state;
                    let iconName;
                    if (routeName === 'MainFeed') {
                        iconName = 'home';
                    } else if (routeName === 'Streaming') {
                        iconName = 'spotify';
                    } else if (routeName === 'Player') {
                        iconName = 'music';
                    } else if (routeName === 'Profile') {
                        iconName = 'user';
                    }

                    // You can return any component that you like here!
                    return (<Icon name={iconName} size={25} color={tintColor} />);
                },
            }),
            tabBarOptions: {
                activeTintColor: '#BEE5BF',
                inactiveTintColor: 'gray',
                style: {
                    backgroundColor: '#303338',
                }
            },
        }
    );
}
else {
    MainNavigator =createMaterialTopTabNavigator({
            MainFeed: {screen: FeedNavigator},
            Streaming: {screen: StreamingNavigator},
            Profile: {screen: ProfileNavigator},
            Player: {screen: PlayerNavigator}
        },
        {
            order: ['MainFeed', 'Streaming', 'Player', 'Profile'],
            tabBarOptions: {
                activeTintColor: '#BEE5BF',
                inactiveTintColor: 'gray',
                pressColor: '#BEE5BF',
                style: {
                    backgroundColor: '#303338',
                },
                indicatorStyle: {
                    backgroundColor: '#BEE5BF',
                },
            },
        }
    );
}


export default MainNavigator;