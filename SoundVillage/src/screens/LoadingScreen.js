import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from "react-native";
import firebase from 'react-native-firebase'

//
// Description: Checks to see if user is already logged in or not when opening the app
//
// Navigation Options: Login
//                      MainFeed
//

export default class Loading extends React.Component {
    componentDidMount() {
        //this.props.navigation.navigate('Login');
        firebase.auth().onAuthStateChanged(user => {
            if (user) {

                this.props.navigation.navigate('MainFeed', {currentPlaylistPlaying: null})
            }
            else {
                this.props.navigation.navigate('Login')
            }
        })
    }

    render() {
        return (
            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <Text>Loading</Text>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        marginTop: 50,
        padding: 20,
        backgroundColor: '#ffffff',
        flex: 1
    },

    text: {
        fontSize: 25,
        textAlign: 'center'
    }
});