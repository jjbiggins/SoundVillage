import { Text, Button, StyleSheet, View, ActivityIndicator, SafeAreaView, Image, Dimensions, Animated, Keyboard, TextInput, UIManager } from 'react-native';
import React from "react";
import Input from '../components/Input';
import firebase from 'react-native-firebase';
import LinearGradient from 'react-native-linear-gradient';

//
// Description: Allows a user to sign in to SoundVillage
//
// Navigation Options: SignUp
//                      MainFeed
//

const { State: TextInputState } = TextInput;

class LoginScreen extends React.Component {
    constructor(props){
        super(props);
        this.state = {
                shift: new Animated.Value(0),
                email: '',
                password: '',
                error: '',
                loading: false
        }
    }

    static navigationOptions = ({ navigation, navigationOptions }) => {
        const { params } = navigation.state;

        return {

            title: 'Login',
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

    onSignInPress()  {
        if (this.state.email != '' && this.state.password != '') {
            this.setState({ error: '', loading: true });
            const { email, password } = this.state;
            console.log('The email is: ', email, password);
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(() => { this.setState({ error: '', loading: false }); this.props.navigation.navigate('MainFeed', {currentPlaylistPlaying: null}); })
                .catch((error) => { this.setState({ error: error.message, loading: false })});
        }
        else {
            this.setState({error: '** Incomplete fields', loading: false});
        }
    }
    renderButtonOrLoading() {
        if (this.state.loading) {
            return <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}><ActivityIndicator /></SafeAreaView>
        }
        return <Button onPress={this.onSignInPress.bind(this)} title="Log in" color={'#BEE5BF'} />;
    }


    onSignUp = () => {
        this.props.navigation.navigate('SignUp');
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
            console.log("Shift: ", this.state.shift);
            console.log("Height: ", keyboardHeight);
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

    render() {
        return (
            <SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
                <Animated.View style={{ transform: [{translateY: this.state.shift}]}}>
                    <View style={{marginTop: 30, marginRight: 30, marginLeft: 30, marginBottom: 10}}>
                        <Image source={{uri: 'https://i.postimg.cc/c1hTSfW9/399e1b41-65aa-4a54-bfa4-81ab37691e09.png'}} style={{height: Dimensions.get('window').width * 0.55, width: Dimensions.get('window').width * 0.7}}
                        >
                        </Image>
                            <Text style={{textAlign: 'center', marginTop: 10, fontSize: 30, fontFamily: 'coolvetica', color: '#F7F7F2'}}>SoundVillage</Text>
                    </View>
                    <Input
                        placeholder="Email"
                        onChange={this.onChangeEmail.bind(this)}
                        value={this.state.email}
                    />
                    <Input
                        placeholder="Password"
                        secureTextEntry
                        onChange={this.onChangePassword.bind(this)}
                        value={this.state.password}
                    />
                    <Text>{this.state.error}</Text>
                    {this.renderButtonOrLoading()}
                    <Button
                        title="Sign Up"
                        onPress={this.onSignUp.bind(this)}
                        color={'#BEE5BF'}
                    />
                </Animated.View>
            </SafeAreaView>
        );
    };
}

export default (LoginScreen);

const styles = StyleSheet.create({
    container: {
        //justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
        padding: 20,
        backgroundColor: '#303338',
        flex: 1
    },
    linearGradient: {
        paddingLeft: 15,
        paddingRight: 15,
        paddingBottom: 5,
        borderRadius: 5
    },
});