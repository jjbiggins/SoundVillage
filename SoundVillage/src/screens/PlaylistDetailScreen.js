import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    Dimensions
} from 'react-native';
import {Avatar, Button, ListItem, Overlay} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import firebase from "react-native-firebase";
import Spotify from "rn-spotify-sdk";
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
    renderers
} from 'react-native-popup-menu';
import Input from "../components/Input";
import LinearGradient from 'react-native-linear-gradient';

//
// Description: Shows the detailed information about a playlist (Name, Admin, Users that joined, isPrivate, if private the code, the songs added
//
// Navigation Options: MainFeed (Back)
//                      EditPlaylist (If Admin who created is viewing)
//                      PlaylistUsers
//                      SongSearch
//

const { SlideInMenu, ContextMenu } = renderers;

const genreDict = {'Rock': 'https://i.postimg.cc/7ZxtS7Bk/icons8-rock-music-64.png', 'Pop': 'https://i.postimg.cc/wB4rqvQd/icons8-ice-pop-pink-64.png', 'Hip Hop/Rap': 'https://i.postimg.cc/8cMXmbQ1/icons8-hip-hop-music-96.png',
    'Throwback': 'https://i.postimg.cc/L8T7Wvq5/icons8-boombox-96.png', 'Party Time': 'https://i.postimg.cc/XY3mxtYt/icons8-champagne-64.png', 'Night In': 'https://i.postimg.cc/fTQrT1mk/icons8-night-64.png',
    'Random': 'https://i.postimg.cc/PxBFDR73/icons8-musical-notes-64.png', 'Workout': 'https://i.postimg.cc/sfhLz3Bt/icons8-muscle-64.png', 'Happy': 'https://i.postimg.cc/c475KTBh/icons8-party-64.png',
    'Sad': 'https://i.postimg.cc/sXBNvrTG/icons8-crying-80.pngs', 'Alternative': 'https://i.postimg.cc/L8T7Wvq5/icons8-boombox-96.png', 'Country': 'https://i.postimg.cc/zfGMYWWj/icons8-country-music-96.png'};

export default class PlaylistDetailScreen extends React.Component {
    constructor(props) {
        super(props);
        this.ref = firebase.firestore().collection('playlists');
        this.unsubscribeQueued = null;
        this.unsubscribeDequeued = null;
        this.state = {
                playlist: null,
                name: '',
                queuedSongs: [],
                dequeuedSongs: [],
                currentUser: null,
                loading: true,
                isVisible: false,
                songPressed: null,
                downvoteButtonEnabled: true,
                upvoteButtonEnabled: true,
                type: '',
                currentPlaylistPlaying: null,
                spotifyPlayer: null,
                userJoined: false,
                playlistSaved: false,
                isPrivate: false,
                privateIsVisible: false,
                playlistPassword: '',
                passwordAttempt: ''
        }
        this.onSubmit = this.onSubmit.bind(this);
    }

    addUserToPlaylist = (playlistID, uid) => {
        if(this.state.isPrivate)
        {
            if(this.state.playlistPassword === this.state.passwordAttempt)
            {
                firebase.firestore().collection('playlists').doc(playlistID).collection('usersJoined').doc(uid).set({
                    id: uid, firstName: this.state.currentUser.firstName, lastName: this.state.currentUser.lastName, downloadUrl: this.state.currentUser.downloadUrl
                }).then(() => {
                    this.setState({userJoined: true});
                    this.props.navigation.setParams({
                        headerRight:
                            <Button
                                type="clear"
                                icon={
                                    <Icon
                                        name="plus-circle"
                                        size={25}
                                        color="white"
                                    />
                                }
                                iconRight
                                title=""
                                onPress={() => this.props.navigation.navigate('SearchSongs', {playlistID: playlistID})}
                            />
                    })});
                    firebase.firestore().collection('playlists').doc(playlistID).update({
                      usersJoinedAmount: firebase.firestore.FieldValue.increment(1)
                    });
            }
            else
            {
                console.log("Login failure")
            }
        }
        else
        {
            firebase.firestore().collection('playlists').doc(playlistID).collection('usersJoined').doc(uid).set({
                    id: uid, firstName: this.state.currentUser.firstName, lastName: this.state.currentUser.lastName, downloadUrl: this.state.currentUser.downloadUrl
                }).then(() => {
                    this.setState({userJoined: true});
                    this.props.navigation.setParams({
                        headerRight:
                            <Button
                                type="clear"
                                icon={
                                    <Icon
                                        name="plus-circle"
                                        size={25}
                                        color="white"
                                    />
                                }
                                iconRight
                                title=""
                                onPress={() => this.props.navigation.navigate('SearchSongs', {playlistID: playlistID})}
                            />
                    })});
                    firebase.firestore().collection('playlists').doc(playlistID).update({
                        usersJoinedAmount: firebase.firestore.FieldValue.increment(1)
                    });
        }
    };



    static navigationOptions = ({ navigation, navigationOptions }) => {
        const { params } = navigation.state;

        return {
            /* These values are used instead of the shared configuration! */
            headerRight: params.headerRight,
            headerStyle: {
                backgroundColor: '#303338',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        };
    };

    onQueuedCollectionUpdate = (querySnapshot) => {
        let queuedSongs = [];
        querySnapshot.forEach((doc) => {
            const { songID, upvotes, downvotes, played, score } = doc.data();
            //console.log('This is: ', songID);
            Spotify.getTrack(songID).then((response) => {
               // console.log("Track", response);
                response["upvotes"] = upvotes;
                response["downvotes"] = downvotes;
                response["score"] = score;
                queuedSongs.push(response);
            });

        });
        this.setState({queuedSongs: queuedSongs}, () => {
            console.log("Songs", this.state.queuedSongs);
        });
    };

    onDequeuedCollectionUpdate = (querySnapshot) => {
        let dequeuedSongs = [];
        querySnapshot.forEach((doc) => {
            const { songID, upvotes, downvotes, played, score } = doc.data();
            console.log('This is: ', songID);
            Spotify.getTrack(songID).then((response) => {
                console.log("Track", response);
                response["upvotes"] = upvotes;
                response["downvotes"] = downvotes;
                response["score"] = score;
                dequeuedSongs.push(response);
            });

        });
        this.setState({dequeuedSongs: dequeuedSongs}, () => {
            console.log("Songs", this.state.dequeuedSongs);
        });
    };

    componentWillUnmount() {
        this.setState({isVisible: false, songPressed: null});
        this.unsubscribeQueued();
        this.unsubscribeDequeued();
    }

    async componentDidMount() {
        const {currentUser} = firebase.auth();
        this.setState({type: this.props.navigation.state.params.type});
        let playlistID = this.props.navigation.state.params.playlistID;
        let playlistIsPrivate = this.props.navigation.state.params.playlistIsPrivate;
        let playlistPassword = this.props.navigation.state.params.playlistPassword;
        this.setState({isPrivate: playlistIsPrivate});
        this.setState({playlistPassword: playlistPassword});
      //  let playlistPrivacy = firebase.firestore().collection("playlists").doc(playlistID).get();
        //console.log("Playlist Privacy: " + playlistPrivacy);
        await firebase.firestore().collection("playlists").doc(playlistID).get()
            .then((docSnapshot) => {
                if (docSnapshot.exists) {
                    this.setState({playlist: docSnapshot.data()});
                    firebase.firestore().collection("users").doc(docSnapshot.data().adminID).get().then((doc) => {
                        let user = {
                            uid: doc.data().uid,
                            firstName: doc.data().firstName,
                            lastName: doc.data().lastName,
                            profilePic: doc.data().downloadUrl
                        };
                        this.setState({admin: user});
                    });
                }
            });
        await firebase.firestore().collection("users").doc(currentUser.uid).get()
            .then((docSnapshot) => {
                if (docSnapshot.exists) {
                    this.setState({currentUser: docSnapshot.data()});
                }
            });
        this.unsubscribeQueued = this.ref.doc(playlistID).collection('queuedSongs').orderBy("score", "desc").orderBy("timeAdded").onSnapshot(this.onQueuedCollectionUpdate);
        this.unsubscribeDequeued = this.ref.doc(playlistID).collection('dequeuedSongs').orderBy('timeAdded').onSnapshot(this.onDequeuedCollectionUpdate);
        await firebase.firestore().collection("users").doc(currentUser.uid).collection("savedPlaylists").doc(playlistID).get()
            .then((docSnapshot) => {
                if (docSnapshot.exists) {
                    this.setState({playlistSaved: true});
                }
            });
        await this.ref.doc(playlistID).collection('usersJoined').doc(currentUser.uid).get()
            .then((docSnapshot) => {
                if (docSnapshot.exists) {
                    this.setState({userJoined: true, loading: false});
                    this.props.navigation.setParams({
                        headerRight:
                            <Button
                                type="clear"
                                icon={
                                    <Icon
                                        name="plus-circle"
                                        size={25}
                                        color="white"
                                    />
                                }
                                iconRight
                                title=""
                                onPress={() => this.props.navigation.navigate('SearchSongs', {playlistID: this.state.playlist.id, queuedSongs: this.state.queuedSongs, dequeuedSongs: this.state.dequeuedSongs})}
                            />
                    })
                }
                else
                {
                    if(playlistIsPrivate)
                    {
                        this.setState({privateIsVisible: true})
                    }
                    console.log("Is Private: " + this.state.isPrivate);
                    console.log("Private is visible: " + this.state.privateIsVisible);
                    console.log("Password: " + this.state.playlistPassword);
                    this.setState({loading: false});
                    this.props.navigation.setParams({
                        headerRight:
                            <Button
                                type="clear"
                                title="Join Playlist"
                                onPress={() => this.addUserToPlaylist(playlistID,currentUser.uid)}

                            />
                    })
                }
            });

        console.log("Current State is: ", this.state);
    }

    upvoteSong() {
        console.log("downvoteButton", this.state.downvoteButtonEnabled);
        if (!this.state.downvoteButtonEnabled) {
            this.ref.doc(this.state.playlist.id).collection('queuedSongs').doc(this.state.songPressed.id).update({upvotes: firebase.firestore.FieldValue.arrayUnion(this.state.currentUser.uid), score: this.state.songPressed.score + 2, downvotes: firebase.firestore.FieldValue.arrayRemove(this.state.currentUser.uid)});
        }
        else {
            this.ref.doc(this.state.playlist.id).collection('queuedSongs').doc(this.state.songPressed.id).update({upvotes: firebase.firestore.FieldValue.arrayUnion(this.state.currentUser.uid), score: this.state.songPressed.score + 1});
        }
        this.setState({upvoteButtonEnabled: false, downvoteButtonEnabled: true, isVisible: false});
    }

    downvoteSong() {
        console.log("upvoteButton", this.state.upvoteButtonEnabled);
        if (!this.state.upvoteButtonEnabled) {
            this.ref.doc(this.state.playlist.id).collection('queuedSongs').doc(this.state.songPressed.id).update({downvotes: firebase.firestore.FieldValue.arrayUnion(this.state.currentUser.uid), score: this.state.songPressed.score - 2, upvotes: firebase.firestore.FieldValue.arrayRemove(this.state.currentUser.uid)});
        }
        else {
            this.ref.doc(this.state.playlist.id).collection('queuedSongs').doc(this.state.songPressed.id).update({downvotes: firebase.firestore.FieldValue.arrayUnion(this.state.currentUser.uid), score: this.state.songPressed.score - 1});
        }
        this.setState({downvoteButtonEnabled: false, upvoteButtonEnabled: true, isVisible: false});
    }

    savePlaylist() {
        let self = this;
        firebase.firestore().collection("users").doc(this.state.currentUser.uid).collection("savedPlaylists").doc(this.state.playlist.id ).set(
            { id: this.state.playlist.id, name: this.state.playlist.name, adminID: this.state.playlist.adminID, isPrivate: this.state.playlist.isPrivate, genre: this.state.playlist.genre, adminName: this.state.playlist.adminName }).then(function() {
            console.log("Document successfully added!");
            self.setState({playlistSaved: true});
        }).catch(function(error) {
            console.error("Error adding document: ", error);
        });
    }

    unsavePlaylist() {
        let self = this;
        firebase.firestore().collection("users").doc(this.state.currentUser.uid).collection("savedPlaylists").doc(this.state.playlist.id ).delete().then(function() {
            console.log("Document successfully deleted!");
            self.setState({playlistSaved: false});
        }).catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }
    /*
    deletePlaylist() {
        let self = this;
        firebase.firestore().collection("playlists").doc(this.state.playlist.id).delete().then(function() {
            console.log("Document successfully deleted!");
            self.props.navigation.goBack();
        }).catch(function(error) {
            console.error("Error deleting document: ", error);
        });
    }
    */

    playPlaylist(){

    }

    stopPlaylist(){

    }

    configureOverlay = (song) => {
        if (song.upvotes.includes(this.state.currentUser.uid)){
            this.setState({upvoteButtonEnabled: false});
        }
        else if (song.downvotes.includes(this.state.currentUser.uid)){
            this.setState({downvoteButtonEnabled: false});
        }
        this.setState({isVisible: true, songPressed: song});
        console.log("current state", this.state);
    };

    onChangePasswordAttemptInput = text => {
        this.setState({
            passwordAttempt: text
        });
    };


    renderIcon = (type) => {
        if (type == 'upvote'){
            if (this.state.upvoteButtonEnabled){
                return (
                    <Icon
                        name="thumbs-up"
                        size={50}
                        color="white"
                    />
                )
            }
            return (
                <Icon
                    name="thumbs-up"
                    size={50}
                    color="grey"
                />
            )
        }
        if (this.state.downvoteButtonEnabled){
            return (
                <Icon
                    name="thumbs-down"
                    size={50}
                    color="white"
                />
            )
        }
        return (
            <Icon
                name="thumbs-down"
                size={50}
                color="grey"
            />
        )

    };

    renderRightIcon = (item) => {
        if (item.downvotes.includes(this.state.currentUser.uid)){
            return (
                <Icon
                    name="thumbs-down"
                    size={25}
                    color="#53687E"
                />
            )
        }
        if (item.upvotes.includes(this.state.currentUser.uid)){
            return (
                <Icon
                    name="thumbs-up"
                    size={25}
                    color="#53687E"
                />
            )
        }
        return null
    };

    renderMenu() {
        console.log("State is: ", this.state);
        if (this.state.type == 'admin'){
            return (
                <Menu renderer={ContextMenu} style={{ zIndex: 10, margin: 5  }}>
                    <MenuTrigger text="More Options"/>
                    <MenuOptions style={{ flex: 1 }}>
                        <MenuOption text="View Playlist Info" onSelect={() => this.props.navigation.navigate('PlaylistInfo', {playlist: this.state.playlist, currentUser: this.state.currentUser})} />
                        <MenuOption text="Delete Playlist" onSelect={() => this.deletePlaylist()} />
                        <MenuOption text="Play Playlist" onSelect={() => this.playPlaylist()} />
                        <MenuOption text="Stop Playlist" onSelect={() => this.stopPlaylist()} />
                    </MenuOptions>
                </Menu>
            )
        }
        else if (this.state.playlistSaved){
            return (
                <Menu renderer={ContextMenu} style={{ zIndex: 10, margin: 5 }}>
                    <MenuTrigger text="More Options"/>
                    <MenuOptions style={{ flex: 1 }}>
                        <MenuOption text="View Playlist Info" onSelect={() => this.props.navigation.navigate('PlaylistInfo', {playlist: this.state.playlist, currentUser: this.state.currentUser})} />
                        <MenuOption text="Un-Save Playlist" onSelect={() => this.unsavePlaylist()} />
                    </MenuOptions>
                </Menu>
            )
        }
        return (
            <Menu renderer={ContextMenu} style={{ zIndex: 10, fontSize: 20 }}>
                <MenuTrigger text="More Options"/>
                <MenuOptions style={{ flex: 1 }}>
                    <MenuOption text="View Playlist Info" onSelect={() => this.props.navigation.navigate('PlaylistInfo', {playlist: this.state.playlist, currentUser: this.state.currentUser})} />
                    <MenuOption text="Save Playlist" onSelect={() => this.savePlaylist()} />
                </MenuOptions>
            </Menu>
        )
    }

    onChangePasswordAttempt = text => {
        this.setState({
            passwordAttempt: text
        });
    };

    onSubmit = () => {
        const {currentUser} = firebase.auth();
        let playlistID = this.props.navigation.state.params.playlistID;
        if(this.state.passwordAttempt === this.state.playlistPassword)
        {
            this.addUserToPlaylist(playlistID, currentUser.uid);
        }
    };

    render () {
        console.log("Render isPrivate: " + this.state.isPrivate);
        const passwordInput = this.state.isPrivate
            ? <Input
                placeholder="Password"
                onChange={this.onChangePasswordAttempt.bind(this)}
                value={this.state.passwordAttempt}
            />
            : null;
        if (this.state.loading){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <Text>Loading</Text>
                    <ActivityIndicator size="large" />
                </SafeAreaView>
            )
        }
        else if (!this.state.userJoined && this.state.type != 'admin' && this.state.isPrivate){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <Button
                        title="View Playlist Info"
                        onPress={() => this.props.navigation.navigate('PlaylistInfo', {playlist: this.state.playlist, currentUser: this.state.currentUser})}
                    />
                    {passwordInput}
                </SafeAreaView>
            )
        }
        return (

            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <LinearGradient start={{x: 0, y:0}} end={{x: 0, y:1}} colors={['#53687E', '#F7F7F7']} style={styles.topView}>
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{color: '#F7F7F2', fontSize: 35, fontWeight: 'bold', fontFamily:'coolvetica', marginTop: 5, marginRight: 5, marginLeft: 5}}>
                        {this.state.playlist.name}
                    </Text>
                        <View style={{margin:5, width: "60%", height:'95%', borderRadius: 7, flex: 1, alignItems: 'center'}}>
                            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                <Avatar
                                    rounded
                                    containerStyle={{margin: 5}}
                                    titleStyle={{color: '#53687E'}}
                                    size='small'
                                    title={this.state.admin.firstName.charAt(0) + this.state.admin.lastName.charAt(1)}
                                    source={{uri: this.state.admin.profilePic}}
                                />
                                <Text style={{color: '#303338', fontSize: 16}}>
                                    {this.state.admin.firstName + ' ' + this.state.admin.lastName + '\'s Playlist'}
                                </Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                <Avatar
                                    rounded
                                    containerStyle={{margin: 5}}
                                    titleStyle={{color: '#53687E'}}
                                    avatarStyle={{backgroundColor: '#F7F7F7'}}
                                    size='small'
                                    title={this.state.playlist.genre[0]}
                                    source={{uri: genreDict[this.state.playlist.genre]}}
                                />
                                <Text style={{color: '#303338', fontSize: 16}}>
                                    {this.state.playlist.genre}
                                </Text>
                            </View>
                        </View>
                        {this.renderMenu()}
                </LinearGradient>
                <View style={{bottom: 0, top: 0}}>
                    <View style={{height:Dimensions.get('window').height * 0.25, marginRight: 10, marginLeft: 10, bottom: 0, marginBottom: 10}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Queue</Text>
                        <FlatList
                            data={this.state.queuedSongs}
                            renderItem={({ item }) => (
                                <ListItem
                                    containerStyle={styles.listItemContainer}
                                    title={item.name}
                                    bottomDivider={true}
                                    leftAvatar={{ rounded:false, source: { uri: item.album.images[0].url } }}
                                    subtitle={item.artists[0].name}
                                    rightIcon={this.renderRightIcon(item)}
                                    onLongPress={() => this.configureOverlay(item)}
                                />
                            )}
                            keyExtractor={item => item['id']}
                            ListEmptyComponent={() => (
                                <Text style={{textAlign: 'center', margin: 30}}>No songs in queue</Text>
                            )}
                        />
                    </View>
                    <View style={{top: 0, height: Dimensions.get('window').height * 0.25, margin: 10, right: 0, left: 0}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Songs Played</Text>
                        <FlatList style={{bottom: 0, top: 0}}
                            data={this.state.dequeuedSongs}
                            renderItem={({ item }) => (
                                <ListItem
                                    containerStyle={styles.listItemContainer}
                                    title={item.name}
                                    bottomDivider={true}
                                    leftAvatar={{ rounded:false, source: { uri: item.album.images[0].url } }}
                                    subtitle={item.artists[0].name}
                                    rightIcon={this.renderRightIcon(item)}
                                />
                            )}
                            keyExtractor={item => item['id']}
                            ListEmptyComponent={() => (
                                <Text style={{textAlign: 'center', margin: 30}}>No songs have been played</Text>
                            )}
                        />
                    </View>
                </View>
                <Overlay
                    isVisible={this.state.isVisible}
                    windowBackgroundColor="rgba(255, 255, 255, .5)"
                    overlayBackgroundColor="#53687E"
                    onBackdropPress={() => this.setState({isVisible: false, songPressed: null, downvoteButtonEnabled: true, upvoteButtonEnabled: true})}
                    width="auto"
                    height={90}
                >
                    <View style={{flex: 1, flexDirection: 'row'}}>
                        <Button
                            type="clear"
                            icon={this.renderIcon('upvote')}
                            iconRight
                            disabled={!this.state.upvoteButtonEnabled}
                            disabledStyle={{opacity: 50}}
                            title=""
                            onPress={() => this.upvoteSong()}
                        />
                        <Button
                            type="clear"
                            icon={this.renderIcon('downvote')}
                            iconRight
                            disabled={!this.state.downvoteButtonEnabled}
                            disabledStyle={{opacity: 50}}
                            title=""
                            onPress={() => this.downvoteSong()}
                        />
                    </View>
                </Overlay>
{/*                <Overlay
                    isVisible={this.state.privateIsVisible}
                    windowBackgroundColor="rgba(255, 255, 255, .5)"
                    overlayBackgroundColor="red"
                    onBackdropPress={() => this.setState({privateIsVisible: false})}
                    width="auto"
                    height={70}
                >
                    <View style={{flex: 1, flexDirection: 'row'}}>
                        <Input
                            placeholder="Password"
                            onChange={this.onChangePasswordAttempt.bind(this)}
                            value={this.state.passwordAttempt}
                        />
                        <Button
                            title="Submit"
                            onPress={this.onSubmit.bind(this)}
                        />
                    </View>
                </Overlay>*/}

            </SafeAreaView>
        )
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //margin: 20,
        backgroundColor: '#F7F7F2',
        //justifyContent: 'center',
        //alignItems: 'center'
    },
    listItemContainer: {
        margin: 3,
        backgroundColor: '#F7F7F2',
        borderRadius: 5
    },
    topView: {
        //flex: 1,
        alignItems: 'center',
        height: "30%",
        margin: 0,
        borderRadius: 0,
        borderColor: '#53687E',
        //borderWidth: 1
    },
});
