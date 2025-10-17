import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RegistroTela({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [emailValido, setEmailValido] = useState(true);
  const [emailModificado, setEmailModificado] = useState(false);
  const [alert, setAlert] = useState({ visible: false, message: '', type: '' });

  const showAlert = (message, type = 'error') => {
    setAlert({ visible: true, message, type });
    setTimeout(() => {
      setAlert({ visible: false, message: '', type: '' });
    }, 3000);
  };

  const validarEmail = (email) => {
    const regex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;

    if (!regex.test(email)) {
      return false;
    }

    const partes = email.split('@');
    const dominio = partes[1].toLowerCase();
    const partesDominio = dominio.split('.');

    if (partesDominio.length < 2) return false;

    const nomeDominio = partesDominio[0];
    const extensao = partesDominio[partesDominio.length - 1];

    if (extensao.length < 2) return false;

    // Lista de provedores conhecidos (Whitelist)
    const provedoresConhecidos = [
      'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'aol.com',
      'uol.com.br', 'bol.com.br', 'terra.com.br', 'r7.com', 'ig.com.br', 'globo.com',
      'live.com', 'msn.com', 'me.com', 'mac.com', 'protonmail.com'
    ];

    if (provedoresConhecidos.includes(dominio)) {
      return true;
    }

    if (partesDominio.length >= 2) {
      const primeiroNivel = partesDominio[0];

      if (primeiroNivel.length < 5) {
        return false;
      }

      const letrasConsecutivas = /(.)\1{2,}/i;
      if (letrasConsecutivas.test(primeiroNivel)) {
        return false;
      }

      const vogaisEmExcesso = /[aeiou]{4,}/i;
      const consoantesEmExcesso = /[bcdfghjklmnpqrstvwxyz]{5,}/i;

      if (vogaisEmExcesso.test(primeiroNivel) || consoantesEmExcesso.test(primeiroNivel)) {
        return false;
      }

      return true;
    }

    return false;
  };

  const handleRegistro = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      showAlert('Preencha todos os campos!');
      return;
    }

    if (/^\d+$/.test(nome)) {
      showAlert('O nome de usuário não pode conter apenas números!');
      return;
    }

    if (!validarEmail(email)) {
      showAlert('Email inválido! Use um email com formato e domínio real e válido.\n\nExemplos válidos:\n• usuario@gmail.com\n• nome@empresa.com.br\n\nDomínios inventados (como abcdef.com ou teste@gahgfja.com) não são permitidos.');
      return;
    }

    if (senha.length < 6) {
      showAlert('A senha deve ter pelo menos 6 caracteres!');
      return;
    }

    try {
      const checkResponse = await fetch('http://10.111.9.99:3000/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const checkData = await checkResponse.json();

      if (checkData.exists) {
        showAlert('Este email já está cadastrado!');
        return;
      }

      const response = await fetch('http://10.111.9.99:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: nome, email, senha }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao registrar, tente novamente!');
      }

      const data = await response.json();
      showAlert(data.message, 'success');

      setTimeout(() => {
        navigation.replace('Home');
      }, 1000);

    } catch (error) {
      showAlert(error.message || 'Erro de conexão. Verifique sua internet e tente novamente.');
      console.error('Erro no registro:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground 
        source={require('../../assets/login-bg.png')} 
        style={styles.background} 
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#9B5CFF" />
          </TouchableOpacity>

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

          <View style={styles.formContainer}>
            <Text style={styles.logoText}> 
              <Text style={styles.logoX}>✖</Text> GAME
              <Text style={styles.logoHighlight}> FINDER</Text>
            </Text>

            <View style={styles.inputContainer}> 
              <Ionicons name="person-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                placeholder="Nome"
                placeholderTextColor="#ccc"
                value={nome}
                onChangeText={setNome}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>

            <View style={[ 
              styles.inputContainer,
              emailModificado && !emailValido && styles.inputContainerError
            ]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailModificado && !emailValido ? '#ff4757' : '#fff'}
                style={styles.icon}
              />
              <TextInput
                placeholder="Email - (exemplo@gmail.com)"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailModificado(true);
                  setEmailValido(validarEmail(text));
                }}
                onBlur={() => setEmailModificado(true)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            {emailModificado && !emailValido && (
              <Text style={styles.errorText}>
                ⚠ Email inválido! Use um domínio real e válido{'\n'}
                Ex: usuario@gmail.com | nome@empresa.com.br
              </Text>
            )}

            <View style={styles.inputContainer}> 
              <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                placeholder="Senha (mínimo 6 caracteres)"
                placeholderTextColor="#ccc"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegistro}> 
              <Text style={styles.buttonText}>REGISTRAR</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}> 
                Já tem uma conta? <Text style={styles.linkHighlight}>Entrar</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2025 GameFinder Studios</Text>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 0, 39, 0.7)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  alertContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
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
  formContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  logoX: {
    fontSize: 40,
    color: '#9B5CFF',
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
    paddingVertical: 12,
    marginVertical: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.94,
  },
  inputContainerError: {
    borderColor: '#ff4757',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 5,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    padding: 8,
    borderRadius: 10,
    width: '100%',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#9B5CFF',
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
    fontSize: 16,
  },
  linkHighlight: {
    color: '#9B5CFF',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 15,
    opacity: 0.8,
    fontWeight: 'bold'
  },
});