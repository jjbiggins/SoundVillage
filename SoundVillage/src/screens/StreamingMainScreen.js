import React from 'react';
import {
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Text,
    View,
    TouchableHighlight,
    SafeAreaView,
    Platform
} from 'react-native';
import { NavigationEvents } from 'react-navigation';
import firebase from 'react-native-firebase';
import {ListItem, Button, Overlay} from 'react-native-elements'
import Icon from "react-native-vector-icons/FontAwesome";
import Spotify from 'rn-spotify-sdk';
import MiniSpotifyPlayer from "../components/MiniSpotifyPlayer";
import EventEmitter from 'events';
import RNEvents from 'react-native-events';
import TouchableScale from "react-native-touchable-scale";
import LinearGradient from "react-native-linear-gradient";

const nativeEvents = new EventEmitter();

//
// Description: List of Playlists that user created (So they would be the admin)
//
// Navigation Options: StreamingLogin (Disconnect Credentials)
//                      CreatePlaylist
//                      PlaylistDetail
//                      StreamingPlayer
//

const genreDict = {'Rock': 'https://i.postimg.cc/7ZxtS7Bk/icons8-rock-music-64.png', 'Pop': 'https://i.postimg.cc/wB4rqvQd/icons8-ice-pop-pink-64.png', 'Hip Hop/Rap': 'https://i.postimg.cc/8cMXmbQ1/icons8-hip-hop-music-96.png',
    'Throwback': 'https://i.postimg.cc/L8T7Wvq5/icons8-boombox-96.png', 'Party Time': 'https://i.postimg.cc/XY3mxtYt/icons8-champagne-64.png', 'Night In': 'https://i.postimg.cc/fTQrT1mk/icons8-night-64.png',
    'Random': 'https://i.postimg.cc/PxBFDR73/icons8-musical-notes-64.png', 'Workout': 'https://i.postimg.cc/sfhLz3Bt/icons8-muscle-64.png', 'Happy': 'https://i.postimg.cc/c475KTBh/icons8-party-64.png',
    'Sad': 'https://i.postimg.cc/sXBNvrTG/icons8-crying-80.pngs', 'Alternative': 'https://i.postimg.cc/L8T7Wvq5/icons8-boombox-96.png', 'Country': 'https://i.postimg.cc/zfGMYWWj/icons8-country-music-96.png'};


export default class StreamingMainScreen extends React.Component {
    constructor(props){
        super(props);
        this.unsubscribe = null;
        this.state = {
                currentUser: null,
                playlists: [],
                loading: true,
                isVisible: false,
                playlistPressed: null,
                playButtonEnabled: true,
                stopButtonEnabled: true,
                spotifyPlayer: null,
        };
        this.spotifyLogoutButtonWasPressed = this.spotifyLogoutButtonWasPressed.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
    }

    componentWillUnmount() {
        this.unsubscribe();
        this.setState({isVisible: false});
    }

    componentDidMount() {
        const {currentUser} = firebase.auth();
        this.unsubscribe = firebase.firestore().collection('playlists').where('adminID', '==', currentUser.uid).onSnapshot(this.onCollectionUpdate);
        if (Platform.OS == 'ios'){
            firebase.firestore().collection('users').doc(currentUser.uid).onSnapshot((doc) => {
                this.setState({currentUser: doc._data, spotifyPlayer: Spotify.getPlaybackMetadata()});
            });
            RNEvents.addSubscriber(Spotify, nativeEvents);
            nativeEvents.on('trackChange', () => {
                this.handleFocus()
            });
        }
        else {
            firebase.firestore().collection('users').doc(currentUser.uid).onSnapshot((doc) => {
                this.setState({currentUser: doc._data});
            });
        }
    }

    handleFocus() {
        if (Platform.OS == 'ios') {
            this.setState({spotifyPlayer: Spotify.getPlaybackMetadata()});
        }
    }

    handleBlur() {
        this.setState({isVisible: false});
    }

    static navigationOptions = ({ navigation, navigationOptions }) => {
        const { params } = navigation.state;

        return {

            headerTitle: 'My Playlists',
            /* These values are used instead of the shared configuration! */
            headerRight: (
                <Button
                    type="clear"
                    icon={
                        <Icon
                            name="plus-circle"
                            size={25}
                            color="#F7F7F2"
                        />
                    }
                    iconRight
                    title=""
                    onPress={() => navigation.navigate('CreatePlaylist')}
                />
            ),
            headerLeft: (
                null
            ) ,
            headerStyle: {
                backgroundColor: '#303338',
                textAlign: 'center',
            },
            headerTintColor: '#F7F7F2',
            headerTitleStyle: {
                fontWeight: 'bold',
                textAlign: 'center',
                flexGrow: 1
            },
        };
    };

    onCollectionUpdate = (querySnapshot) => {
        const playlists = [];
        querySnapshot.forEach((doc) => {
            const { name, adminID, isPrivate, genre, adminName, usersJoinedAmount } = doc.data();
            playlists.push({
                id: doc.id,
                name,
                adminID,
                isPrivate,
                genre,
                adminName,
                usersJoinedAmount
            });
        });
        this.setState({
            playlists,
            loading: false,
        });
    };

    spotifyLogoutButtonWasPressed() {
        Spotify.logout().finally(() => {
            this.props.navigation.navigate('StreamingLogin');
        });
    }

    playPlaylist() {
        this.setState({isVisible: false}, () => {
            if (this.state.playlistPressed.adminID == this.state.currentUser.uid){
                if (!this.state.currentUser.currentPlaylistPlaying) {
                    console.log("playlist pressed: ", this.state.playlistPressed);
                    firebase.firestore().collection("users").doc(this.state.currentUser.uid).update({
                        currentPlaylistPlaying: this.state.playlistPressed.id
                    }).then(() => {
                        this.props.navigation.navigate('StreamingPlayer', {currentPlaylistPlaying: this.state.playlistPressed, action: 'play'});
                    });
                }
            }
        });
    }

    stopPlaylist() {
        this.setState({isVisible: false}, () => {
            if (this.state.playlistPressed.adminID == this.state.currentUser.uid){
                if (this.state.currentUser.currentPlaylistPlaying == this.state.playlistPressed.id) {
                    firebase.firestore().collection("users").doc(this.state.currentUser.uid).update({
                        currentPlaylistPlaying: ''
                    }).then(() => {
                        this.props.navigation.navigate('StreamingPlayer', {action: 'stop'});
                    });
                }
            }
        });
    }

    async configureOverlay(playlist){
        if (this.state.currentUser.currentPlaylistPlaying){
            if (this.state.currentUser.currentPlaylistPlaying == playlist.id){
                await this.setState({playButtonEnabled: false, stopButtonEnabled: true, isVisible: true, playlistPressed: playlist});
            }
            else {
                await this.setState({playButtonEnabled: false, stopButtonEnabled: false, isVisible: true, playlistPressed: playlist});
            }
        }
        else {
            await this.setState({playButtonEnabled: true, stopButtonEnabled: false, isVisible: true, playlistPressed: playlist});
        }
        console.log("current state", this.state);
    };

    renderIcon = (type) => {
        if (type == 'play'){
            if (this.state.playButtonEnabled){
                return (
                    <Icon
                        name="play"
                        size={50}
                        color="#F7F7F2"
                    />
                )
            }
            return (
                <Icon
                    name="play"
                    size={50}
                    color="grey"
                />
            )
        }
        if (this.state.stopButtonEnabled){
            return (
                <Icon
                    name="stop"
                    size={50}
                    color="#F7F7F2"
                />
            )
        }
        return (
            <Icon
                name="stop"
                size={50}
                color="grey"
            />
        )

    };

    spotifyPlayButtonWasPressed() {
        return Spotify.setPlaying(true);
    }

    spotifyPauseButtonWasPressed() {
        return Spotify.setPlaying(false);
    }

    render() {
        if (this.state.loading){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <ActivityIndicator size="large" />
                </SafeAreaView>
            )
        }
        else if (Platform.OS == 'ios' && this.state.spotifyPlayer && this.state.currentUser.currentPlaylistPlaying && this.state.spotifyPlayer.currentTrack){
            return (
                <SafeAreaView style={styles.container}>
                    <NavigationEvents
                        onDidFocus={payload => {
                            this.handleFocus();
                        }}
                    />
                    <TouchableHighlight style={{alignItems: 'center', margin: 5}} onPress={this.spotifyLogoutButtonWasPressed}>
                        <Text style={{color: '#F7F7F2', fontSize: 16}}>Logout of Spotify</Text>
                    </TouchableHighlight>
                    <FlatList style={{position: 'absolute', bottom: 90, top: 20, right: 0, left: 0}}
                        data={this.state.playlists}
                        renderItem={({ item }) =>
                            <ListItem
                                Component={TouchableScale}
                                friction={90} //
                                tension={100} // These props are passed to the parent component (here TouchableScale)
                                activeScale={0.7} //
                                linearGradientProps={{
                                    colors: ['#53687E', '#F7F7F2'],
                                    start: {x: 1, y: 0},
                                    end: {x: 0.2, y: 0},
                                }}
                                ViewComponent={LinearGradient} // Only if no expo
                                title={item.name}
                                titleStyle={styles.listItemTitle}
                                subtitle={
                                    <View>
                                        <Text>{"Admin: " + item.adminName}</Text>
                                        <Text>{item.usersJoinedAmount + " Users"}</Text>
                                    </View>}
                                leftAvatar={{
                                    title: item.genre[0],
                                    source: {uri: genreDict[item.genre]},
                                    size: 'medium',
                                    avatarStyle: {backgroundColor: '#F7F7F2'},
                                    rounded: false
                                }}
                                onPress={() => this.props.navigation.navigate('PlaylistDetail', {playlistID: item.id, playlistName: item.name, type: 'admin'})}
                                onLongPress={() => this.configureOverlay(item)}
                                containerStyle={styles.listItemContainer}
                                chevronColor='#303338'
                                chevron
                            />
                        }
                        keyExtractor={item => item.name}
                              ListEmptyComponent={() => (
                                  <Text style={{textAlign: 'center', margin: 30, color: '#F7F7F2'}}>You have not created any playlists</Text>
                              )}
                    />
                    <Overlay
                        isVisible={this.state.isVisible}
                        windowBackgroundColor="rgba(255, 255, 255, .5)"
                        overlayBackgroundColor="#53687E"
                        onBackdropPress={() => this.setState({isVisible: false, playlistPressed: null, playButtonEnabled: true, stopButtonEnabled: true})}
                        width="auto"
                        height={90}
                    >
                        <View style={{flex: 1, flexDirection: 'row'}}>
                            <Button
                                type="clear"
                                icon={this.renderIcon('play')}
                                iconRight
                                disabled={!this.state.playButtonEnabled}
                                disabledStyle={{opacity: 50}}
                                title=""
                                onPress={() => this.playPlaylist()}
                            />
                            <Button
                                type="clear"
                                icon={this.renderIcon('stop')}
                                iconRight
                                disabled={!this.state.stopButtonEnabled}
                                disabledStyle={{opacity: 50}}
                                title=""
                                onPress={() => this.stopPlaylist()}
                            />
                        </View>
                    </Overlay>
                    <MiniSpotifyPlayer
                        spotifyCoverArt={this.state.spotifyPlayer.currentTrack.albumCoverArtURL}
                        spotifySongName={this.state.spotifyPlayer.currentTrack.contextName}
                        spotifyArtistName={this.state.spotifyPlayer.currentTrack.artistName}
                        spotifyAlbumName={this.state.spotifyPlayer.currentTrack.albumName}
                    />

                </SafeAreaView>
            );
        }
        else if (Platform.OS == 'ios' && (!this.state.spotifyPlayer || !this.state.currentUser.currentPlaylistPlaying)){
            return (
                <SafeAreaView style={styles.container}>
                    <NavigationEvents
                        onDidFocus={payload => {
                            this.handleFocus();
                        }}
                        onWillBlur={payload => this.handleBlur()}
                    />
                    <TouchableHighlight style={{alignItems: 'center', margin: 5}} onPress={this.spotifyLogoutButtonWasPressed}>
                        <Text style={{color: '#F7F7F2', fontSize: 16}}>Logout of Spotify</Text>
                    </TouchableHighlight>
                    <FlatList style={{position: 'absolute', bottom: 0, top: 20, right: 0, left: 0}}
                              data={this.state.playlists}
                              renderItem={({ item }) =>
                                  <ListItem
                                      Component={TouchableScale}
                                      friction={90} //
                                      tension={100} // These props are passed to the parent component (here TouchableScale)
                                      activeScale={0.7} //
                                      linearGradientProps={{
                                          colors: ['#53687E', '#F7F7F2'],
                                          start: {x: 1, y: 0},
                                          end: {x: 0.2, y: 0},
                                      }}
                                      ViewComponent={LinearGradient} // Only if no expo
                                      title={item.name}
                                      titleStyle={styles.listItemTitle}
                                      subtitle={
                                          <View>
                                              <Text>{"Admin: " + item.adminName}</Text>
                                              <Text>{item.usersJoinedAmount + " Users"}</Text>
                                          </View>}
                                      leftAvatar={{
                                          title: item.genre[0],
                                          source: {uri: genreDict[item.genre]},
                                          size: 'medium',
                                          avatarStyle: {backgroundColor: '#F7F7F2'},
                                          rounded: false
                                      }}
                                      onPress={() => this.props.navigation.navigate('PlaylistDetail', {playlistID: item.id, playlistName: item.name, type: 'admin'})}
                                      onLongPress={() => this.configureOverlay(item)}
                                      containerStyle={styles.listItemContainer}
                                      chevronColor='#303338'
                                      chevron
                                  />
                              }
                              keyExtractor={item => item.name}
                              ListEmptyComponent={() => (
                                  <Text style={{textAlign: 'center', margin: 30, color: '#F7F7F2'}}>You have not created any playlists</Text>
                              )}
                    />
                    <Overlay
                        isVisible={this.state.isVisible}
                        windowBackgroundColor="rgba(255, 255, 255, .5)"
                        overlayBackgroundColor="#53687E"
                        onBackdropPress={() => this.setState({isVisible: false, playlistPressed: null, playButtonEnabled: true, stopButtonEnabled: true})}
                        width="auto"
                        height={90}
                    >
                        <View style={{flex: 1, flexDirection: 'row'}}>
                            <Button
                                type="clear"
                                icon={this.renderIcon('play')}
                                iconRight
                                disabled={!this.state.playButtonEnabled}
                                disabledStyle={{opacity: 50}}
                                title=""
                                onPress={() => this.playPlaylist()}
                            />
                            <Button
                                type="clear"
                                icon={this.renderIcon('stop')}
                                iconRight
                                disabled={!this.state.stopButtonEnabled}
                                disabledStyle={{opacity: 50}}
                                title=""
                                onPress={() => this.stopPlaylist()}
                            />
                        </View>
                    </Overlay>

                </SafeAreaView>
            );
        }

        return (
            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <TouchableHighlight style={{alignItems: 'center', margin: 5}} onPress={this.spotifyLogoutButtonWasPressed}>
                    <Text style={{color: '#F7F7F2', fontSize: 16}}>Logout of Spotify</Text>
                </TouchableHighlight>
                <FlatList style={{position: 'absolute', bottom: 0, top: 20, right: 0, left: 0}}
                    data={this.state.playlists}
                    renderItem={({ item }) =>
                        <ListItem
                            Component={TouchableScale}
                            friction={90} //
                            tension={100} // These props are passed to the parent component (here TouchableScale)
                            activeScale={0.7} //
                            linearGradientProps={{
                                colors: ['#53687E', '#F7F7F2'],
                                start: {x: 1, y: 0},
                                end: {x: 0.2, y: 0},
                            }}
                            ViewComponent={LinearGradient} // Only if no expo
                            title={item.name}
                            titleStyle={styles.listItemTitle}
                            subtitle={
                                <View>
                                    <Text>{"Admin: " + item.adminName}</Text>
                                    <Text>{item.usersJoinedAmount + " Users"}</Text>
                                </View>}
                            leftAvatar={{
                                title: item.genre[0],
                                source: {uri: genreDict[item.genre]},
                                size: 'medium',
                                avatarStyle: {backgroundColor: '#F7F7F2'},
                                rounded: false
                            }}
                            onPress={() => this.props.navigation.navigate('PlaylistDetail', {playlistID: item.id, playlistName: item.name, type: 'admin'})}
                            onLongPress={() => this.configureOverlay(item)}
                            containerStyle={styles.listItemContainer}
                            chevronColor='#303338'
                            chevron
                        />
                    }
                    keyExtractor={item => item.name}
                          ListEmptyComponent={() => (
                              <Text style={{textAlign: 'center', margin: 30, color: '#F7F7F2'}}>You have not created any playlists</Text>
                          )}
                />
                <Overlay
                    isVisible={this.state.isVisible}
                    windowBackgroundColor="rgba(255, 255, 255, .5)"
                    overlayBackgroundColor="#53687E"
                    onBackdropPress={() => this.setState({isVisible: false, playlistPressed: null, playButtonEnabled: true, stopButtonEnabled: true})}
                    width="auto"
                    height={90}
                >
                    <View style={{flex: 1, flexDirection: 'row'}}>
                        <Button
                            type="clear"
                            icon={this.renderIcon('play')}
                            iconRight
                            disabled={!this.state.playButtonEnabled}
                            disabledStyle={{opacity: 50}}
                            title=""
                            onPress={() => this.playPlaylist()}
                        />
                        <Button
                            type="clear"
                            icon={this.renderIcon('stop')}
                            iconRight
                            disabled={!this.state.stopButtonEnabled}
                            disabledStyle={{opacity: 50}}
                            title=""
                            onPress={() => this.stopPlaylist()}
                        />
                    </View>
                </Overlay>
            </SafeAreaView>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#303338'
    },
    listItemContainer: {
        margin: 10,
        backgroundColor: '#F7F7F2',
        borderRadius: 5,
        flex: 1
    },
    listItemTitle: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#303338',
        fontFamily: 'coolvetica'
    }
});