import {TextInput, View, TouchableHighlight, StyleSheet, Image, Text, Dimensions} from 'react-native';
import React from "react";

const MiniSpotifyPlayer = props => (
    <View style={{flex: 1, flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#303338'}}>
        <Image
            style={{width: 70, height: 70, margin:10}}
            source={{uri: props.spotifyCoverArt}}
        />
        <View style={{margin:10}}>
            <Text style ={styles.text}>
                {props.spotifySongName}
            </Text>
            <Text style = {styles.text}>
                {props.spotifyAlbumName}
            </Text>
            <Text style = {styles.text}>
                {props.spotifyArtistName}
            </Text>
        </View>
    </View>
);

export default MiniSpotifyPlayer;

const styles = StyleSheet.create({
    text: {
        margin: 2,
        color: '#F7F7F2'
    }
});