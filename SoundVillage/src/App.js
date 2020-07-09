/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';

import firebase from 'react-native-firebase';
import { Provider } from 'react-redux';
import { store } from './redux/app-redux';
import LoadingNavigator from './navigation/LoadingNavigator';
import MainNavigator from './navigation/MainNavigator';
import AuthNavigator from './navigation/AuthNavigator';
//import {type} from "react-native-elements";
import { Spotify } from 'rn-spotify-sdk';
import { MenuProvider } from 'react-native-popup-menu';

const AppContainer = createAppContainer(createSwitchNavigator(
    {
        LoadingNav: LoadingNavigator,
        AuthNav: AuthNavigator,
        MainNav: MainNavigator
    },
    {
        initialRouteName: 'LoadingNav',
    }
    ));


export default class App extends Component{

    componentWillMount() {
        const iosConfig = {
            clientId: "886570259513-usb5ur8nhut4e8t1e5ae05ie12h1pfn1.apps.googleusercontent.com",
            appId: "1:886570259513:ios:12c45ad35f39176a",
            apiKey: "AIzaSyCQ2pVpzblZcVtNYZn4SD0X1bTM1l4rMrg",
            authDomain: "soundvillage-8041b.firebaseapp.com",
            databaseURL: "https://soundvillage-8041b.firebaseio.com",
            projectId: "soundvillage-8041b",
            storageBucket: "soundvillage-8041b.appspot.com",
            messagingSenderId: "886570259513",
            persistence: true
        };
        const androidConfig = {
            clientId: "886570259513-441fp53esm7shqhk0vh7dbmdm093f78p.apps.googleusercontent.com",
            appId: "1:886570259513:ios:12c45ad35f39176a",
            apiKey: "AIzaSyCQ2pVpzblZcVtNYZn4SD0X1bTM1l4rMrg",
            authDomain: "soundvillage-8041b.firebaseapp.com",
            databaseURL: "https://soundvillage-8041b.firebaseio.com",
            projectId: "soundvillage-8041b",
            storageBucket: "soundvillage-8041b.appspot.com",
            messagingSenderId: "886570259513",
            persistence: true
        };
        firebase.app();
    }


  render() {
      return(
          <Provider store={store}>
              <MenuProvider>
                  <AppContainer
                  />
              </MenuProvider>
          </Provider>
      );
  }
}
