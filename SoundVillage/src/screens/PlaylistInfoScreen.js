import React from 'react';
import {View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity, SafeAreaView} from 'react-native';
import {Button, ListItem} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import firebase from "react-native-firebase";
import Spotify from "rn-spotify-sdk";

//
// Description: Shows the detailed information about a playlist (Name, Admin, Users that joined, isPrivate, if private the code, the songs added
//
// Navigation Options: MainFeed (Back)
//                      EditPlaylist (If Admin who created is viewing)
//                      PlaylistUsers
//                      SongSearch
//


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
        console.log("Data", playlistData);
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

    render () {
        if (this.state.loading){
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <Text>Loading</Text>
                    <ActivityIndicator size="large" />
                </SafeAreaView>
            )
        }
        return (

            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <Text style={styles.text}>
                    Playlist Admin:
                </Text>
                <ListItem
                    title={this.state.admin.firstName + ' ' + this.state.admin.lastName}
                    leftAvatar={{ source: { uri: this.state.admin.profilePic }, title: '' + this.state.admin.firstName.charAt(0) + this.state.admin.lastName.charAt(0)}}
                    //subtitle={item.artists[0].name}
                />
                <Text style={styles.text}>
                    {"Genre: " + this.state.genre}
                </Text>
                <Text style={styles.text}>
                    {"Description: " + this.state.description}
                </Text>
                <Text style={styles.text}>
                    Users Joined:
                </Text>
                <FlatList
                    data={this.state.users}
                    renderItem={({ item }) => (
                        <ListItem
                            title={item.firstName + ' ' + item.lastName}
                            leftAvatar={{ source: { uri: item.profilePic }, title: '' + item.firstName.charAt(0) + item.lastName.charAt(0) }}
                            //subtitle={item.artists[0].name}
                        />
                    )}
                    keyExtractor={item => item['uid']}
                    //ItemSeparatorComponent={this.renderSeparator}
                />
            </SafeAreaView>
        )
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //justifyContent: 'center',
        //alignItems: 'center',
        padding: 10,
        margin: 20
    },
    text: {
        alignItems: 'center',
        fontSize: 16,
        justifyContent: 'center'
    }
});