import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Button,
    TextInput,
    Picker,
    SafeAreaView,
    ScrollView
} from "react-native";
import firebase from 'react-native-firebase';
import Input from '../components/Input';
import { CheckBox } from 'react-native-elements';

//
// Description: Checks to see if user is already logged in or not when opening the app
//
// Navigation Options: Login
//                      MainFeed
//

const genreDict = {'Rock': 'https://i.postimg.cc/7ZxtS7Bk/icons8-rock-music-64.png', 'Pop': 'https://i.postimg.cc/wB4rqvQd/icons8-ice-pop-pink-64.png', 'Hip Hop/Rap': 'https://i.postimg.cc/8cMXmbQ1/icons8-hip-hop-music-96.png',
    'Throwback': 'https://i.postimg.cc/L8T7Wvq5/icons8-boombox-96.png', 'Party Time': 'https://i.postimg.cc/XY3mxtYt/icons8-champagne-64.png', 'Night In': 'https://i.postimg.cc/fTQrT1mk/icons8-night-64.png',
    'Random': 'https://i.postimg.cc/PxBFDR73/icons8-musical-notes-64.png', 'Workout': 'https://i.postimg.cc/sfhLz3Bt/icons8-muscle-64.png', 'Happy': 'https://i.postimg.cc/c475KTBh/icons8-party-64.png',
    'Sad': 'https://i.postimg.cc/sXBNvrTG/icons8-crying-80.pngs', 'Alternative': 'https://i.postimg.cc/L8T7Wvq5/icons8-boombox-96.png', 'Country': 'https://i.postimg.cc/zfGMYWWj/icons8-country-music-96.png'};

export default class CreatePlaylistScreen extends React.Component {
    constructor(props){
        super(props);
        this.state = {
                playlistName: '',
                isPrivate: false,
                error: '',
                loading: false,
                checked: false,
                description: '',
                genre: '',
                location: null,
                latitude: null,
                longitude: null
        }
    }

    componentDidMount() {
        const {currentUser} = firebase.auth();
        firebase.firestore().collection("users").doc(currentUser.uid).get()
            .then((docSnapshot) => {
                if (docSnapshot.exists) {
                    this.setState({currentUser: docSnapshot.data()});
                }
            });
        this.findCoordinates();
    }

    static navigationOptions = ({ navigation, navigationOptions }) => {
        const { params } = navigation.state;

        return {

            title: 'Create New Playlist',
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

    onChangePlaylistName = text => {
        this.setState({
            playlistName: text
        });
    };

    onChangeDescription = text => {
        this.setState({
            description: text
        });
    };

    onChangeGenre= text => {
        this.setState({
            genre: text
        });
    };

    onChangePlaylistPassword = text => {
        this.setState({
            playlistPassword: text
        });
    };




    onCancel = () => {
        this.props.navigation.navigate('StreamingMain');
    };

    findCoordinates = () => {
        navigator.geolocation.getCurrentPosition(
            position => {
                this.setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            error => Alert.alert(error.message),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    };

    onCreatePlaylist()  {
        if (this.state.playlistName != '' && this.state.genre != '') {
            this.setState({ error: '', loading: true });
            firebase.firestore().collection('playlists').add({
                name: this.state.playlistName,
                isPrivate: this.state.checked,
                adminID: this.state.currentUser.uid,
                adminName: this.state.currentUser.firstName + ' ' + this.state.currentUser.lastName,
                description: this.state.description,
                genre: this.state.genre,
                playlistPassword: this.state.playlistPassword,
                usersJoinedAmount: 1,
                location: new firebase.firestore.GeoPoint(this.state.latitude,this.state.longitude)
            }).then((res) => {
                console.log("Res:", res);
                firebase.firestore().collection('playlists').doc(res._documentPath.id).update({
                    id: res._documentPath.id
                }).then(function() {
                    console.log("Document successfully updated!");
                }).catch(function(error) {
                    console.error("Error updating document: ", error);
                });
                firebase.firestore().collection('users').doc(this.state.currentUser.uid).collection('savedPlaylists').doc(res._documentPath.id).set(
                    { id: res._documentPath.id, name: this.state.playlistName, adminID: this.state.currentUser.uid, isPrivate: this.state.checked, genre: this.state.genre, adminName: this.state.currentUser.firstName + ' ' + this.state.currentUser.lastName }).then(function() {
                    console.log("Document successfully added!");
                }).catch(function(error) {
                    console.error("Error adding document: ", error);
                });
                firebase.firestore().collection('playlists').doc(res._documentPath.id).collection('usersJoined').doc(this.state.currentUser.uid).set({id: this.state.currentUser.uid, firstName: this.state.currentUser.firstName, lastName: this.state.currentUser.lastName, downloadUrl: this.state.currentUser.downloadUrl}).then(function() {
                    console.log("Document successfully added!");
                }).catch(function(error) {
                    console.error("Error adding document: ", error);
                });
            }).then(() => {
                this.props.navigation.navigate('StreamingMain');
            }).catch((error) => { this.setState({ error: error.message, loading: false });
             })
        }
        else {
            this.setState({error: '** Incomplete fields', loading: false});
        }
    }

    textHandler = (text) => {
        this.setState({description: text});
    };

    renderButtonOrLoading() {
        if (this.state.loading) {
            return <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}><ActivityIndicator /></SafeAreaView>
        }
        return <Button style={{margin:3}} onPress={this.onCreatePlaylist.bind(this)} title="Create Playlist" color={'#BEE5BF'}/>;
    }

    render() {
       const playlistInput = this.state.checked
        ? <Input
               placeholder="Password"
               onChange={this.onChangePlaylistPassword.bind(this)}
               value={this.state.playlistPassword}
           />
           : null;
        return (
            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <ScrollView styler={{borderWidth: 5, borderColor: 'gray'}}>
                    <View style={{marginTop: 30}}>
                        <Input
                            placeholder="Playlist Name"
                            onChange={this.onChangePlaylistName.bind(this)}
                            value={this.state.playlistName}
                        />
                    </View>
                    <Picker
                        selectedValue={this.state.genre}
                        style={styles.borderColor = 'gray'}
                        onValueChange={(itemValue, itemIndex) =>
                            this.setState({genre: itemValue})
                        }>
                        <Picker.Item label="Choose Genre" value="none"/>
                        <Picker.Item label="Rock"  value="Rock"/>
                        <Picker.Item label="Pop"  value="Pop"/>
                        <Picker.Item label="Hip Hop/Rap"  value="Hip Hop/Rap"/>
                        <Picker.Item label="Throwback"  value="Throwback"/>
                        <Picker.Item label="Party Time"  value="Party Time"/>
                        <Picker.Item label="Night In"  value="Night In"/>
                        <Picker.Item label="Random"  value="Random"/>
                        <Picker.Item label="Workout"  value="Workout"/>
                        <Picker.Item label="Happy"  value="Happy"/>
                        <Picker.Item label="Sad"  value="Sad"/>
                        <Picker.Item label="Alternative"  value="Alternative"/>
                        <Picker.Item label="Country"  value="Country"/>
                    </Picker>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="Description"
                        multiline={true}
                        onChangeText={(description) => this.setState({description})}
                        value={this.state.description}
                        maxLength={300}
                    />
                    <CheckBox
                        center
                        title="Private Playlist"
                        checked={this.state.checked}
                        checkedColor={'#BEE5BF'}
                        textStyle={{color: '#F7F7F2'}}
                        containerStyle={{backgroundColor: '#53687E'}}
                        onPress={() => this.setState({checked: !this.state.checked})}
                    />
                    {playlistInput}
                    <Text>{this.state.error}</Text>
                    {this.renderButtonOrLoading()}
                    <Button
                        style={{margin:3}}
                        color={'#BEE5BF'}
                        title="Cancel"
                        onPress={this.onCancel.bind(this)}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#53687E',
        flex: 1,
    },

    text: {
        fontSize: 25,
        textAlign: 'center'
    },

    descriptionInput: {
        padding: 5,
        width: 300,
        height: 150,
        borderColor: '#303338',
        backgroundColor: '#F7F7F2',
        textAlignVertical: 'top',
        borderWidth: 1,
        marginBottom: 7,
        borderRadius: 5
    },

    button: {
        backgroundColor: '#BEE5BF',
        color: '#F7F7F2'
    }
});