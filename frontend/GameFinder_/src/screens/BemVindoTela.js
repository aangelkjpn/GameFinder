import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function BemVindoTela({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [alert, setAlert] = useState({ visible: false, message: '', type: '' });

  const showAlert = (message, type = 'error') => {
    setAlert({ visible: true, message, type });
    setTimeout(() => {
      setAlert({ visible: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const logado = await AsyncStorage.getItem('isLoggedIn');

      if (userId && logado === 'true') {
        navigation.replace('Home');
      } else {
        setCheckingAuth(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setCheckingAuth(false);
    }
  };

  const handleAnimationFinish = () => {
    setIsLoading(false);
  };

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <LottieView
          source={require('../../assets/Flow_1.json')}
          autoPlay
          loop={true}
          style={styles.lottieAnimation}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LottieView
          source={require('../../assets/Flow_1.json')}
          autoPlay
          loop={false}
          onAnimationFinish={handleAnimationFinish}
          style={styles.lottieAnimation}
        />
      ) : (
        <ImageBackground
          source={require('../../assets/login-bg.png')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />

          {/* Alert Personalizado */}
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

          <View style={styles.contentContainer}>
            <Image
              source={require('../../assets/logo_GF.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>ENTRAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={() => navigation.navigate('Registro')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>CADASTRAR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 GameFinder Studios</Text>
          </View>
        </ImageBackground>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#130027',
  },

  lottieAnimation: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },

  background: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 0, 39, 0.7)',
  },

  // Estilos do Alert Personalizado
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

  contentContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },

  logoImage: {
    width: 370,
    height: 330,
    marginBottom: 0,
  },

  button: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 30,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  loginButton: {
    backgroundColor: '#A259FF',
  },

  registerButton: {
    backgroundColor: '#A259FF',
  },

  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  footer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },

  footerText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    fontWeight: 'bold'
  },
});