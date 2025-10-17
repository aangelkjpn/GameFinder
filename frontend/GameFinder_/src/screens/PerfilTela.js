import React, { useState, useCallback, useEffect } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ImageBackground, Image, ScrollView, Linking, StatusBar,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://10.111.9.99:3000/api';

const safeParse = (data, fallback = {}) => {
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

const ProfileCard = ({ usuario }) => {
  const avatarSource = usuario.avatar_url ? { uri: usuario.avatar_url } : null;
  const bannerSource = usuario.banner_url ? { uri: usuario.banner_url } : null;

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
      <View style={styles.linksContainer}>
        {links.map((linkObj, idx) => (
          <TouchableOpacity
            key={`${linkObj.platform}-${idx}`}
            onPress={() => linkObj.url && Linking.openURL(linkObj.url)}
            style={styles.linkIconWrapper}
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
        <View style={styles.socialMetricsContainer}>
          <Ionicons name="people-outline" size={16} color="#C4A0FF" />
          <Text style={styles.socialMetricsText}>{usuario.followers_count} seguidores</Text>
        </View>
      );
    }
    return null;
  };

  const renderPronouns = () => {
    if (usuario.pronouns && usuario.pronouns.trim()) {
      return <Text style={styles.pronounsText}>{usuario.pronouns}</Text>;
    }
    return null;
  };

  const content = (
    <View style={bannerSource ? styles.cardContent : styles.cardContentNoBanner}>
      {avatarSource ? (
        <Image source={avatarSource} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={60} color="#E2D1FF" />
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.userName}>
          {usuario.nome || usuario.usuario || 'Nome não definido'}
        </Text>
        {renderPronouns()}
        {renderLinks()}
        {renderSocialMetrics()}
        {usuario.bio ? (
          <Text style={styles.userBio} numberOfLines={3} ellipsizeMode="tail">
            {usuario.bio}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return bannerSource ? (
    <ImageBackground source={bannerSource} style={styles.profileCard} resizeMode="cover">
      <View style={styles.cardOverlay} />
      {content}
    </ImageBackground>
  ) : (
    <View style={styles.profileCardNoBanner}>
      {content}
    </View>
  );
};

const PreferencesTags = ({ preferences, onPress }) => {
  if (preferences.length === 0) {
    return (
      <View style={styles.emptySectionContainer}>
        <Text style={styles.emptyText}>Nada registrado</Text>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.registerHere}>Registrar aqui</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.tagsContainer}>
      {preferences.map((preference, index) => (
        <View key={`pref-${index}`} style={styles.tagItem}>
          <Text style={styles.tagText}>{preference}</Text>
        </View>
      ))}
    </View>
  );
};

export default function PerfilTela({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [preferences, setPreferences] = useState([]);

  const carregarDadosUsuario = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setUsuario(null);
        return;
      }

      const response = await axios.get(`${API_URL}/usuario/${userId}`);
      const user = response.data;
      setUsuario(user);
      setFavoriteGames(safeParse(user.favorites, []));
      setPreferences(safeParse(user.preferences, []));

      const activities = safeParse(user.activities, []);
      const sortedActivities = activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setRecentActivities(sortedActivities);
    } catch (error) {
      console.error('Failed to fetch user from API, trying local storage...', error);
      try {
        const userData = await AsyncStorage.getItem('usuario');
        if (userData) {
          const user = safeParse(userData);
          setUsuario(user);
          setFavoriteGames(safeParse(user.favorites, []));
          setPreferences(safeParse(user.preferences, []));
          const activities = safeParse(user.activities, []);
          const sortedActivities = activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          setRecentActivities(sortedActivities);
        } else {
          setUsuario(null);
        }
      } catch (e) {
        console.error('Failed to load user from local storage', e);
        setUsuario(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDadosUsuario();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('usuario');
      navigation.replace('BemVindo');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fazer logout.');
    }
  };

  const goToEdit = (section) => {
    navigation.navigate('EditarPerfil', { usuario, section });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#9B5CFF" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={[styles.container, styles.emptyState]}>
        <Text style={styles.emptyStateText}>PARA VISUALIZAR E EDITAR SEU PERFIL, POR FAVOR REABRA O APP!</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.replace('BemVindo')} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Voltar para login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground source={require('../../assets/login-bg.png')} style={styles.container} resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.generalOverlay} />
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#9B5CFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditarPerfil', { usuario })} activeOpacity={0.7}>
            <Ionicons name="cog-outline" size={28} color="#9B5CFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <ProfileCard usuario={usuario} />

          <View style={[styles.preferencesSection, styles.centerSection]}>
            <Text style={styles.sectionTitle}>Minhas Preferências</Text>
            <PreferencesTags 
              preferences={preferences} 
              onPress={() => goToEdit('preferences')} 
            />
          </View>

          <View style={[styles.favoritesSection, styles.centerSection]}>
            <Text style={styles.sectionTitle}>Meus Top 5</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={favoriteGames.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : { paddingVertical: 10 }}
            >
              {favoriteGames.length === 0 ? (
                <View style={styles.emptyFavorites}>
                  <Text style={styles.emptyFavoritesText}>Sem jogos favoritos cadastrados</Text>
                  <TouchableOpacity onPress={() => goToEdit('top5')} activeOpacity={0.7}>
                    <Text style={styles.registerHere}>Registrar aqui</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                favoriteGames.slice(0, 5).map((game, i) => (
                  <View key={game.id || `${i}`} style={styles.gameCard}>
                    {game.imageUrl ? (
                      <Image source={{ uri: game.imageUrl }} style={styles.gameImage} />
                    ) : (
                      <View style={[styles.gameImage, styles.gameImagePlaceholder]}>
                        <Ionicons name="game-controller" size={36} color="#C4A0FF" />
                      </View>
                    )}
                    <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          <View style={[styles.activitiesSection, styles.centerSection]}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            {recentActivities.length === 0 ? (
              <View style={styles.emptyActivities}>
                <Text style={styles.emptyText}>Sem atividades recentes</Text>
                <TouchableOpacity onPress={() => goToEdit('activities')} activeOpacity={0.7}>
                  <Text style={styles.registerHere}>Registrar aqui</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentActivities.map((activity) => {
                const date = new Date(activity.timestamp);
                const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return (
                  <View key={activity.id || activity.timestamp} style={styles.activityCard}>
                    {activity.gameImageUrl ? (
                      <Image source={{ uri: activity.gameImageUrl }} style={styles.activityImage} />
                    ) : (
                      <View style={styles.activityPlaceholder}>
                        <Ionicons name="game-controller" size={32} color="#C4A0FF" />
                      </View>
                    )}
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityGameTitle} numberOfLines={1}>{activity.gameTitle}</Text>
                      <Text style={styles.activityAction}>{activity.action}</Text>
                      <Text style={styles.activityDate}>{formattedDate}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerButtonsContainer}>
              <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('EditarPerfil', { usuario })} activeOpacity={0.7}>
                <Ionicons name="settings-outline" size={20} color="#A67FEB" style={{ marginRight: 6 }} />
                <Text style={styles.footerButtonText}>Editar Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerButton} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 6 }} />
                <Text style={[styles.footerButtonText, { color: '#FF6B6B' }]}>Sair</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.footerCopyright}>© 2025 GameFinder Studios</Text>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A002D',
  },
  generalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 0, 39, 0.7)',
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    height: 95,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    zIndex: 2,
    flexDirection: 'row',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5E6FF',
    textShadowColor: 'rgba(162, 89, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 63,
    left: 20,
    backgroundColor: 'rgba(43, 15, 79, 0.7)',
    borderRadius: 20,
    padding: 8,
    zIndex: 3,
  },
  editButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(43, 15, 79, 0.7)',
    borderRadius: 20,
    padding: 6,
    zIndex: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A002D',
  },
  loadingText: {
    color: '#E2D1FF',
    marginTop: 20,
    fontSize: 16,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1A002D',
  },
  emptyStateText: {
    color: '#F5E6FF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#9B5CFF',
    width: '100%',
    padding: 15,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    minHeight: 400,
    justifyContent: 'flex-end',
    shadowColor: '#C18CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#A259FF',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 0, 39, 0.6)',
  },
  cardContent: {
    padding: 25,
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 300,
  },
  profileCardNoBanner: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    backgroundColor: '#3B1169',
    minHeight: 260,
    justifyContent: 'flex-end',
    shadowColor: 'C18CFF',
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
    marginBottom: 30,
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
    color: '#C4A0FF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  preferencesSection: {
    backgroundColor: '#2A0B4A',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  emptySectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  tagItem: {
    backgroundColor: '#4A1C7A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A927F5',
    margin: 2,
  },
  tagText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#F5E6FF',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#C4A0FF',
    fontSize: 14,
    textAlign: 'center',
  },
  registerHere: {
    color: '#9B5CFF',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  favoritesSection: {
    backgroundColor: '#2A0B4A',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  emptyFavorites: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    width: '100%',
  },
  emptyFavoritesText: {
    color: '#C4A0FF',
    fontSize: 14,
    textAlign: 'center',
  },
  gameCard: {
    width: 120,
    marginRight: 15,
    alignItems: 'center',
  },
  gameImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  gameImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTitle: {
    color: '#F5E6FF',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  activitiesSection: {
    backgroundColor: '#2A0B4A',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#3B1169',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#C18CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  activityImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#000',
  },
  activityPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#532E88',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  activityGameTitle: {
    color: '#F5E6FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityAction: {
    color: '#C4A0FF',
    fontSize: 14,
    marginTop: 2,
  },
  activityDate: {
    color: '#9B5CFF',
    fontSize: 12,
    marginTop: 4,
  },
  emptyActivities: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  footerButtonText: {
    fontSize: 16,
    color: '#A67FEB',
    fontWeight: '600',
  },
  footerCopyright: {
    color: '#A67FEB',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 20,
  },
  centerSection: {
    alignItems: 'center',
  },
});