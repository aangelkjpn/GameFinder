import {View,Text,StyleSheet,FlatList,TouchableOpacity,TextInput,ScrollView,Modal,Alert,ActivityIndicator,Linking,Image,ImageBackground} from 'react-native';
import { useState, useEffect } from 'react';
import { AntDesign, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150/4D1F8C/FFFFFF?text=👤';

const USER_AVATAR_KEY = 'user_avatar_url';
const USER_BANNER_KEY = 'user_banner_url';

const AVATAR_UPDATE_EVENT = 'avatar_updated';

const safeParse = (data, fallback = {}) => {
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

const useAvatarUpdate = () => {
  const [avatarUpdateCount, setAvatarUpdateCount] = useState(0);

  const triggerAvatarUpdate = () => {
    setAvatarUpdateCount(prev => prev + 1);
  };

  return { avatarUpdateCount, triggerAvatarUpdate };
};

const loadUserAvatar = async (userId) => {
  try {
    if (!userId) return USER_PLACEHOLDER_IMAGE;
    
    const storedAvatar = await AsyncStorage.getItem(`${USER_AVATAR_KEY}_${userId}`);
    if (storedAvatar) {
      return storedAvatar;
    }
    
    return USER_PLACEHOLDER_IMAGE;
  } catch (error) {
    console.error('Erro ao carregar avatar do usuário:', error);
    return USER_PLACEHOLDER_IMAGE;
  }
};

// Componente de Card de Perfil
const ProfileCard = ({ usuario, onAvatarUpdate }) => {
  const [avatarSource, setAvatarSource] = useState(null);
  const [bannerSource, setBannerSource] = useState(null);

  useEffect(() => {
    const loadStoredImages = async () => {
      try {
        if (usuario.avatar_url) {
          const storedAvatar = await AsyncStorage.getItem(`${USER_AVATAR_KEY}_${usuario.id}`);
          if (storedAvatar) {
            setAvatarSource({ uri: storedAvatar });
          } else {
            setAvatarSource({ uri: usuario.avatar_url });
            await AsyncStorage.setItem(`${USER_AVATAR_KEY}_${usuario.id}`, usuario.avatar_url);
          }
        } else {
          setAvatarSource(null);
        }

        if (usuario.banner_url) {
          const storedBanner = await AsyncStorage.getItem(`${USER_BANNER_KEY}_${usuario.id}`);
          if (storedBanner) {
            setBannerSource({ uri: storedBanner });
          } else {
            setBannerSource({ uri: usuario.banner_url });
            await AsyncStorage.setItem(`${USER_BANNER_KEY}_${usuario.id}`, usuario.banner_url);
          }
        } else {
          setBannerSource(null);
        }
      } catch (error) {
        console.error('Erro ao carregar imagens do storage:', error);
        setAvatarSource(usuario.avatar_url ? { uri: usuario.avatar_url } : null);
        setBannerSource(usuario.banner_url ? { uri: usuario.banner_url } : null);
      }
    };

    loadStoredImages();
  }, [usuario, onAvatarUpdate]);

  const renderLinks = () => {
    const links = safeParse(usuario.links, []);
    if (links.length === 0) return null;

    const getIconName = (platform) => {
      if (platform.toLowerCase().includes('twitter')) return 'logo-twitter';
      if (platform.toLowerCase().includes('youtube')) return 'logo-youtube';
      if (platform.toLowerCase().includes('instagram')) return 'logo-instagram';
      if (platform.toLowerCase().includes('facebook')) return 'logo-facebook';
      return 'link-outline';
    };

    return (
      <View style={profileStyles.linksContainer}>
        {links.map((linkObj, idx) => (
          <TouchableOpacity
            key={`${linkObj.platform}-${idx}`}
            onPress={() => linkObj.url && Linking.openURL(linkObj.url)}
            style={profileStyles.linkIconWrapper}
            activeOpacity={0.7}
          >
            <Ionicons name={getIconName(linkObj.platform)} size={24} color="#F5E6FF" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSocialMetrics = () => {
    if (usuario.followers_count) {
      return (
        <View style={profileStyles.socialMetricsContainer}>
          <Ionicons name="people-outline" size={16} color="#C4A0FF" />
          <Text style={profileStyles.socialMetricsText}>{usuario.followers_count} seguidores</Text>
        </View>
      );
    }
    return null;
  };

  const renderPronouns = () => {
    if (usuario.pronouns && usuario.pronouns.trim()) {
      return <Text style={profileStyles.pronounsText}>{usuario.pronouns}</Text>;
    }
    return null;
  };

  const renderPreferences = () => {
    const preferences = safeParse(usuario.preferences, []);
    if (preferences.length === 0) return null;

    return (
      <View style={profileStyles.preferencesSection}>
        <Text style={profileStyles.sectionTitle}>Minhas Preferências</Text>
        <View style={profileStyles.tagsContainer}>
          {preferences.map((preference, index) => (
            <View key={`pref-${index}`} style={profileStyles.tagItem}>
              <Text style={profileStyles.tagText}>{preference}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTopGames = () => {
    const favoriteGames = safeParse(usuario.favorites, []);
    if (favoriteGames.length === 0) return null;

    return (
      <View style={profileStyles.favoritesSection}>
        <Text style={profileStyles.sectionTitle}>Top 5 Jogos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={profileStyles.favoritesScrollContent}
        >
          {favoriteGames.slice(0, 5).map((game, i) => (
            <View key={game.id || `${i}`} style={profileStyles.gameCard}>
              {game.imageUrl ? (
                <Image source={{ uri: game.imageUrl }} style={profileStyles.gameImage} />
              ) : (
                <View style={[profileStyles.gameImage, profileStyles.gameImagePlaceholder]}>
                  <Ionicons name="game-controller" size={36} color="#C4A0FF" />
                </View>
              )}
              <Text style={profileStyles.gameTitle} numberOfLines={1}>{game.title}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const content = (
    <View style={bannerSource ? profileStyles.cardContent : profileStyles.cardContentNoBanner}>
      {avatarSource ? (
        <Image source={avatarSource} style={profileStyles.avatarImage} />
      ) : (
        <View style={profileStyles.avatarPlaceholder}>
          <Ionicons name="person" size={60} color="#E2D1FF" />
        </View>
      )}
      <View style={profileStyles.infoContainer}>
        <Text style={profileStyles.userName}>
          {usuario.nome || usuario.usuario || 'Nome não definido'}
        </Text>
        {renderPronouns()}
        {renderLinks()}
        {renderSocialMetrics()}
        {usuario.bio ? (
          <Text style={profileStyles.userBio} numberOfLines={3} ellipsizeMode="tail">
            {usuario.bio}
          </Text>
        ) : null}
      </View>
      
      {renderPreferences()}
      {renderTopGames()}
    </View>
  );

  return bannerSource ? (
    <ImageBackground source={bannerSource} style={profileStyles.profileCard} resizeMode="cover">
      <View style={profileStyles.cardOverlay} />
      {content}
    </ImageBackground>
  ) : (
    <View style={profileStyles.profileCardNoBanner}>
      {content}
    </View>
  );
};

// Modal de Perfil do Usuário
const UserProfileModal = ({ visible, onClose, user, onAvatarUpdate }) => {
  if (!user) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={userProfileModalStyles.container}>
        <View style={userProfileModalStyles.header}>
          <Text style={userProfileModalStyles.title}>Perfil do Usuário</Text>
          <TouchableOpacity style={userProfileModalStyles.closeButton} onPress={onClose}>
            <AntDesign name="close" size={24} color="#F5E6FF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={userProfileModalStyles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={userProfileModalStyles.scrollContent}
        >
          <ProfileCard usuario={user} onAvatarUpdate={onAvatarUpdate} />
          
          <TouchableOpacity style={userProfileModalStyles.closeProfileButton} onPress={onClose}>
            <Text style={userProfileModalStyles.buttonText}>Fechar Perfil</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Modal de Seleção de Jogos
const GameSelectionModal = ({ visible, onClose, onGameSelect }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGames, setFilteredGames] = useState([]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://10.111.9.99:3000/api/jogos');
      setGames(response.data);
      setFilteredGames(response.data);
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de jogos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text) {
      const filtered = games.filter(game =>
        game.titulo.toLowerCase().includes(text.toLowerCase()) ||
        (game.empresa && game.empresa.toLowerCase().includes(text.toLowerCase())) ||
        (game.genero && game.genero.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredGames(filtered);
    } else {
      setFilteredGames(games);
    }
  };

  useEffect(() => {
    if (visible) {
      loadGames();
      setSearchTerm('');
    }
  }, [visible]);

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={gameSelectionModalStyles.container}>
        <View style={gameSelectionModalStyles.content}>
          <View style={gameSelectionModalStyles.header}>
            <Text style={gameSelectionModalStyles.title}>Selecionar Jogo</Text>
            <TouchableOpacity style={gameSelectionModalStyles.closeButton} onPress={onClose}>
              <AntDesign name="close" size={24} color="#F5E6FF" />
            </TouchableOpacity>
          </View>
          
          {/* Barra de pesquisa */}
          <View style={gameSelectionModalStyles.searchContainer}>
            <Feather name="search" size={20} color="#C7A3FF" />
            <TextInput
              style={gameSelectionModalStyles.searchInput}
              placeholder="Pesquisar jogo, empresa ou gênero..."
              placeholderTextColor="#A67FEB"
              value={searchTerm}
              onChangeText={handleSearch}
            />
          </View>

          {loading ? (
            <View style={gameSelectionModalStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#A259FF" />
              <Text style={gameSelectionModalStyles.loadingText}>Carregando jogos...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredGames}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={gameSelectionModalStyles.gameItem}
                  onPress={() => onGameSelect(item)}
                >
                  <View style={gameSelectionModalStyles.gameInfo}>
                    <Text style={gameSelectionModalStyles.gameItemText}>{item.titulo}</Text>
                    <View style={gameSelectionModalStyles.gameDetails}>
                      {item.empresa && (
                        <Text style={gameSelectionModalStyles.gameDetail}>
                          <Feather name="building" size={12} color="#C7A3FF" /> {item.empresa}
                        </Text>
                      )}
                      {item.genero && (
                        <Text style={gameSelectionModalStyles.gameDetail}>
                          <Feather name="tag" size={12} color="#C7A3FF" /> {item.genero}
                        </Text>
                      )}
                    </View>
                  </View>
                  <AntDesign name="right" size={16} color="#C7A3FF" />
                </TouchableOpacity>
              )}
              style={gameSelectionModalStyles.gamesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={gameSelectionModalStyles.emptySearch}>
                  <Feather name="search" size={40} color="#4D1F8C" />
                  <Text style={gameSelectionModalStyles.emptySearchText}>Nenhum jogo encontrado</Text>
                  <Text style={gameSelectionModalStyles.emptySearchSubtext}>
                    Tente outros termos de pesquisa
                  </Text>
                </View>
              }
            />
          )}
          
          <TouchableOpacity style={gameSelectionModalStyles.cancelButton} onPress={onClose}>
            <Text style={gameSelectionModalStyles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Modal de Entrada/Avaliação
const EntryModal = ({ 
  visible,
  onClose,
  title,
  selectedGame,
  rating,
  setRating,
  comment,
  setComment,
  selectedTags,
  setSelectedTags,
  onSave,
}) => {
  const availableTags = [
    'Terror', 'Suspense', 'FPS', 'Sobrevivência', 'Zumbi', 
    'Ação', 'Aventura', 'RPG', 'Estratégia', 'Esportes',
    'Corrida', 'Luta', 'Plataforma', 'Puzzle', 'Simulação',
    'Multijogador', 'Cooperativo', 'Competitivo', 'Mundo Aberto',
    'Linear', 'Realista', 'Estilizado', 'Violento', 'Family Friendly',
    'História Rica', 'Grátis', 'Premium', 'Indie', 'AAA'
  ];

  const autoSelectTags = () => {
    if (!selectedGame) return;

    const autoTags = [];
    const gameTitle = selectedGame.titulo?.toLowerCase() || '';
    const gameGenre = selectedGame.genero?.toLowerCase() || '';
    const gameCompany = selectedGame.empresa?.toLowerCase() || '';
    const userComment = comment?.toLowerCase() || '';

    // Mapeamento de palavras-chave para tags
    const tagMappings = {
      'terror': 'Terror',
      'horror': 'Terror',
      'medo': 'Terror',
      'suspense': 'Suspense',
      'mistério': 'Suspense',
      'fps': 'FPS',
      'tiro': 'FPS',
      'shooter': 'FPS',
      'sobrevivência': 'Sobrevivência',
      'survival': 'Sobrevivência',
      'zumbi': 'Zumbi',
      'zombie': 'Zumbi',
      'ação': 'Ação',
      'action': 'Ação',
      'aventura': 'Aventura',
      'adventure': 'Aventura',
      'rpg': 'RPG',
      'role playing': 'RPG',
      'estratégia': 'Estratégia',
      'strategy': 'Estratégia',
      'esportes': 'Esportes',
      'sports': 'Esportes',
      'corrida': 'Corrida',
      'racing': 'Corrida',
      'luta': 'Luta',
      'fighting': 'Luta',
      'plataforma': 'Plataforma',
      'platform': 'Plataforma',
      'puzzle': 'Puzzle',
      'quebra-cabeça': 'Puzzle',
      'simulação': 'Simulação',
      'simulation': 'Simulação',
      'multiplayer': 'Multijogador',
      'multijogador': 'Multijogador',
      'coop': 'Cooperativo',
      'cooperativo': 'Cooperativo',
      'competitivo': 'Competitivo',
      'competitive': 'Competitivo',
      'mundo aberto': 'Mundo Aberto',
      'open world': 'Mundo Aberto',
      'linear': 'Linear',
      'realista': 'Realista',
      'realistic': 'Realista',
      'estilizado': 'Estilizado',
      'stylized': 'Estilizado',
      'violento': 'Violento',
      'violent': 'Violento',
      'family friendly': 'Family Friendly',
      'família': 'Family Friendly',
      'história': 'História Rica',
      'story': 'História Rica',
      'narrativa': 'História Rica',
      'grátis': 'Grátis',
      'free': 'Grátis',
      'premium': 'Premium',
      'pago': 'Premium',
      'indie': 'Indie',
      'independente': 'Indie',
      'aaa': 'AAA',
      'triple a': 'AAA'
    };

    const searchText = `${gameTitle} ${gameGenre} ${gameCompany} ${userComment}`;
    
    Object.keys(tagMappings).forEach(keyword => {
      if (searchText.includes(keyword)) {
        const tag = tagMappings[keyword];
        if (!autoTags.includes(tag) && !selectedTags.includes(tag)) {
          autoTags.push(tag);
        }
      }
    });

    if (gameGenre.includes('terror') || gameGenre.includes('horror')) {
      if (!autoTags.includes('Terror')) autoTags.push('Terror');
    }
    if (gameGenre.includes('ação')) {
      if (!autoTags.includes('Ação')) autoTags.push('Ação');
    }
    if (gameGenre.includes('rpg')) {
      if (!autoTags.includes('RPG')) autoTags.push('RPG');
    }
    if (gameGenre.includes('fps') || gameGenre.includes('tiro')) {
      if (!autoTags.includes('FPS')) autoTags.push('FPS');
    }

    const finalTags = autoTags.slice(0, 5);

    if (finalTags.length > 0) {
      setSelectedTags([...selectedTags, ...finalTags]);
      Alert.alert(
        'Tags Auto Selecionadas',
        `Foram adicionadas ${finalTags.length} tags baseadas no jogo e seu comentário: ${finalTags.join(', ')}`,
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      Alert.alert(
        'Nenhuma Tag Encontrada',
        'Não foi possível encontrar tags relevantes automaticamente. Por favor, selecione manualmente.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const renderRatingStars = () => {
    const stars = [];
    for (let i = 1; i <= 10; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <AntDesign
            name={i <= rating ? 'star' : 'staro'}
            size={24}
            color={i <= rating ? '#FFD700' : '#CCCCCC'}
          />
        </TouchableOpacity>
      );
    }
    return (
      <View style={entryModalStyles.starsContainer}>
        {stars}
        <Text style={entryModalStyles.ratingText}>{rating.toFixed(1)}/10</Text>
      </View>
    );
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (rating === 0) {
      Alert.alert(
        'Avaliação Incompleta',
        'Por favor, selecione uma avaliação de 1 a 10 estrelas antes de salvar.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    onSave();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={entryModalStyles.container}>
        <ScrollView style={entryModalStyles.content} showsVerticalScrollIndicator={false}>
          <View style={entryModalStyles.header}>
            <Text style={entryModalStyles.title}>{title}</Text>
            <TouchableOpacity style={entryModalStyles.closeButton} onPress={onClose}>
              <AntDesign name="close" size={24} color="#F5E6FF" />
            </TouchableOpacity>
          </View>
          
          {/* Jogo selecionado */}
          {selectedGame && (
            <View style={entryModalStyles.selectedGameContainer}>
              <View style={entryModalStyles.selectedGameHeader}>
                <Feather name="info" size={18} color="#C7A3FF" />
                <Text style={entryModalStyles.selectedGameLabel}>Jogo selecionado:</Text>
              </View>
              <Text style={entryModalStyles.selectedGameName}>{selectedGame.titulo}</Text>
              <View style={entryModalStyles.gameDetails}>
                {selectedGame.empresa && (
                  <Text style={entryModalStyles.gameDetail}>
                    <Feather name="building" size={12} color="#C7A3FF" /> {selectedGame.empresa}
                  </Text>
                )}
                {selectedGame.genero && (
                  <Text style={entryModalStyles.gameDetail}>
                    <Feather name="tag" size={12} color="#C7A3FF" /> {selectedGame.genero}
                  </Text>
                )}
              </View>
            </View>
          )}

          <Text style={entryModalStyles.subtitle}>Sua avaliação:</Text>
          {renderRatingStars()}
          
          <Text style={entryModalStyles.subtitle}>Comentário (opcional):</Text>
          <View style={entryModalStyles.commentInputContainer}>
            <TextInput
              style={entryModalStyles.commentInput}
              placeholder="Digite seu comentário..."
              placeholderTextColor="#BBBBBB"
              multiline
              numberOfLines={5}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* Botão de Auto Seleção de Tags */}
          <View style={entryModalStyles.autoTagsSection}>
            <TouchableOpacity 
              style={entryModalStyles.autoTagsButton}
              onPress={autoSelectTags}
              disabled={!selectedGame}
            >
              <Ionicons name="sparkles" size={20} color="#F5E6FF" />
              <Text style={entryModalStyles.autoTagsButtonText}>Auto Selecionar Tags</Text>
            </TouchableOpacity>
            <Text style={entryModalStyles.autoTagsDescription}>
              Baseado no jogo selecionado e seu comentário
            </Text>
          </View>

          <Text style={entryModalStyles.subtitle}>Tags selecionadas ({selectedTags.length}):</Text>
          <View style={entryModalStyles.tagsContainer}>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  entryModalStyles.tagButton,
                  selectedTags.includes(tag) && entryModalStyles.tagButtonSelected
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  entryModalStyles.tagButtonText,
                  selectedTags.includes(tag) && entryModalStyles.tagButtonTextSelected
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={entryModalStyles.buttons}>
            <TouchableOpacity style={entryModalStyles.cancelButton} onPress={onClose}>
              <Text style={entryModalStyles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[entryModalStyles.saveButton, !selectedGame && entryModalStyles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={!selectedGame}
            >
              <Text style={entryModalStyles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function GameDiaryScreen() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('diary');
  const [gameSelectionModalVisible, setGameSelectionModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [userProfileModalVisible, setUserProfileModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [diaryEntries, setDiaryEntries] = useState([]);
  
  const { avatarUpdateCount, triggerAvatarUpdate } = useAvatarUpdate();

  const API_URL = 'http://10.111.9.99:3000/api';

  const saveUserImageToStorage = async (userId, imageUrl, storageKey) => {
    try {
      if (imageUrl && userId) {
        await AsyncStorage.setItem(`${storageKey}_${userId}`, imageUrl);
        triggerAvatarUpdate();
      }
    } catch (error) {
      console.error('Erro ao salvar imagem no storage:', error);
    }
  };

  const loadUserImageFromStorage = async (userId, storageKey) => {
    try {
      if (userId) {
        const storedImage = await AsyncStorage.getItem(`${storageKey}_${userId}`);
        return storedImage;
      }
    } catch (error) {
      console.error('Erro ao carregar imagem do storage:', error);
    }
    return null;
  };

  const updateAvatarInEntries = async (userId, newAvatarUrl) => {
    try {
      const updatedEntries = diaryEntries.map(entry => {
        if (entry.usuario_id === userId) {
          return {
            ...entry,
            foto_usuario: newAvatarUrl
          };
        }
        return entry;
      });
      setDiaryEntries(updatedEntries);
    } catch (error) {
      console.error('Erro ao atualizar avatar nas avaliações:', error);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        const response = await axios.get(`${API_URL}/usuario/${storedUserId}`);
        const userData = response.data;
        
        const storedAvatar = await loadUserImageFromStorage(userData.id, USER_AVATAR_KEY);
        if (storedAvatar) {
          userData.avatar_url = storedAvatar;
        } else if (userData.avatar_url) {
          await saveUserImageToStorage(userData.id, userData.avatar_url, USER_AVATAR_KEY);
        }

        const storedBanner = await loadUserImageFromStorage(userData.id, USER_BANNER_KEY);
        if (storedBanner) {
          userData.banner_url = storedBanner;
        } else if (userData.banner_url) {
          await saveUserImageToStorage(userData.id, userData.banner_url, USER_BANNER_KEY);
        }

        setCurrentUser(userData);
        
        if (userData.avatar_url) {
          await updateAvatarInEntries(userData.id, userData.avatar_url);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/avaliacoes`);
      
      const avaliacoesProcessadas = await Promise.all(
        response.data.map(async (av) => {
          const userAvatar = await loadUserAvatar(av.usuario_id);

          return {
            id: av.id,
            game: av.nome_jogo,
            date: new Date(av.data_criacao).toLocaleDateString('pt-BR'),
            rating: Number(av.nota) || 0,
            comment: av.comentario,
            tags:
              (typeof av.tags === 'string'
                ? av.tags.split(',').map((tag) => tag.trim())
                : av.tags) || [],
            usuario_id: av.usuario_id,
            nome_usuario: av.nome_usuario,
            foto_usuario: userAvatar,
          };
        })
      );
      setDiaryEntries(avaliacoesProcessadas);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as avaliações.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedUserData = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/usuario/${userId}`);
      const userData = response.data;
      
      const storedAvatar = await loadUserImageFromStorage(userId, USER_AVATAR_KEY);
      if (storedAvatar) {
        userData.avatar_url = storedAvatar;
      }

      const storedBanner = await loadUserImageFromStorage(userId, USER_BANNER_KEY);
      if (storedBanner) {
        userData.banner_url = storedBanner;
      }

      setSelectedUser(userData);
      setUserProfileModalVisible(true);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil do usuário.');
    }
  };

  const handleUserProfileClick = (userId) => {
    loadSelectedUserData(userId);
  };

  useEffect(() => {
    loadUserData();
    loadAvaliacoes();
  }, [avatarUpdateCount]);

  const handleAvatarUpdate = async () => {
    await loadUserData();
    await loadAvaliacoes();
  };

  const handleAddNewEntry = () => {
    if (!currentUser) {
      Alert.alert('Atenção', 'Você precisa estar logado para adicionar uma avaliação.');
      return;
    }
    setGameSelectionModalVisible(true);
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setGameSelectionModalVisible(false);
    setRatingModalVisible(true);
  };

  const resetEntryForm = () => {
    setSelectedGame(null);
    setCurrentRating(0);
    setComment('');
    setSelectedTags([]);
    setEditingEntryId(null);
  };

  const saveRating = async () => {
    if (!currentUser || !selectedGame) {
      return Alert.alert('Erro', 'Dados incompletos para salvar a avaliação.');
    }
    try {
      const response = await axios.post(`${API_URL}/salvar-avaliacao`, {
        usuario_id: currentUser.id,
        jogo_nome: selectedGame.titulo,
        nota: currentRating,
        comentario: comment,
        tags: selectedTags,
      });

      const currentAvatar = await loadUserAvatar(currentUser.id);

      const newReview = {
        id: response.data.id || Date.now(),
        game: selectedGame.titulo,
        date: new Date().toLocaleDateString('pt-BR'),
        rating: currentRating,
        comment: comment,
        tags: selectedTags,
        usuario_id: currentUser.id,
        nome_usuario: currentUser.usuario || currentUser.nome,
        foto_usuario: currentAvatar,
        ...response.data
      };

      setDiaryEntries(prevEntries => [newReview, ...prevEntries]);
      
      setRatingModalVisible(false);
      resetEntryForm();
      
      setTimeout(() => {
        loadAvaliacoes();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      Alert.alert('Erro', 'Não foi possível salvar a avaliação.');
    }
  };

  const saveEditedEntry = async () => {
    if (!currentUser || !selectedGame) {
      return Alert.alert('Erro', 'Dados incompletos para editar a avaliação.');
    }
    try {
      await axios.put(`${API_URL}/avaliacoes/${editingEntryId}`, {
        usuario_id: currentUser.id,
        jogo_nome: selectedGame.titulo,
        nota: currentRating,
        comentario: comment,
        tags: selectedTags,
      });

      const currentAvatar = await loadUserAvatar(currentUser.id);

      setDiaryEntries(prevEntries =>
        prevEntries.map((entry) =>
          entry.id === editingEntryId
            ? {
                ...entry,
                game: selectedGame.titulo,
                rating: currentRating,
                comment: comment,
                tags: selectedTags,
                date: new Date().toLocaleDateString('pt-BR'),
                nome_usuario: currentUser.usuario,
                foto_usuario: currentAvatar,
              }
            : entry
        )
      );

      setRatingModalVisible(false);
      resetEntryForm();
      
      setTimeout(() => {
        loadAvaliacoes();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao editar avaliação:', error);
      Alert.alert('Erro', 'Não foi possível editar a avaliação.');
    }
  };
  
  const editEntry = (entry) => {
    if (!currentUser || entry.usuario_id !== currentUser.id) {
      Alert.alert('Atenção', 'Você só pode editar suas próprias avaliações.');
      return;
    }
    
    const mockGame = { titulo: entry.game };
    setSelectedGame(mockGame);
    setCurrentRating(entry.rating);
    setComment(entry.comment);
    setSelectedTags(entry.tags);
    setEditingEntryId(entry.id);
    setRatingModalVisible(true);
  };

  const deleteEntry = async (id, userId) => {
    if (!currentUser || userId !== currentUser.id) {
      Alert.alert('Atenção', 'Você só pode excluir suas próprias avaliações.');
      return;
    }
    Alert.alert('Confirmar exclusão', 'Tem certeza que deseja excluir esta entrada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/avaliacoes/${id}`, {
              data: { usuario_id: currentUser.id },
            });
            setDiaryEntries(prevEntries => prevEntries.filter((entry) => entry.id !== id));
          } catch (error) {
            console.error('Erro ao deletar:', error);
            Alert.alert('Erro', 'Não foi possível excluir a avaliação.');
          }
        },
      },
    ]);
  };

  const handleImageError = async (item) => {
    if (item.usuario_id) {
      const userAvatar = await loadUserAvatar(item.usuario_id);
      const updatedEntries = diaryEntries.map(entry => 
        entry.id === item.id 
          ? { ...entry, foto_usuario: userAvatar }
          : entry
      );
      setDiaryEntries(updatedEntries);
      return;
    }
    
    const updatedEntries = diaryEntries.map(entry => 
      entry.id === item.id 
        ? { ...entry, foto_usuario: USER_PLACEHOLDER_IMAGE }
        : entry
    );
    setDiaryEntries(updatedEntries);
  };

  const renderItem = ({ item }) => {
    const isCurrentUserEntry = currentUser && item.usuario_id === currentUser.id;
    const rating = Number(item.rating) || 0;

    return (
      <View style={styles.entryContainer}>
        
        {/* Topo com foto, nome, data, nota */}
        <View style={styles.userInfoHeader}>
          <TouchableOpacity 
            style={styles.userInfoLeft}
            onPress={() => handleUserProfileClick(item.usuario_id)}
          >
            <Image 
              source={{ 
                uri: item.foto_usuario || USER_PLACEHOLDER_IMAGE 
              }} 
              style={styles.profileImage}
              onError={() => handleImageError(item)}
              defaultSource={{ uri: USER_PLACEHOLDER_IMAGE }}
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.userCardName} numberOfLines={1}>
                {item.nome_usuario || 'Usuário Desconhecido'}
              </Text>
              <Text style={styles.dateText}>Avaliado em: {item.date}</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.ratingBadge}>
            <AntDesign name="star" size={17} color="#FFD700" />
            <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Título do Jogo E Botões de Ação */}
        <View style={styles.gameTitleRow}>
          <Text style={styles.gameTitle}>{item.game}</Text>
          
          {/* Botões de Editar/Apagar */}
          {isCurrentUserEntry && (
            <View style={styles.entryActions}>
              <TouchableOpacity onPress={() => editEntry(item)} style={styles.actionButton}>
                <Feather name="edit-2" size={18} color="#A259FF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteEntry(item.id, item.usuario_id)}
                style={[styles.actionButton, styles.deleteButton]}
              >
                <MaterialIcons name="delete-outline" size={18} color="#FF5252" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Comentário */}
        {item.comment && (
          <View style={styles.commentContainer}>
            <Feather name="message-square" size={18} color="#C7A3FF" />
            <Text style={styles.comment}> {item.comment}</Text>
          </View>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>Tags:</Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Feather name="tag" size={18} color="#E2D1FF"/>
                  <Text style={styles.tagText}> {tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#A259FF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Avaliações de Jogos</Text>
        <Text style={styles.userInfo}>
          Usuário: {currentUser ? currentUser.usuario : 'Visitante'}
        </Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'diary' && styles.activeTab]}
          onPress={() => setActiveTab('diary')}>
          <Text style={styles.tabText}>📅 Avaliações</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}>
          <Text style={styles.tabText}>📚 Sobre</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'diary' ? (
        <>
          {/* Botão para adicionar nova avaliação */}
          {currentUser && (
            <View style={styles.addEntryContainer}>
              <TouchableOpacity style={styles.addButtonLarge} onPress={handleAddNewEntry}>
                <Text style={styles.addButtonLargeText}>+ Adicionar Avaliação</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mensagem para visitantes */}
          {!currentUser && (
            <View style={styles.guestMessage}>
              <Text style={styles.guestText}>
                Faça login para adicionar suas próprias avaliações
              </Text>
            </View>
          )}

          {/* Lista de avaliações */}
          {diaryEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma avaliação encontrada</Text>
              <Text style={styles.emptyStateSubtext}>
                {currentUser ? 'Adicione sua primeira avaliação!' : 'Faça login para adicionar avaliações'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={diaryEntries}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        // Seção "Sobre"
        <ScrollView contentContainerStyle={styles.aboutContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.companyCard}>
            <Text style={styles.companyTitle}>GameFinder 🎮</Text>
            <View style={styles.companyDescription}>
              <Text style={[styles.descriptionText, { textAlign: 'center', marginBottom: 20 }]}>
                Plataforma de avaliação de jogos desenvolvida para TCC
              </Text>
              <Text style={styles.descriptionText}>
                Este aplicativo permite que usuários compartilhem suas avaliações de jogos, criando
                uma comunidade onde todos podem descobrir novos títulos baseados nas opiniões de
                outros jogadores.
              </Text>
              <View style={styles.contactBox}>
                <Text style={styles.contactTitle}>Contato</Text>
                <Text style={styles.contactEmail}>contato@gamefinder.com</Text>
                <View style={styles.socialIcons}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL('https://twitter.com/gamefinder')}>
                    <AntDesign name="twitter" size={24} color="#1DA1F2" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL('https://instagram.com/gamefinder')}>
                    <AntDesign name="instagram" size={24} color="#E1306C" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modal de Perfil do Usuário */}
      <UserProfileModal
        visible={userProfileModalVisible}
        onClose={() => setUserProfileModalVisible(false)}
        user={selectedUser}
        onAvatarUpdate={handleAvatarUpdate}
      />

      {/* Modal de Seleção de Jogo */}
      <GameSelectionModal
        visible={gameSelectionModalVisible}
        onClose={() => setGameSelectionModalVisible(false)}
        onGameSelect={handleGameSelect}
      />

      {/* Modal de Avaliação/Edição */}
      <EntryModal
        visible={ratingModalVisible}
        onClose={() => {
          setRatingModalVisible(false);
          resetEntryForm();
        }}
        title={editingEntryId ? 'Editar avaliação' : `Avaliar ${selectedGame?.titulo || 'Jogo'}`}
        selectedGame={selectedGame}
        rating={currentRating}
        setRating={setCurrentRating}
        comment={comment}
        setComment={setComment}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        onSave={editingEntryId ? saveEditedEntry : saveRating}
      />
    </View>
  );
}

const profileStyles = StyleSheet.create({
  profileCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    justifyContent: 'flex-end',
    shadowColor: '#C18CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 100,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 0, 39, 0.6)',
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
    minHeight: 600,
  },
  profileCardNoBanner: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#3B1169',
    minHeight: 260,
    justifyContent: 'flex-end',
    shadowColor: '#C18CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#A259FF',
  },
  cardContentNoBanner: {
    padding: 25,
    alignItems: 'center',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#9B5CFF',
    backgroundColor: '#3B1169',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#532E88',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#9B5CFF',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  userName: {
    color: '#F5E6FF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pronounsText: {
    color: '#C4A0FF',
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  linksContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  linkIconWrapper: {
    marginHorizontal: 8,
  },
  socialMetricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialMetricsText: {
    color: '#C4A0FF',
    fontSize: 14,
    marginLeft: 4,
  },
  userBio: {
    color: '#FFF',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  preferencesSection: {
    width: '100%',
    backgroundColor: '#2A0B4A',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  favoritesSection: {
    width: '100%',
    backgroundColor: '#2A0B4A',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tagItem: {
    backgroundColor: '#4A1C7A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A259FF',
  },
  tagText: {
    color: '#F5E6FF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  favoritesScrollContent: {
    paddingVertical: 10,
  },
  gameCard: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  gameImage: {
    width: 100,
    height: 130,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  gameImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#532E88',
  },
  gameTitle: {
    color: '#F5E6FF',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0022',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E2D1FF',
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1E0A40',
    borderBottomWidth: 1,
    borderBottomColor: '#3A1A6A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5E6FF',
    textAlign: 'center',
  },
  userInfo: {
    color: '#C7A3FF',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#2A0A50',
    borderBottomWidth: 1,
    borderBottomColor: '#4D1F8C',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#B77DFF',
  },
  tabText: {
    color: '#E2D1FF',
    fontWeight: '500',
  },
  addEntryContainer: {
    padding: 15,
    backgroundColor: '#2A0A50',
    margin: 15,
    borderRadius: 12,
  },
  addButtonLarge: {
    backgroundColor: '#B77DFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonLargeText: {
    color: '#0F0022',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestMessage: {
    padding: 15,
    backgroundColor: '#2A0A50',
    marginHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  guestText: {
    color: '#E2D1FF',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  entryContainer: {
    backgroundColor: '#2A0A50',
    padding: 20,
    marginBottom: 15,
    borderRadius: 16,
    marginHorizontal: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#8A4FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4D1F8C',
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#B77DFF',
    marginRight: 10,
  },
  userTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userCardName: {
    color: '#F5E6FF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(183, 125, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  dateText: {
    color: '#A67FEB',
    fontSize: 14.6,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8A4FFF',
    marginLeft: 10,
  },
  ratingBadgeText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  gameTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5E6FF',
    flexShrink: 1,
    marginRight: 10,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(162, 89, 255, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A259FF',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderColor: '#FF5252',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(26, 0, 51, 0.5)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#A259FF',
  },
  comment: {
    color: '#E2D1FF',
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 18,
    marginLeft: 10,
  },
  tagsSection: {
    marginTop: 8,
  },
  tagsLabel: {
    color: '#C7A3FF',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 79, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#8A4FFF',
  },
  tagText: {
    fontSize: 11,
    color: '#E2D1FF',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#F5E6FF',
    fontSize: 18, 
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    color: '#A67FEB',
    textAlign: 'center',
  },
  aboutContainer: {
    flexGrow: 1,
    padding: 20,
  },
  companyCard: {
    backgroundColor: '#2A0A50',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8A4FFF',
  },
  companyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F5E6FF',
    textAlign: 'center',
    marginBottom: 5,
  },
  companyDescription: {
    marginTop: 10,
  },
  descriptionText: {
    color: '#E2D1FF',
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 8,
  },
  contactBox: {
    marginTop: 25,
    backgroundColor: '#3A1A6A',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#8A4FFF',
  },
  contactTitle: {
    color: '#F5E6FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  contactEmail: {
    color: '#B77DFF',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  socialButton: {
    marginHorizontal: 10,
    backgroundColor: '#2A0A50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Modal de Perfil do Usuário
const userProfileModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 0, 34, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    backgroundColor: '#1E0A40',
    borderBottomWidth: 1,
    borderBottomColor: '#4D1F8C',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F5E6FF',
    flex: 1,
  },
  closeButton: {
    padding: 5,
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  closeProfileButton: {
    backgroundColor: '#8A4FFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#F5E6FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const gameSelectionModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 0, 34, 0.92)',
    padding: 20,
  },
  content: {
    width: '100%',
    backgroundColor: '#2A0A50',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#A259FF',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5E6FF',
    flex: 1,
  },
  closeButton: {
    padding: 5,
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A0033',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4D1F8C',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#F5E6FF',
    paddingVertical: 12,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#C7A3FF',
    marginTop: 15,
    fontSize: 16,
  },
  gamesList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  gameItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#4D1F8C',
  },
  gameInfo: {
    flex: 1,
    marginRight: 10,
  },
  gameItemText: {
    color: '#F5E6FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  gameDetail: {
    color: '#C7A3FF',
    fontSize: 12,
    marginRight: 15,
  },
  emptySearch: {
    alignItems: 'center',
    padding: 40,
  },
  emptySearchText: {
    color: '#C7A3FF',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
  emptySearchSubtext: {
    color: '#4D1F8C',
    fontSize: 14,
    marginTop: 5,
  },
  cancelButton: {
    backgroundColor: '#4D1F8C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#F5E6FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const entryModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 0, 34, 0.94)',
    padding: 16,
  },
  content: {
    width: '100%',
    backgroundColor: '#2A0A50',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#B77DFF',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#4D1F8C',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5E6FF',
    flex: 1,
  },
  closeButton: {
    padding: 5,
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    borderRadius: 8,
  },
  selectedGameContainer: {
    backgroundColor: '#3A1A6A',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#C7A3FF',
  },
  selectedGameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  selectedGameLabel: {
    color: '#C7A3FF',
    marginLeft: 5,
    fontSize: 12,
  },
  selectedGameName: {
    color: '#F5E6FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gameDetails: {
    flexDirection: 'row',
  },
  gameDetail: {
    color: '#C7A3FF',
    fontSize: 12,
    marginRight: 15,
  },
  subtitle: {
    color: '#C7A3FF',
    marginBottom: 10,
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    flexWrap: 'wrap',
    backgroundColor: 'rgba(26, 0, 51, 0.5)',
    padding: 15,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  commentInputContainer: {
    marginBottom: 15,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#4D1F8C',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#1A0033',
    color: '#FFF',
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  autoTagsSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  autoTagsButton: {
    flexDirection: 'row',
    backgroundColor: '#A259FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#A259FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  autoTagsButtonText: {
    color: '#F5E6FF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  autoTagsDescription: {
    color: '#C7A3FF',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tagButton: {
    backgroundColor: 'rgba(138, 79, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4D1F8C',
  },
  tagButtonSelected: {
    backgroundColor: '#8A4FFF',
    borderColor: '#F5E6FF',
  },
  tagButtonText: {
    color: '#C7A3FF',
    fontSize: 12,
  },
  tagButtonTextSelected: {
    color: '#F5E6FF',
    fontWeight: 'bold',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#4D1F8C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8A4FFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#4D1F8C',
    opacity: 0.6,
  },
  buttonText: {
    color: '#F5E6FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});