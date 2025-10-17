import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginTela({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [alert, setAlert] = useState({ visible: false, message: '', type: '' });

  const showAlert = (message, type = 'error') => {
    setAlert({ visible: true, message, type });
    setTimeout(() => {
      setAlert({ visible: false, message: '', type: '' });
    }, 3000);
  };

  const handleLogin = async () => {
    if (email.trim() && senha.trim()) {
      try {
        const response = await fetch('http://10.111.9.99:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, senha }),
        });

        if (!response.ok) {
          showAlert('Email ou senha inválidos!');
          return;
        }

        const data = await response.json();

        await AsyncStorage.setItem('userId', data.user.id.toString());
        await AsyncStorage.setItem('isLoggedIn', 'true');

        showAlert(data.message, 'success');

        setTimeout(() => {
          navigation.replace('Home');
        }, 1000);

      } catch (error) {
        showAlert(error.message);
        console.error(error);
      }
    } else {
      showAlert('Preencha todos os campos!');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/login-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#A259FF" />
      </TouchableOpacity>

      {alert.visible && (
        <View style={[
          styles.alertContainer,
          alert.type === 'success' ? styles.alertSuccess : styles.alertError
        ]}>
          <Ionicons
            name={alert.type === 'success' ? "checkmark-circle" : "warning"}
            size={24}
            color="#fff"
            style={styles.alertIcon}
          />
          <Text style={styles.alertText}>{alert.message}</Text>
        </View>
      )}

      <View style={styles.container}>
        <Text style={styles.logoText}>
          <Text style={styles.logoX}>✖</Text> GAME
          <Text style={styles.logoHighlight}> FINDER</Text>
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#fff" style={styles.icon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.icon} />
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#ccc"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>ENTRAR</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
          <Text style={styles.linkText}>
            Ainda não tem uma conta? <Text style={styles.linkHighlight}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 GameFinder Studios</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 0, 39, 0.7)',
  },

  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },

  alertContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
  },

  alertSuccess: {
    backgroundColor: '#4CAF50',
  },

  alertError: {
    backgroundColor: '#F44336',
  },

  alertIcon: {
    marginRight: 10,
  },

  alertText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },

  container: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },

  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 50,
    textAlign: 'center',
  },

  logoX: {
    fontSize: 40,
    color: '#A259FF',
  },

  logoHighlight: {
    color: '#fff',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginVertical: 10,
    width: '100%',
    opacity: 0.94,
  },

  icon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },

  button: {
    backgroundColor: '#A259FF',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },

  linkText: {
    color: '#ccc',
    marginTop: 15,
    textAlign: 'center',
  },

  linkHighlight: {
    color: '#A259FF',
    fontWeight: 'bold',
  },

  footerText: {
    color: '#fff',
    fontSize: 15,
    opacity: 0.8,
    fontWeight: 'bold',
  },

  footer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },
});