import { TextInput, StyleSheet } from 'react-native';
import React from "react";

const Input = props => (
    <TextInput
        name={props.name}
        style={[styles.input, props.style]}
        value={props.value}
        placeholder={props.placeholder}
        placeholderTextColor={'#303338'}
        onChangeText={props.onChange}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize}
        selectionColor={'#53687E'}
    />
);

export default Input;

const styles = StyleSheet.create({
    input: {
        width: 300,
        height: 50,
        borderRadius: 5,
        backgroundColor: '#F7F7F2',
        borderColor: '#303338',
        borderWidth: 1,
        margin: 9,
        padding: 5
    }
});