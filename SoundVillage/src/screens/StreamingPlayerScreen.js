import {
    ActivityIndicator,
    Alert, Image,
    Slider,
    StyleSheet,
    Text,
    TouchableHighlight, TouchableOpacity,
    View, SafeAreaView, Dimensions
} from 'react-native';
import Spotify from 'rn-spotify-sdk';
import React from "react";
import Icon from "react-native-elements/src/icons/Icon";
import firebase from "react-native-firebase";
import EventEmitter from 'events';
import RNEvents from 'react-native-events';
import {NavigationEvents} from "react-navigation";


const nativeEvents = new EventEmitter();

//
// Description: Controls the music (shows album art, skip, upvote/downvote, pause, play)
//
// Navigation Options: StreamingMain (Back)
//


export default class StreamingMainScreen extends React.Component {
    constructor(props) {
        super(props);
        this.ref = firebase.firestore().collection('playlists');
        this.arrayholder = null;
        this.unsubscribeQueued = false;
        this.state = {
            spotifyUserName: null,
            track: null,
            player: null,
            trackLength : null,
            loading: true,
            queuedSongs: [],
            spotifyLoggedIn: false,
            currentUser: null,
            newPlaylistPassedIn: false
        };

        this.spotifyLogoutButtonWasPressed = this.spotifyLogoutButtonWasPressed.bind(this);
        this.spotifyPauseButtonWasPressed = this.spotifyPauseButtonWasPressed.bind(this);
        this.spotifyPlayButtonWasPressed = this.spotifyPlayButtonWasPressed.bind(this);
        this.spotifyGetCurrentSongPosition = this.spotifyGetCurrentSongPosition.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleOnFocus = this.handleOnFocus.bind(this);
    }

    static navigationOptions = ({ navigation, navigationOptions }) => {
        const { params } = navigation.state;

        return {

            headerTitle: 'Music Player',
            /* These values are used instead of the shared configuration! */
            headerRight: (
                null
            ),
            headerLeft: (
                null
            ) ,
            headerStyle: {
                backgroundColor: '#303338',
                textAlign: 'center',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
                textAlign: 'center',
                flexGrow: 1
            },
        };
    };

    onQueuedCollectionUpdate = (querySnapshot) => {
        const queuedSongs = [];
        querySnapshot.forEach((doc) => {
            const { songID, upvotes, downvotes, played, score } = doc.data();
            //console.log('This is: ', songID);
            queuedSongs.push({
                songID,
                upvotes,
                downvotes,
                score
            });
        });
        this.setState({
            queuedSongs,
        });
        if (this.state.newPlaylistPassedIn){
            this.setState({newPlaylistPassedIn: false});
            this.handleChange();
        }
        this.arrayholder = this.state.queuedSongs;
        console.log("Array:", this.arrayholder);
    };

    componentWillMount() {
        if (this.props.navigation.state.params) {
            this.unsubscribeQueued = this.ref.doc(this.props.navigation.state.params.currentPlaylistPlaying.id).collection('queuedSongs').orderBy("score", "desc").orderBy("timeAdded").onSnapshot(this.onQueuedCollectionUpdate);
            this.setState({currentPlaylistPlaying: this.props.navigation.state.params.currentPlaylistPlaying});
        }
        RNEvents.addSubscriber(Spotify, nativeEvents);
        nativeEvents.on('login', () => {
            this.setState({spotifyLoggedIn: true});
            this.handleChange();
        });
        nativeEvents.on('trackDelivered', () => {
            this.handleChange();
        });
        const {currentUser} = firebase.auth();
        this.setState({currentUser: currentUser});
    }


    goToInitialScreen() {
        this.props.navigation.navigate('StreamingLogin');
    }

    handleChange() {
        // send api request to get user info
        Spotify.getMe().then((result) => {
            // update state with user info
            this.setState({ spotifyUserName: result.display_name });
            if (this.state.queuedSongs[0] != null){
                Spotify.getTrack(this.state.queuedSongs[0].songID).then((response) =>
                    this.setState({track:response, trackLength:response['duration_ms']})).then(() => {
                    Spotify.getPlaybackStateAsync().then((response) =>
                        this.setState({player:response}));
                }).then(() => {
                    this.setState({
                        loading: false
                    });
                });
                // play song
                Spotify.playURI("spotify:track:" + this.state.queuedSongs[0].songID, 0, 0);
                let song = this.state.queuedSongs[0];

                this.ref.doc(this.state.currentPlaylistPlaying.id).collection('queuedSongs').doc(song.songID).delete();
                this.ref.doc(this.state.currentPlaylistPlaying.id).collection('dequeuedSongs').doc(song.songID).set({
                    songID: song.songID,
                    upvotes: song.upvotes,
                    downvotes: song.downvotes,
                    score: song.score,
                    timeAdded: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            else {
                this.setState({currentPlaylistPlaying: null, loading: false});
                firebase.firestore().collection('users').doc(this.state.currentUser.uid).update({currentPlaylistPlaying: null});
            }
        }).catch((error) => {
            // error
            Alert.alert("Error", error.message);
        });
    }

    handleOnFocus() {
        if (!this.state.currentPlaylistPlaying && this.props.navigation.state.params){
            if (this.props.navigation.state.params.action == 'play'){
                this.setState({loading: true, newPlaylistPassedIn: true, currentPlaylistPlaying: this.props.navigation.state.params.currentPlaylistPlaying});
                this.unsubscribeQueued = this.ref.doc(this.props.navigation.state.params.currentPlaylistPlaying.id).collection('queuedSongs').orderBy("score", "desc").orderBy("timeAdded").onSnapshot(this.onQueuedCollectionUpdate);
            }
        }
        else if (this.state.currentPlaylistPlaying && this.props.navigation.state.params){
            if (this.props.navigation.state.params.action == 'stop') {
                this.setState({currentPlaylistPlaying: null});
                this.spotifyPauseButtonWasPressed();
            }
        }
        console.log("Nav params", this.props.navigation.state.params);
    }

    spotifyPlayButtonWasPressed() {
        return Spotify.setPlaying(true);
    }

    spotifyPauseButtonWasPressed() {
        return Spotify.setPlaying(false);
        //  Spotify.getPlaybackStateAsync().then((response) =>
        //      this.setState({player:response}));
        //  console.log(this.state.track.name)
    }


    spotifyLogoutButtonWasPressed() {
        if (this.state.currentPlaylistPlaying){
            firebase.firestore().collection("users").doc(this.state.currentUser.uid).update({
                currentPlaylistPlaying: ''
            }).then(() => {
                this.setState({currentPlaylistPlaying: null}, () => {
                    Spotify.logout().finally(() => {
                        this.goToInitialScreen();
                    });
                });
            });

        }
        else {
            Spotify.logout().finally(() => {
                this.goToInitialScreen();
            });
        }
    }

    spotifyGetTrackLength() {
        // console.log(this.state.track.duration_ms);
        //  console.log(slider.maximumValue)
    }

    spotifyGetSongName() {
        return this.state.track.name
    }

    spotifyGetAlbumName() {
        return this.state.track.album.name
    }

    spotifyGetArtistName() {
        return this.state.track.artists[0].name
    }

    spotifyGetCoverArt() {
        return this.state.track.album.images[0].url
    }

    spotifyGetCurrentSongPosition() {
        Spotify.getPlaybackStateAsync().then((response) =>
            this.setState({player:response}));
        if(!this.state.player)
        {

        }
        else
        {
            return this.state.player.position;
        }
    }


    render() {
        if (this.state.loading){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <NavigationEvents
                        //onWillFocus={payload => console.log('will focus',payload)}
                        onDidFocus={payload => this.handleOnFocus()}
                        //onWillBlur={payload => console.log('will blur',payload)}
                        //onDidBlur={payload => console.log('did blur',payload)}
                    />
                    <Text>Loading</Text>
                    <ActivityIndicator size="large" />
                </SafeAreaView>
            );

        }
        else if (this.state.currentPlaylistPlaying == null || this.state.newPlaylistPassedIn){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <NavigationEvents
                        //onWillFocus={payload => console.log('will focus',payload)}
                        onDidFocus={payload => this.handleOnFocus()}
                        //onWillBlur={payload => console.log('will blur',payload)}
                        //onDidBlur={payload => console.log('did blur',payload)}
                    />
                    { this.state.spotifyUserName!=null ? (
                        <Text style={styles.greeting}>
                            You are logged in as {this.state.spotifyUserName}
                        </Text>
                    ) : (
                        <Text style={styles.greeting}>
                            Getting user info...
                        </Text>
                    )}

                    <TouchableHighlight onPress={this.spotifyLogoutButtonWasPressed}>
                        <Text>Logout</Text>
                    </TouchableHighlight>
                </SafeAreaView>
            );
        }
        return (
            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <NavigationEvents
                    //onWillFocus={payload => console.log('will focus',payload)}
                    onDidFocus={payload => this.handleOnFocus()}
                    //onWillBlur={payload => console.log('will blur',payload)}
                    //onDidBlur={payload => console.log('did blur',payload)}
                />
                { this.state.spotifyUserName!=null ? (
                    <Text style={styles.greeting}>
                        You are logged in as {this.state.spotifyUserName}
                    </Text>
                ) : (
                    <Text style={styles.greeting}>
                        Getting user info...
                    </Text>
                )}

                <TouchableHighlight onPress={this.spotifyLogoutButtonWasPressed}>
                    <Text>Logout</Text>
                </TouchableHighlight>
                <View style={styles.container}>
                    <Image
                        style={{width: Dimensions.get('window').width * 0.8, height: Dimensions.get('window').width * 0.8, margin: 30}}
                        source={{uri: this.spotifyGetCoverArt()}}
                    />
                    <Slider
                        style={{ width: Dimensions.get('window').width * 0.9 }}
                        minimumValue={0}
                        step={1}
                        value={this.spotifyGetCurrentSongPosition()}
                        minimumTrackTintColor={'#53687E'}
                        thumbTintColor={'#BEE5BF'}
                        maximumValue={this.state.trackLength/1000}
                        disabled={true}
                    />
                    <Text style ={styles.text}>
                        {this.spotifyGetAlbumName()}
                    </Text>
                    <Text style ={styles.text}>
                        {this.spotifyGetSongName()}
                    </Text>
                    <Text style = {styles.text}>
                        {this.spotifyGetArtistName()}
                    </Text>
                </View>

                <View style={styles.rowContainer}>
                    <TouchableOpacity onPress ={this.spotifyPlayButtonWasPressed}
                                      style={{
                                          borderWidth:1,
                                          borderColor:'rgba(0,0,0,0.2)',
                                          alignItems:'center',
                                          justifyContent:'center',
                                          width:60,
                                          height:60,
                                          backgroundColor:'#303338',
                                          borderRadius:100,
                                          marginRight: 10,
                                      }}
                    >
                        <Icon name={"play-arrow"}  size={55} color='#BEE5BF' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this.spotifyPauseButtonWasPressed}
                                      style={{
                                          borderWidth:1,
                                          borderColor:'rgba(0,0,0,0.2)',
                                          alignItems:'center',
                                          justifyContent:'center',
                                          width:60,
                                          height:60,
                                          backgroundColor:'#303338',
                                          borderRadius:100,
                                      }}
                    >
                        <Icon name={"pause"}  size={55} color='#BEE5BF' />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        //justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    greeting: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    rowContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 10,
        position: 'absolute',
        bottom: 20
    },
    text: {
        color: '#C0C0C0',
        fontSize: 18,
        textAlign: 'justify',
        lineHeight: 30,
    }
});