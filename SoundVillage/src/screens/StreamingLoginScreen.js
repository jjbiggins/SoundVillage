import React from 'react';
import {Text, View, Button, StyleSheet, Alert, ActivityIndicator, TouchableHighlight, SafeAreaView} from 'react-native';
import firebase from 'react-native-firebase';
import Spotify from "rn-spotify-sdk";
import {NavigationEvents} from "react-navigation";

//
// Description: Allows a user to connect their streaming credentials
//
// Navigation Options: StreamingMain
//


export default class StreamingLoginScreen extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            value: {
                currentUser: null,
                spotifyInitialized: false,
                currentPlaylistPlaying: null,
                spotifyPlayer: null
            }
        };
        this.spotifyLoginButtonWasPressed = this.spotifyLoginButtonWasPressed.bind(this);
        this.handleOnFocus = this.handleOnFocus.bind(this);
    }

    spotifyLoginButtonWasPressed() {
        // log into StreamingLoginScreen
        Spotify.login().then((loggedIn) => {
            if(loggedIn) {
                // logged in
                this.props.navigation.navigate('StreamingMain');
            }
            else {
                // cancelled
            }
        }).catch((error) => {
            // error
            Alert.alert("Error 1", error.message);
        });
    }

    handleOnFocus() {
        Spotify.login().then((loggedIn) => {
            if(loggedIn) {
                // logged in
                this.props.navigation.navigate('StreamingMain');
            }
            else {
                // cancelled
            }
        }).catch((error) => {
            // error
            Alert.alert("Error 2", error.message);
        });
    }

    async initializeIfNeeded() {
        // initialize Spotify if it hasn't been initialized yet
        if(!await Spotify.isInitializedAsync()) {
            // initialize spotify
            const spotifyOptions = {
                "clientID":"d835653f92254a2eaa88a6e0f87aff8c",
                "sessionUserDefaultsKey":"SpotifySession",
                "redirectURL":"https://www.spotify.com/us/",
                "scopes":["user-read-private", "playlist-read", "playlist-read-private", "streaming"],
            };
            const loggedIn = await Spotify.initialize(spotifyOptions);

            console.log("loggedIn", loggedIn);
            // update UI state
            this.setState({
                spotifyInitialized: true
            });
            // handle initialization
            if(loggedIn) {
                this.props.navigation.navigate('StreamingMain');
            }

            Spotify.login().then((loggedIn) => {
                if(loggedIn) {
                    // logged in
                    this.props.navigation.navigate('StreamingMain');
                }
                else {
                    // cancelled
                }
            }).catch((error) => {
                // error
                Alert.alert("Error 3", error.message);
            });
        }
        else {
            // update UI state
            this.setState({
                spotifyInitialized: true
            });

            Spotify.login().then((loggedIn) => {
                if(loggedIn) {
                    // logged in
                    this.props.navigation.navigate('StreamingMain');
                }
                else {
                    // cancelled
                }
            }).catch((error) => {
                // error
                Alert.alert("Error 4", error.message);
            });
            // handle logged in
            if(await Spotify.isLoggedInAsync()) {
                this.props.navigation.navigate('StreamingMain');
            }
        }
    }

    componentDidMount() {
        this.initializeIfNeeded().catch((error) => {
            Alert.alert("Error 5", error.message);
        });

    }

    render() {
        if(!this.state.spotifyInitialized) {
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <ActivityIndicator animating={true} style={styles.loadIndicator}>
                    </ActivityIndicator>
                    <Text style={styles.loadMessage}>
                        Loading...
                    </Text>
                </SafeAreaView>
            );
        }
        else {
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <NavigationEvents
                        //onWillFocus={payload => console.log('will focus',payload)}
                        onDidFocus={payload => this.handleOnFocus()}
                        //onWillBlur={payload => console.log('will blur',payload)}
                        //onDidBlur={payload => console.log('did blur',payload)}
                    />
                    <Text style={styles.greeting}>
                        Hey! You! Log into your spotify
                    </Text>
                    <TouchableHighlight onPress={this.spotifyLoginButtonWasPressed} style={styles.spotifyLoginButton}>
                        <Text style={styles.spotifyLoginButtonText}>Log into Spotify</Text>
                    </TouchableHighlight>
                </SafeAreaView>
            );
        }
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    spotifyLoginButton: {
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: 'green',
        overflow: 'hidden',
        width: 200,
        height: 40,
        margin: 20,
    },
    spotifyLoginButtonText: {
        fontSize: 20,
        textAlign: 'center',
        color: 'white',
    }
});