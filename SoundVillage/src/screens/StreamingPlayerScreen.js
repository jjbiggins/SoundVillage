import {
    ActivityIndicator,
    Alert, Image,
    Slider,
    StyleSheet,
    Text,
    TouchableHighlight, TouchableOpacity,
    View, SafeAreaView, Dimensions, Platform
} from 'react-native';
import Spotify from 'rn-spotify-sdk';
import React from "react";
import firebase from "react-native-firebase";
import EventEmitter from 'events';
import RNEvents from 'react-native-events';
import {NavigationEvents} from "react-navigation";
import Icon from 'react-native-vector-icons/FontAwesome';


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
        this.unsubscribeQueued = null;
        this.state = {
            spotifyUserName: null,
            track: null,
            player: null,
            trackLength : null,
            loading: true,
            queuedSongs: [],
            spotifyLoggedIn: false,
            currentUser: null,
            newPlaylistPassedIn: false,
            isPlaying: false
        };

        this.spotifyLogoutButtonWasPressed = this.spotifyLogoutButtonWasPressed.bind(this);
        this.spotifyPauseButtonWasPressed = this.spotifyPauseButtonWasPressed.bind(this);
        this.spotifyPlayButtonWasPressed = this.spotifyPlayButtonWasPressed.bind(this);
        this.spotifySkipButtonWasPressed = this.spotifySkipButtonWasPressed.bind(this);
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
        nativeEvents.on('play', () => {
            this.setState({isPlaying: true});
        });
        nativeEvents.on('pause', () => {
            this.setState({isPlaying: false});
        });
        const {currentUser} = firebase.auth();
        this.setState({currentUser: currentUser});
    }


    goToInitialScreen() {
        this.props.navigation.navigate('StreamingLogin');
    }

    spotifySkipButtonWasPressed() {
        this.handleChange();
    }

    async handleChange() {
        // send api request to get user info
        await Spotify.getMe().then((result) => {
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
                Spotify.setPlaying(false);
                this.setState({currentPlaylistPlaying: null, loading: false});
                firebase.firestore().collection('users').doc(this.state.currentUser.uid).update({currentPlaylistPlaying: null});
                this.unsubscribeQueued = null;
            }
        }).catch((error) => {
            // error
            Alert.alert("Error", error.message);
        });
    }

    componentWillUnmount() {
        if (this.state.unsubscribeQueued){
            this.unsubscribeQueued();
        }
        firebase.firestore().collection('users').doc(this.state.currentUser.uid).update({currentPlaylistPlaying: null});
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
        if(this.state.player)
        {
            return this.state.player.position;
        }
    }

    renderButtons() {
        if (this.state.isPlaying){
            if (Dimensions.get('window').height < 670){
                return (
                    <TouchableOpacity onPress={this.spotifyPauseButtonWasPressed}
                                      style={{
                                          alignItems:'center',
                                          justifyContent:'center',
                                          width:50,
                                          height:50,
                                          backgroundColor:'#303338',
                                          borderRadius:100,
                                          marginRight: 2
                                      }}
                    >
                        <Icon name={"pause"}  size={35} color='#BEE5BF' />
                    </TouchableOpacity>
                )
            }
            else if (Platform.OS =='android'){
                return (
                    <TouchableOpacity onPress={this.spotifyPauseButtonWasPressed}
                                      style={{
                                          alignItems:'center',
                                          justifyContent:'center',
                                          width:55,
                                          height:55,
                                          backgroundColor:'#303338',
                                          borderRadius:100,
                                          marginRight: 2
                                      }}
                    >
                        <Icon name={"pause"}  size={40} color='#BEE5BF' />
                    </TouchableOpacity>
                )
            }
            return (
                <TouchableOpacity onPress={this.spotifyPauseButtonWasPressed}
                                  style={{
                                      alignItems:'center',
                                      justifyContent:'center',
                                      width:60,
                                      height:60,
                                      backgroundColor:'#303338',
                                      borderRadius:100,
                                      marginRight: 3
                                  }}
                >
                    <Icon name={"pause"}  size={45} color='#BEE5BF' />
                </TouchableOpacity>
            )
        }
        if (Dimensions.get('window').height < 670){
            return (
                <TouchableOpacity onPress ={this.spotifyPlayButtonWasPressed}
                                  style={{
                                      alignItems:'center',
                                      justifyContent:'center',
                                      width:50,
                                      height:50,
                                      backgroundColor:'#303338',
                                      borderRadius:100,
                                      marginRight: 3
                                  }}
                >
                    <Icon name={"play"}  size={35} color='#BEE5BF' />
                </TouchableOpacity>
            )
        }
        else if (Platform.OS =='android'){
            return (
                <TouchableOpacity onPress={this.spotifyPlayButtonWasPressed}
                                  style={{
                                      alignItems:'center',
                                      justifyContent:'center',
                                      width:55,
                                      height:55,
                                      backgroundColor:'#303338',
                                      borderRadius:100,
                                      marginRight: 3
                                  }}
                >
                    <Icon name={"play"}  size={40} color='#BEE5BF' />
                </TouchableOpacity>
            )
        }
        return (
            <TouchableOpacity onPress ={this.spotifyPlayButtonWasPressed}
                              style={{
                                  alignItems:'center',
                                  justifyContent:'center',
                                  width:60,
                                  height:60,
                                  backgroundColor:'#303338',
                                  borderRadius:100,
                                  marginRight: 3
                              }}
            >
                <Icon name={"play"}  size={45} color='#BEE5BF' />
            </TouchableOpacity>
        )
    }

    renderSkip() {
            if (Dimensions.get('window').height < 670){
                return (
                    <TouchableOpacity onPress={this.spotifySkipButtonWasPressed}
                                      style={{
                                          alignItems:'center',
                                          justifyContent:'center',
                                          width:50,
                                          height:50,
                                          backgroundColor:'#303338',
                                          borderRadius:100,
                                          marginLeft: 3
                                      }}
                    >
                        <Icon name={"forward"}  size={35} color='#BEE5BF' />
                    </TouchableOpacity>
                )
            }
            else if (Platform.OS =='android'){
                return (
                    <TouchableOpacity onPress={this.spotifySkipButtonWasPressed}
                                      style={{
                                          alignItems:'center',
                                          justifyContent:'center',
                                          width:55,
                                          height:55,
                                          backgroundColor:'#303338',
                                          borderRadius:100,
                                          marginLeft: 3
                                      }}
                    >
                        <Icon name={"forward"}  size={40} color='#BEE5BF' />
                    </TouchableOpacity>
                )
            }
            return (
                <TouchableOpacity onPress={this.spotifySkipButtonWasPressed}
                                  style={{
                                      alignItems:'center',
                                      justifyContent:'center',
                                      width:60,
                                      height:60,
                                      backgroundColor:'#303338',
                                      borderRadius:100,
                                      marginLeft: 3
                                  }}
                >
                    <Icon name={"forward"}  size={45} color='#BEE5BF' />
                </TouchableOpacity>
            )
    }

    renderView() {
        if (Dimensions.get('window').height < 670 || Platform.OS =='android'){
            return (
                <View style={styles.rowContainer1}>
                    {this.renderButtons()}
                    {this.renderSkip()}
                </View>
            )
        }
        return (
                <View style={styles.rowContainer}>
                    {this.renderButtons()}
                    {this.renderSkip()}
                </View>
            )
    }

    renderPlayer() {
        if (Dimensions.get('window').height < 670){
            return (
                <View style={styles.container}>
                    <Image
                        style={{width: Dimensions.get('window').height * 0.35, height: Dimensions.get('window').height * 0.35, margin: 10}}
                        source={{uri: this.spotifyGetCoverArt()}}
                    />
                    <Slider
                        style={{ width: Dimensions.get('window').width * 0.8 }}
                        minimumValue={0}
                        step={1}
                        value={this.spotifyGetCurrentSongPosition()}
                        minimumTrackTintColor={'#F7F7F7'}
                        thumbTintColor={'#BEE5BF'}
                        maximumValue={this.state.trackLength/1000}
                        disabled={true}
                    />
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style ={styles.text1}>
                        {this.spotifyGetAlbumName()}
                    </Text>
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style ={styles.text1}>
                        {this.spotifyGetSongName()}
                    </Text>
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style = {styles.text1}>
                        {this.spotifyGetArtistName()}
                    </Text>
                </View>
            )
        }
        else if (Platform.OS =='android'){
            return (
                <View style={styles.container}>
                    <Image
                        style={{width: Dimensions.get('window').height * 0.40, height: Dimensions.get('window').height * 0.40, margin: 10}}
                        source={{uri: this.spotifyGetCoverArt()}}
                    />
                    <Slider
                        style={{ width: Dimensions.get('window').width * 0.85 }}
                        minimumValue={0}
                        step={1}
                        value={this.spotifyGetCurrentSongPosition()}
                        minimumTrackTintColor={'#F7F7F7'}
                        thumbTintColor={'#BEE5BF'}
                        maximumValue={this.state.trackLength/1000}
                        disabled={true}
                    />
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style ={styles.text2}>
                        {this.spotifyGetAlbumName()}
                    </Text>
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style ={styles.text2}>
                        {this.spotifyGetSongName()}
                    </Text>
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style = {styles.text2}>
                        {this.spotifyGetArtistName()}
                    </Text>
                </View>
            )
        }
        return (
            <View style={styles.container}>
                <Image
                    style={{width: Dimensions.get('window').width * 0.8, height: Dimensions.get('window').width * 0.8, margin: 20}}
                    source={{uri: this.spotifyGetCoverArt()}}
                />
                <Slider
                    style={{ width: Dimensions.get('window').width * 0.9 }}
                    minimumValue={0}
                    step={1}
                    value={this.spotifyGetCurrentSongPosition()}
                    minimumTrackTintColor={'#F7F7F7'}
                    thumbTintColor={'#BEE5BF'}
                    maximumValue={this.state.trackLength/1000}
                    disabled={true}
                />
                <Text adjustsFontSizeToFit={true} numberOfLines={1} style ={styles.text}>
                    {this.spotifyGetAlbumName()}
                </Text>
                <Text adjustsFontSizeToFit={true} numberOfLines={1} style ={styles.text}>
                    {this.spotifyGetSongName()}
                </Text>
                <Text adjustsFontSizeToFit={true} numberOfLines={1} style = {styles.text}>
                    {this.spotifyGetArtistName()}
                </Text>
            </View>
        )
    }


    render() {
        if (this.state.loading){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <NavigationEvents
                        onDidFocus={payload => this.handleOnFocus()}
                    />
                    <ActivityIndicator size="large" />
                </SafeAreaView>
            );

        }
        else if (this.state.currentPlaylistPlaying == null || this.state.newPlaylistPassedIn){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <NavigationEvents
                        onDidFocus={payload => this.handleOnFocus()}
                    />
                    { this.state.spotifyUserName!=null ? (
                        <Text style={styles.greeting} adjustsFontSizeToFit={true} numberOfLines={1}>
                            Logged into Spotify as {this.state.spotifyUserName}
                        </Text>
                    ) : (
                        <Text style={styles.greeting}>
                            Getting user info...
                        </Text>
                    )}

                    <TouchableHighlight onPress={this.spotifyLogoutButtonWasPressed}>
                        <Text style={{color: '#F7F7F7'}}>Logout</Text>
                    </TouchableHighlight>
                </SafeAreaView>
            );
        }
        return (
            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <NavigationEvents
                    onDidFocus={payload => this.handleOnFocus()}
                />
                { this.state.spotifyUserName!=null ? (
                    <Text style={styles.greeting} adjustsFontSizeToFit={true} numberOfLines={1}>
                        Logged into Spotify as {this.state.spotifyUserName}
                    </Text>
                ) : (
                    <Text style={styles.greeting}>
                        Getting user info...
                    </Text>
                )}

                <TouchableHighlight onPress={this.spotifyLogoutButtonWasPressed}>
                    <Text style={{color: '#F7F7F7'}}>Logout</Text>
                </TouchableHighlight>
                {this.renderPlayer()}
                {this.renderView()}
            </SafeAreaView>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#303338',
    },
    greeting: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
        color: '#F7F7F7'
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
    rowContainer1: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 10,
        position: 'absolute',
        bottom: 0
    },
    text: {
        color: '#F7F7F7',
        fontSize: 18,
        textAlign: 'justify',
        lineHeight: 30,
    },
    text1: {
        color: '#F7F7F7',
        fontSize: 16,
        textAlign: 'justify',
        lineHeight: 25,
    },
    text2: {
        color: '#F7F7F7',
        fontSize: 17,
        textAlign: 'justify',
        lineHeight: 28,
    }

});