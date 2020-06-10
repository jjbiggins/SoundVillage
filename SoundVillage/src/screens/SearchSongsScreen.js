import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, SafeAreaView, Platform} from 'react-native';
import {ListItem, SearchBar} from 'react-native-elements';
import SearchBar2 from 'react-native-search-bar';
import Spotify from "rn-spotify-sdk";
import Icon from "react-native-vector-icons/FontAwesome";
import firebase from'react-native-firebase';

//
// Description: Shows the detailed information about a playlist (Name, Admin, Users that joined, isPrivate, if private the code, the songs added
//
// Navigation Options: PlaylistDetails (Back)
//                      SearchDetails
//


export default class SearchSongsScreen extends React.Component {
    searchSong: SearchBar2;

    constructor(props) {
        super(props);
        this.ref = firebase.firestore().collection('playlists');
        this.state = {
            value: {
                search: '',
                error: '',
                loading: false,
                data: [],
                playlistID: "",
                queuedSongs: [],
                dequeuedSongs: [],
                currentPlaylistPlaying: null,
                spotifyPlayer: null
            }
        }
    }

    static navigationOptions = ({ navigation, navigationOptions }) => {
        const { params } = navigation.state;

        return {

            title: 'Search Songs',
            /* These values are used instead of the shared configuration! */
            headerStyle: {
                backgroundColor: '#303338',
            },
            headerTintColor: '#F7F7F2',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        };
    };

    componentDidMount() {
        this.setState({playlistID: this.props.navigation.state.params.playlistID, queuedSongs: this.props.navigation.state.params.queuedSongs, dequeuedSongs: this.props.navigation.state.params.dequeuedSongs}, ()=> {
            console.log('The playlist is', this.props.navigation.state.params);
        });
    }


    searchFilterFunction = text => {
        this.setState({
            search: text,
        });

        if (text != ''){
            Spotify.search(text, ['track']).then((response) => {
                console.log('Text: ', text);
                console.log('Query', response['tracks']['items']);
                this.setState({
                    data: response['tracks']['items']
                });
            });
        }
        else {
            this.setState({
                data: []
            });
        }
    };

    renderHeader = () => {
        if (Platform.OS == 'ios'){
            return (
                <SearchBar2
                    placeholder="Search Music"
                    ref={ref => (this.searchSong = ref)}
                    barTintColor='#53687E'
                    tintColor='#303338'
                    onSearchButtonPress={text => this.searchFilterFunction(text)}
                />
            );
        }
        return (
            <SearchBar
                placeholder="Search Music"
                onChangeText={text => this.searchFilterFunction(text)}
                value={this.state.value.search}
            />
        );
    };

    addSongToPlaylist = item => {
        if (!this.state.queuedSongs.map(a=>a.id).includes(item.id) && !this.state.dequeuedSongs.map(a=>a.id).includes(item.id)){
            this.ref.doc(this.state.playlistID).collection('queuedSongs').doc(item.id).set(
                {songID: item.id, played: false, upvotes: [], downvotes: [], score: 0, timeAdded: firebase.firestore.FieldValue.serverTimestamp()}
            );
        }
        else {
            Alert.alert("Song Repeat", item.name + " has already been added to the playlist", [
                    {text: 'OK', onPress: () => console.log('OK Pressed')},
                ],
                {cancelable: false},);
        }
    };

    render () {
        if (this.state.loading) {
            return (
                <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                    <ActivityIndicator />
                </SafeAreaView>
            );
        }
        return (
            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <FlatList
                    data={this.state.data}
                    renderItem={({ item }) => (
                        <ListItem
                            title={item.name}
                            leftAvatar={{ rounded: false, source: { uri: item.album.images[0].url } }}
                            subtitle={item.artists[0].name}
                            rightIcon={<Icon name={'plus'} size={25} onPress={() => Alert.alert(
                                'Queue song in playlist?',
                                'This song will be queued up in the current playlist if added',
                                [
                                    {
                                        text: 'Cancel',
                                        onPress: () => console.log('Cancel Pressed'),
                                        style: 'cancel',
                                    },
                                    {text: 'Add', onPress: () => this.addSongToPlaylist(item)},
                                ],
                                {cancelable: true},
                            )}/>}

                        />
                    )}
                    keyExtractor={item => item.id}
                    //ItemSeparatorComponent={this.renderSeparator}
                    ListHeaderComponent={this.renderHeader}
                />
            </SafeAreaView>
        );
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //justifyContent: 'center',
        //alignItems: 'center'
    }
});