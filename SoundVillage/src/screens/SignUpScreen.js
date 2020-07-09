import {
    ScrollView,
    Text,
    Button,
    StyleSheet,
    View,
    ActivityIndicator,
    Image,
    PixelRatio,
    SafeAreaView,
    Keyboard,
    Animated,
    Dimensions, UIManager, TextInput, Platform
} from 'react-native';
import React from "react";
import Input from '../components/Input';
import firebase from 'react-native-firebase';
import ImagePicker from 'react-native-image-picker';

//
// Description: Allows a user to create a new account with name, email, password and profile picture
//
// Navigation Options: Login (On Cancel or Sign Up)
//

const { State: TextInputState } = TextInput;

export default class SignUpScreen extends React.Component {
    constructor(props){
        super(props);
        this.state = {
                shift: new Animated.Value(0),
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                profilePic: null,
                error: '',
                loading: false,
                uid: ''
        }
    }

    static navigationOptions = ({ navigation, navigationOptions }) => {
        const { params } = navigation.state;

        return {

            title: 'Sign Up',
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
        this.keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
        this.keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidHide);
    }

    onChangeEmail = text => {
        this.setState({
            email: text
         });
    };

    onChangePassword = text => {
        this.setState({
            password: text
        });
    };

    onChangeFirstName = text => {
        this.setState({
            firstName: text
        });
    };

    onChangeLastName = text => {
        this.setState({
            lastName: text
        });
    };

    handleKeyboardDidShow = (event) => {
        const { height: windowHeight } = Dimensions.get('window');
        const keyboardHeight = event.endCoordinates.height;
        const currentlyFocusedField = TextInputState.currentlyFocusedField();
        UIManager.measure(currentlyFocusedField, (originX, originY, width, height, pageX, pageY) => {
            const fieldHeight = height;
            const fieldTop = pageY;
            const gap = (windowHeight - keyboardHeight) - (fieldTop + fieldHeight);
            if (gap >= 0) {
                return;
            }
            Animated.timing(
                this.state.shift,
                {
                    toValue: gap,
                    duration: 1000,
                    useNativeDriver: true,
                }
            ).start();
        });
    };

    handleKeyboardDidHide = () => {
        Animated.timing(
            this.state.shift,
            {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }
        ).start();
    };


    onSignUpPress()  {
        let self = this;
        if (this.state.firstName != '' && this.state.lastName != '' && this.state.email != '' && this.state.password != ''){
            this.setState({ error: '', loading: true });
            const { email, password } = this.state;
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((res) => {
                    self.setState({uid: res.user._user.uid, error: '', loading: false});
                    const ref = firebase.firestore().collection('users').doc(res.user._user.uid);
                    ref.set({
                        email: self.state.email,
                        uid: res.user._user.uid,
                        firstName: self.state.firstName,
                        lastName: self.state.lastName,
                        downloadUrl: '',
                        currentPlaylistPlaying: ''
                    });
                }).then(() => {
                    if (self.state.profilePic) {
                        self.uploadImage();
                    }
                    else {
                        self.props.navigation.navigate('MainFeed');
                    }
                }).catch((error) => { self.setState({ error: error.message, loading: false });
                }).catch((error) => { self.setState({ error: error.message, loading: false })});
        }
        else {
            this.setState({error: '** Incomplete fields', loading: false});
        }
    }

    renderButtonOrLoading() {
        if (this.state.loading) {
            return <View><ActivityIndicator /></View>
        }
        if (Platform.OS == 'ios') {
            return <Button onPress={this.onSignUpPress.bind(this)} title="Sign Up" color={'#BEE5BF'}/>;
        }
        return <Button onPress={this.onSignUpPress.bind(this)} title="Sign Up" color={'#303338'} />;
    }

    onCancel = () => {
        this.props.navigation.navigate('Login');
    };

    selectPhoto() {
        const options = {
            title: 'Profile Picture',
            quality: 1.0,
            maxWidth: 500,
            maxHeight: 500,
            storageOptions: {
                skipBackup: true,
            },
        };

        ImagePicker.showImagePicker(options, (response) => {

            if (response.didCancel) {
                console.log('User cancelled photo picker');
            } else if (response.error) {
                this.setState({error: response.error});
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                console.log(response.uri);
                let source = {uri: response.uri};

                this.setState({
                    profilePic: source,
                });
            }
        });
    }

    uploadImage = () => {
        const {currentUser} = firebase.auth();
        let self = this;
        console.log("UPLOAD");
        firebase.storage().ref('profilePictures')
            .child(currentUser.uid)
            .put(self.state.profilePic.uri)
            .then(uploadedFile => {
                //success
                firebase.storage()
                    .ref('profilePictures')
                    .child(currentUser.uid)
                    .getDownloadURL()
                    .then(function(url) {
                        firebase.firestore().collection('users').doc(currentUser.uid).update({downloadUrl: url});
                    }).catch(function(error) {
                });

                self.props.navigation.navigate('MainFeed');
            }).catch((error) => {
            //Error
            this.setState({ error: error.message, loading: false });
        });
    };

    renderButtonOrPicture() {
        if (this.state.profilePic == null) {
            if (Platform.OS =='ios'){
                return <Button onPress={this.selectPhoto.bind(this)} title='Add Profile Picture' color={'#BEE5BF'} />;
            }
            return <Button onPress={this.selectPhoto.bind(this)} title='Add Profile Picture' color={'#303338'} />;
        }
        if (Platform.OS =='ios'){
            return (
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Image style={styles.profilePic} source={this.state.profilePic} />
                    <Button onPress={this.selectPhoto.bind(this)} title='Change Profile Picture' color={'#BEE5BF'} />
                </View>);
        }
        return (
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Image style={styles.profilePic} source={this.state.profilePic} />
                <Button onPress={this.selectPhoto.bind(this)} title='Change Profile Picture' color={'#303338'} />
            </View>);
    }

    renderCancelButton() {
        if (Platform.OS == 'ios'){
            return (
                <Button
                    color={'#BEE5BF'}
                    title="Cancel"
                    onPress={this.onCancel.bind(this)}
                />
            )
        }
        return (
            <View style={{margin:8}}>
                <Button
                    color={'#303338'}
                    title="Cancel"
                    onPress={this.onCancel.bind(this)}
                />
            </View>
        )
    }

    render() {
        return (
            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <ScrollView>
                    <View style={{margin: 30}}>
                        <Input
                            name="firstName"
                            placeholder="First Name"
                            onChange={this.onChangeFirstName.bind(this)}
                            value={this.state.firstName}
                            autoCapitalize="words"
                        />
                        <Input
                            name="lastName"
                            placeholder="Last Name"
                            onChange={this.onChangeLastName.bind(this)}
                            value={this.state.lastName}
                            autoCapitalize="words"
                        />
                        <Input
                            name="email"
                            placeholder="Email"
                            onChange={this.onChangeEmail.bind(this)}
                            value={this.state.email}
                            autoCapitalize="none"
                        />
                        <Input
                            name="password"
                            placeholder="Password"
                            secureTextEntry
                            onChange={this.onChangePassword.bind(this)}
                            value={this.state.password}
                        />
                    </View>
                    {this.renderButtonOrPicture()}
                    <View style={{alignItems: 'center', margin: 10}}>
                        <Text style={{color: '#F7F7F2', fontWeight: 'bold'}}>{this.state.error}</Text>
                    </View>
                    {this.renderButtonOrLoading()}
                    {this.renderCancelButton()}
                </ScrollView>
            </SafeAreaView>
        );
    };
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
        padding: 20,
        backgroundColor: '#303338',
        flex: 1
    },
    profilePicContainer: {
        borderColor: '#9B9B9B',
        borderWidth: 1 / PixelRatio.get(),
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePic: {
        borderRadius: 75,
        width: 150,
        height: 150,
        alignItems: 'center',
    },
    text: {
        color: 'black'
    }
});