import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// URL da API
const API_URL = 'http://10.111.9.99:3000/api';

const TAGS_PREDEFINIDAS = [
  'Terror', 'FPS', 'RPG','Aventura', 'Estratégia', 'Esportes', 'Corrida', 'Luta',
  'MMO', 'Simulação', 'Indie', 'Mobile', 'Casual', 'Multiplayer', 'Cooperativo', 'Ação',
  'TPS', 'Plataforma', 'Quebra-cabeça', 'Ritmo', 'Battle Royale', 'Hack and Slash', 'Metroidvania',
  'Roguelike', 'Mundo Aberto', 'Sobrevivência', 'Visual Novel', 'Point and Click', 'Estratégia em Tempo Real (RTS)',
  'Estratégia por Turnos (TBS)', 'Tower Defense', 'MOBA', '4X', 'Tabuleiro', 'Cartas', 'Educacional', 'Puzzle',
  'História Interativa', 'Sandbox', 'Stealth',
];

export default function EditarPerfil({ navigation, route }) {
  const {usuario: usuarioParam, section } = route.params || {};
  const [usuario, setUsuario] = useState(usuarioParam || null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [top5, setTop5] = useState([]);
  const [activities, setActivities] = useState([]);
  const [jogos, setJogos] = useState([]);
  const [jogosFiltrados, setJogosFiltrados] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [modalTipo, setModalTipo] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [carregandoJogos, setCarregandoJogos] = useState(false);
  const [estaSalvando, setEstaSalvando] = useState(false);

  const scrollRef = useRef(null);

  const safeParse = (data, defaultValue) => {
    try {
      const parsedData = data ? JSON.parse(data) : defaultValue;
      return Array.isArray(parsedData) ? parsedData : defaultValue;
    } catch (error) {
      console.error('Erro ao parsear dados:', error);
      return defaultValue;
    }
  };

  useEffect(() => {
    if (usuarioParam) {
      setUsuario(usuarioParam);
      setNome(usuarioParam.nome || '');
      setEmail(usuarioParam.email || '');
      setBio(usuarioParam.bio || '');
      setAvatarUrl(usuarioParam.avatar_url || '');
      setBannerUrl(usuarioParam.banner_url || '');
      setLinks(safeParse(usuarioParam.links, []));
      setPreferences(safeParse(usuarioParam.preferences, []));
      setTop5(safeParse(usuarioParam.favorites, []));
      setActivities(safeParse(usuarioParam.activities, []));
    }
  }, [usuarioParam]);

  useEffect(() => {
    if (section && scrollRef.current) {
      const scrollPositions = {
        preferences: 350,
        top5: preferences.length * 50 + 400,
        activities: preferences.length * 50 + top5.length * 60 + 450,
      };
      const scrollY = scrollPositions[section] || 0;
      setTimeout(() => {
        scrollRef.current.scrollTo({ y: scrollY, animated: true });
      }, 300);
    }
  }, [section, preferences.length, top5.length]);

  useEffect(() => {
    const termo = termoBusca.toLowerCase();
    const filtrados = jogos.filter(jogo =>
      jogo.titulo?.toLowerCase().includes(termo) || jogo.genero?.toLowerCase().includes(termo)
    );
    setJogosFiltrados(filtrados);
  }, [termoBusca, jogos]);

  useEffect(() => {
    const hasUnsavedChanges = () => {
      if (!usuario) return false;
      return (
        nome !== (usuario.nome || '') ||
        email !== (usuario.email || '') ||
        bio !== (usuario.bio || '') ||
        avatarUrl !== (usuario.avatar_url || '') ||
        bannerUrl !== (usuario.banner_url || '') ||
        JSON.stringify(links) !== JSON.stringify(safeParse(usuario.links, [])) ||
        JSON.stringify(preferences) !== JSON.stringify(safeParse(usuario.preferences, [])) ||
        JSON.stringify(top5) !== JSON.stringify(safeParse(usuario.favorites, [])) ||
        JSON.stringify(activities) !== JSON.stringify(safeParse(usuario.activities, []))
      );
    };

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (estaSalvando || !hasUnsavedChanges()) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Tem certeza que deseja sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, nome, email, bio, avatarUrl, bannerUrl, links, preferences, top5, activities, usuario, estaSalvando]);

  const carregarJogos = async () => {
    setCarregandoJogos(true);
    try {
      const resposta = await axios.get(`${API_URL}/jogos`);
      const jogosFormatados = resposta.data.map(jogo => ({
        id: jogo.id || Math.random().toString(),
        titulo: jogo.titulo || jogo.title || jogo.nome || 'Nome não disponível',
        genero: jogo.genero || jogo.genre || 'Gênero não informado',
        imagem: jogo.imagem || jogo.image || jogo.imagem_url || 'https://via.placeholder.com/150?text=Sem+Imagem'
      }));
      setJogos(jogosFormatados);
    } catch (erro) {
      console.error('Erro ao carregar jogos:', erro);
      Alert.alert('Erro', 'Não foi possível carregar a lista de jogos.');
    } finally {
      setCarregandoJogos(false);
    }
  };

  const abrirModalJogos = async (tipo) => {
    if (tipo === 'top5' && top5.length >= 5) {
      Alert.alert('Limite atingido', 'Você já possui 5 jogos favoritos. Remova um para adicionar outro.');
      return;
    }
    setModalTipo(tipo);
    await carregarJogos();
    setModalVisivel(true);
  };

  const selecionarJogo = (jogo) => {
    if (modalTipo === 'top5') {
      if (top5.length >= 5) {
        Alert.alert('Limite atingido', 'Você já possui 5 jogos favoritos. Remova um para adicionar outro.');
        return;
      }
      if (!top5.find(f => f.id === jogo.id)) {
        setTop5([...top5, { id: jogo.id, title: jogo.titulo, imageUrl: jogo.imagem }]);
      }
    } else if (modalTipo === 'activities') {
      setActivities([{
        id: Date.now().toString(),
        gameTitle: jogo.titulo,
        action: 'Jogando recentemente',
        gameImageUrl: jogo.imagem,
        timestamp: new Date().toISOString()
      }]);
    }
    setModalVisivel(false);
  };

  const handleAddLink = () => setLinks((prev) => [...prev, { platform: '', url: '' }]);
  const handleRemoveLink = (index) => setLinks((prev) => prev.filter((_, idx) => idx !== index));
  const handleLinkChange = (index, field, value) => {
    setLinks((prev) => prev.map((linkObj, idx) => idx === index ? { ...linkObj, [field]: value } : linkObj));
  };

  const togglePreference = (tag) => {
    setPreferences((prev) => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const removeTop5 = (idx) => setTop5((t) => t.filter((_, i) => i !== idx));
  const removeActivity = () => setActivities([]);

  const validateLinks = () => {
    const hasEmptyFields = links.some(({ platform, url }) => !platform.trim() || !url.trim());
    if (hasEmptyFields) {
      Alert.alert('Atenção', 'Preencha todos os campos de plataforma e URL nos links.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert('Atenção', 'Nome e email são obrigatórios.');
      return;
    }
    if (!validateLinks()) return;

    setEstaSalvando(true);
    try {
      const updatedUser = {
        ...(usuario || {}),
        nome: nome.trim(),
        email: email.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        banner_url: bannerUrl.trim(),
        links: JSON.stringify(links.map(lnk => ({ platform: lnk.platform.trim(), url: lnk.url.trim() }))),
        preferences: JSON.stringify(preferences),
        favorites: JSON.stringify(top5.map(g => ({ ...g, title: (g.title || '').trim(), imageUrl: (g.imageUrl || '').trim() }))),
        activities: JSON.stringify(activities.filter(a => a.gameTitle || a.action)),
      };

      await AsyncStorage.setItem('usuario', JSON.stringify(updatedUser));

      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await axios.put(`${API_URL}/usuario/${userId}`, updatedUser, { timeout: 5000 });
        console.log('Perfil atualizado na API com sucesso');
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      Alert.alert('Erro', 'Não foi possível salvar alterações.');
    } finally {
      setEstaSalvando(false);
    }
  };

  const renderItemJogo = ({ item }) => (
    <TouchableOpacity style={styles.jogoItem} onPress={() => selecionarJogo(item)}>
      <Image
        source={{ uri: item.imagem }}
        style={styles.jogoImagem}
        onError={(e) => {
          e.nativeEvent.target.source.uri = 'https://via.placeholder.com/150?text=Sem+Imagem';
        }}
      />
      <View style={styles.jogoInfo}>
        <Text style={styles.jogoTitulo} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.jogoGenero} numberOfLines={1}>{item.genero}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={estaSalvando}>
            <Ionicons name="arrow-back" size={30} color="#9B5CFF" style={{ marginTop: 18 }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
        </View>

        {/* Campos de texto */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Nome do Perfil:</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Digite o nome para seu perfil..." placeholderTextColor="#C4A0FF" />
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Bio:</Text>
          <TextInput style={[styles.input, { height: 75 }]} value={bio} onChangeText={setBio} placeholder="Breve descrição sobre você..." placeholderTextColor="#C4A0FF" multiline />
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>URL do Avatar:</Text>
          <TextInput style={styles.input} value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://exemplo.com/avatar.jpg" placeholderTextColor="#C4A0FF" />
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>URL do Banner:</Text>
          <TextInput style={styles.input} value={bannerUrl} onChangeText={setBannerUrl} placeholder="https://exemplo.com/banner.jpg" placeholderTextColor="#C4A0FF" />
        </View>

        {/* Links */}
        <View style={styles.fieldContainer}>
          <View style={styles.linksHeader}>
            <Text style={styles.sectionLabel}>Links</Text>
            <TouchableOpacity onPress={handleAddLink}>
              <Ionicons name="add-circle-outline" size={24} color="#C4A0FF" />
            </TouchableOpacity>
          </View>
          {links.length === 0 && <Text style={styles.helperText}>Nenhum link adicionado...</Text>}
          {links.map((linkObj, index) => (
            <View key={`link-${index}`} style={styles.linkRow}>
              <View style={styles.linkInputContainer}>
                <TextInput style={[styles.input, styles.linkInput, { marginBottom: 10 }]} value={linkObj.platform} onChangeText={(text) => handleLinkChange(index, 'platform', text)} placeholder="Plataforma (Ex: Twitter)" placeholderTextColor="#C4A0FF" />
                <TextInput style={[styles.input, styles.linkInput]} value={linkObj.url} onChangeText={(text) => handleLinkChange(index, 'url', text)} placeholder="URL do link" placeholderTextColor="#C4A0FF" autoCapitalize="none" />
              </View>
              <TouchableOpacity style={styles.removeLinkButton} onPress={() => handleRemoveLink(index)}>
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Seções de Preferências, Top 5 e Atividades */}
        
        {/* Minhas Preferências - Tags */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Minhas Preferências</Text>
          </View>
          <Text style={styles.helperText}>Selecione suas tags de preferência:</Text>
          <View style={styles.tagsContainer}>
            {TAGS_PREDEFINIDAS.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tagButton,
                  preferences.includes(tag) && styles.tagButtonSelected
                ]}
                onPress={() => togglePreference(tag)}
              >
                <Text style={[
                  styles.tagText,
                  preferences.includes(tag) && styles.tagTextSelected
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {preferences.length === 0 && (
            <Text style={styles.helperText}>Nenhuma tag selecionada</Text>
          )}
        </View>

        {/* Meu Top 5 */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Meu Top 5</Text>
            <TouchableOpacity onPress={() => abrirModalJogos('top5')}>
              <Ionicons name="add-circle-outline" size={24} color="#C4A0FF" />
            </TouchableOpacity>
          </View>
          {top5.length === 0 && <Text style={styles.helperText}>Nenhum jogo favorito</Text>}
          {top5.map((item, idx) => (
            <View key={`top5-${idx}`} style={styles.itemRow}>
              <Image source={{ uri: item.imageUrl }} style={styles.jogoImagemPequena} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              </View>
              <TouchableOpacity onPress={() => removeTop5(idx)} style={{ marginLeft: 8 }}>
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Atividades Recentes */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            <TouchableOpacity onPress={() => abrirModalJogos('activities')}>
              <Ionicons name="add-circle-outline" size={24} color="#C4A0FF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.warningText}>
            ⚠️ Para atualizar, remova o jogo anterior e adicione um novo que está jogando atualmente.
          </Text>
          {activities.length === 0 && <Text style={styles.helperText}>Nenhuma atividade recente</Text>}
          {activities.map((item, idx) => (
            <View key={`activity-${idx}`} style={styles.itemRow}>
              <Image source={{ uri: item.gameImageUrl }} style={styles.jogoImagemPequena} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.gameTitle}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>{item.action}</Text>
              </View>
              <TouchableOpacity onPress={removeActivity} style={{ marginLeft: 8 }}>
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={estaSalvando}>
          {estaSalvando ? <ActivityIndicator color="#0F0022" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de seleção de jogos */}
      <Modal visible={modalVisivel} animationType="slide" transparent={false} onRequestClose={() => setModalVisivel(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>{modalTipo === 'top5' ? 'Selecionar Jogo para Top 5' : 'Selecionar Jogo para Atividade'}</Text>
            <TouchableOpacity onPress={() => setModalVisivel(false)}>
              <Ionicons name="close" size={24} color="#9B5CFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.buscaContainer}>
            <Ionicons name="search" size={20} color="#9B5CFF" style={styles.iconeBusca} />
            <TextInput style={styles.inputBusca} placeholder="Buscar jogo..." placeholderTextColor="#9B5CFF" value={termoBusca} onChangeText={setTermoBusca} />
          </View>
          {carregandoJogos ? (
            <ActivityIndicator size="large" color="#9B5CFF" style={styles.carregando} />
          ) : (
            <FlatList data={jogosFiltrados} keyExtractor={(item) => item.id.toString()} renderItem={renderItemJogo} contentContainerStyle={styles.listaJogos} />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A002D',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5E6FF',
    marginRight: 28,
    marginTop: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#C4A0FF',
    fontSize: 18,
    marginBottom: 6,
  },
  sectionLabel: {
    color: '#C4A0FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 14,
  },
  helperText: {
    color: '#C4A0FF',
    fontSize: 16,
    marginTop: 4,
    fontStyle: 'italic',
  },
  warningText: {
    color: '#FFA500',
    fontSize: 14,
    marginBottom: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 8,
    borderRadius: 5,
  },
  input: {
    backgroundColor: '#3B1169',
    color: '#F5E6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  emailDisplay: {
    color: '#C4A0FF',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#9B5CFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#9B5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#0F0022',
    fontSize: 18,
    fontWeight: '600',
  },
  linksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  linkInputContainer: {
    flex: 1,
  },
  linkInput: {
    backgroundColor: '#2F0A44',
  },
  removeLinkButton: {
    marginLeft: 20,
    marginTop: 32,
  },
  sectionBlock: {
    backgroundColor: '#2A0B4A',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#F5E6FF',
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  jogoImagemPequena: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemTitle: {
    color: '#F5E6FF',
    fontSize: 16,
  },
  itemSubtitle: {
    color: '#C4A0FF',
    fontSize: 14,
  },
  // Estilos para as tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tagButton: {
    backgroundColor: '#3B1169',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#9B5CFF',
  },
  tagButtonSelected: {
    backgroundColor: '#9B5CFF',
  },
  tagText: {
    color: '#C4A0FF',
    fontSize: 14,
  },
  tagTextSelected: {
    color: '#0F0022',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A002D',
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3B1169',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5E6FF',
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 92, 255, 0.1)',
    margin: 20,
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#9B5CFF',
  },
  iconeBusca: {
    marginRight: 10,
  },
  inputBusca: {
    flex: 1,
    color: '#F5E6FF',
    paddingVertical: 15,
  },
  carregando: {
    marginTop: 50,
  },
  listaJogos: {
    padding: 20,
  },
  jogoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 92, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  jogoImagem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  jogoInfo: {
    flex: 1,
  },
  jogoTitulo: {
    color: '#F5E6FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  jogoGenero: {
    color: '#C4A0FF',
    fontSize: 14,
  },
});