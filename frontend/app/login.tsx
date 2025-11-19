import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);

        setTimeout(() => {
            Alert.alert('Success', 'Login button works — no backend connected.');
            setIsLoading(false);
        }, 1000);
    };

    const handleRegisterPress = () => {
        Alert.alert('Navigation Placeholder', 'This would go to Register Screen.');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Pack Smart</Text>
                <Text style={styles.subtitle}>Your Outdoor Packing Assistant</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={handleRegisterPress}
                    >
                        <Text style={styles.linkText}>
                            Don't have an account? Sign up
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#2d5016',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 40,
    },
    form: {
        width: '100%',
    },
    input: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        backgroundColor: '#2d5016',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
        padding: 10,
    },
    linkText: {
        color: '#2d5016',
        textAlign: 'center',
        fontSize: 14,
    },
});