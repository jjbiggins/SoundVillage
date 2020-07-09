import React from 'react';
import {View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity, SafeAreaView, ScrollView} from 'react-native';
import {Avatar, Button, ListItem} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import firebase from "react-native-firebase";
import Spotify from "rn-spotify-sdk";
import LinearGradient from "react-native-linear-gradient";

//
// Description: Shows the detailed information about a playlist (Name, Admin, Users that joined, isPrivate, if private the code, the songs added
//
// Navigation Options: MainFeed (Back)
//                      EditPlaylist (If Admin who created is viewing)
//                      PlaylistUsers
//                      SongSearch
//

const genreDict = {'Rock': 'https://i.postimg.cc/7ZxtS7Bk/icons8-rock-music-64.png', 'Pop': 'https://i.postimg.cc/wB4rqvQd/icons8-ice-pop-pink-64.png', 'Hip Hop/Rap': 'https://i.postimg.cc/8cMXmbQ1/icons8-hip-hop-music-96.png',
    'Throwback': 'https://i.postimg.cc/L8T7Wvq5/icons8-boombox-96.png', 'Party Time': 'https://i.postimg.cc/XY3mxtYt/icons8-champagne-64.png', 'Night In': 'https://i.postimg.cc/fTQrT1mk/icons8-night-64.png',
    'Random': 'https://i.postimg.cc/PxBFDR73/icons8-musical-notes-64.png', 'Workout': 'https://i.postimg.cc/sfhLz3Bt/icons8-muscle-64.png', 'Happy': 'https://i.postimg.cc/c475KTBh/icons8-party-64.png',
    'Sad': 'https://i.postimg.cc/sXBNvrTG/icons8-crying-80.pngs', 'Alternative': 'https://i.postimg.cc/L8T7Wvq5/icons8-boombox-96.png', 'Country': 'https://i.postimg.cc/zfGMYWWj/icons8-country-music-96.png'};



export default class PlaylistInfoScreen extends React.Component {
    constructor(props) {
        super(props);
        this.ref = firebase.firestore().collection('users');
        this.unsubscribe = null;
        this.state = {
            playlist: null,
            name: '',
            description: '',
            genre: '',
            users: [],
            currentUser: null,
            loading: true,
            currentPlaylistPlaying: null,
            spotifyPlayer: null,
            admin: null
        }
    }

    static navigationOptions = ({ navigation, navigationOptions }) => {
        const { params } = navigation.state;

        return {

            title: params ? params.playlist.name : 'Playlist Details',
            /* These values are used instead of the shared configuration! */
            headerStyle: {
                backgroundColor: '#303338',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        };
    };

    onCollectionUpdate = (querySnapshot) => {
        let users = [];
        querySnapshot.forEach((doc) => {
            console.log('This is: ', doc.data());
            const { id, firstName, lastName, downloadUrl } = doc.data();
            let user = {
                uid: id,
                firstName,
                lastName,
                profilePic: downloadUrl
            };
            console.log("Successful download", user);
            users.push(user);
        });
        this.setState({users: users});
    };

    componentDidMount() {
        let playlistData = this.props.navigation.state.params.playlist;
        this.unsubscribe = firebase.firestore().collection('playlists').doc(playlistData.id).collection('usersJoined').onSnapshot(this.onCollectionUpdate);
        let currentUser = this.props.navigation.state.params.currentUser;
        this.setState({playlist: this.props.navigation.state.params.playlist, name: playlistData.name, currentUser: currentUser});
        this.setState({description: playlistData.description, genre: playlistData.genre, loading: true});
        this.ref.doc(playlistData.adminID).get().then((doc) => {
            let user = {
                uid: playlistData.adminID,
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
                profilePic: doc.data().downloadUrl
            };
            this.setState({admin: user, loading: false});
        });
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    renderItemList = (item) => {
        if (item.profilePic){
            return (
                <ListItem
                    bottomDivider={true}
                    title={item.firstName + ' ' + item.lastName}
                    leftAvatar={{ source: { uri: item.profilePic }, title: '' + item.firstName.charAt(0) + item.lastName.charAt(0) }}
                    containerStyle={styles.listItemContainer}
                />
            )
        }
        return (
            <ListItem
                bottomDivider={true}
                title={item.firstName + ' ' + item.lastName}
                leftAvatar={{ title: '' + item.firstName.charAt(0) + item.lastName.charAt(0) }}
                containerStyle={styles.listItemContainer}
            />
        )
    };

    renderAvatar() {
        if (this.state.admin.profilePic){
            return (
                <Avatar
                    rounded
                    containerStyle={{margin: 3}}
                    titleStyle={{color: '#53687E'}}
                    size='medium'
                    title={this.state.admin.firstName.charAt(0) + this.state.admin.lastName.charAt(0)}
                    source={{uri: this.state.admin.profilePic}}
                />
            )
        }
        return (
            <Avatar
                rounded
                containerStyle={{margin: 3}}
                titleStyle={{color: '#53687E'}}
                size='medium'
                title={this.state.admin.firstName.charAt(0) + this.state.admin.lastName.charAt(0)}
            />
        )
    }

    renderDescription() {
        if (this.state.description){
            return (
                <ScrollView style={{margin:20}}>
                    <Text adjustsFontSizeToFit={true} numberOfLines={15} style={styles.text}>
                        {this.state.description}
                    </Text>
                </ScrollView>
            )
        }
        return null;
    }

    render () {
        if (this.state.loading){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <ActivityIndicator size="large" />
                </SafeAreaView>
            )
        }
        return (

            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <LinearGradient start={{x: 0, y:0}} end={{x: 0, y:1}} colors={['#53687E', '#F7F7F2']} style={styles.topView1}>
                    <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', margin: 10}}>
                        {this.renderAvatar()}
                        <Text style={{color: '#F7F7F2', fontSize: 20, fontFamily: 'coolvetica'}}>
                            {this.state.admin.firstName + ' ' + this.state.admin.lastName + '\'s Playlist'}
                        </Text>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
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
                    {this.renderDescription()}
                </LinearGradient>
                <View style={{margin: 15}}>
                    <Text style={{fontSize: 25, fontWeight: 'bold', fontFamily: 'coolvetica', color: '#303338'}}>
                        Users Joined
                    </Text>
                    <FlatList
                        data={this.state.users}
                        renderItem={({ item }) => (this.renderItemList(item))}
                        keyExtractor={item => item['uid']}
                    />
                </View>
            </SafeAreaView>
        )
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F2'
    },
    text: {
        alignItems: 'center',
        fontSize: 16,
        justifyContent: 'center',
        color: '#303338'
    },
    topView: {
        alignItems: 'center',
        height: "40%",
        margin: 0,
        borderRadius: 0,
        borderColor: '#53687E',
    },
    topView1: {
        alignItems: 'center',
        height: "42%",
        margin: 0,
        borderRadius: 0,
        borderColor: '#53687E',
    },
    listItemContainer: {
        margin: 3,
        backgroundColor: '#F7F7F2',
        borderRadius: 5,
    },
});