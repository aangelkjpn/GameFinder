import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TextInput, TouchableOpacity, Modal, Dimensions, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PLATAFORMAS_DISPONIVEIS = [
  'pc',
  'xbox one',
  'xbox 360',
  'ps4',
  'ps5',
  'nintendo switch',
  'mobile',
];

const JogosTela = () => {
  const [jogos, setJogos] = useState([]);
  const [jogosFiltrados, setJogosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [jogoSelecionado, setJogoSelecionado] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalFiltroVisivel, setModalFiltroVisivel] = useState(false);
  
  const [filtroAtual, setFiltroAtual] = useState('Filtrar');
  const [filtroPlataforma, setFiltroPlataforma] = useState('todos');
  
  const jogosPorPagina = 10;

  const formatarData = (dataString) => {
    if (!dataString) return 'Data não informada';
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return 'Data inválida';
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const filtrarEOrdenarJogos = (jogosBase, filtroDeData, filtroDePlataforma, termoBuscaAtual) => {
      let jogosResultantes = [...jogosBase];
      const termo = termoBuscaAtual.toLowerCase().trim();

      if (termo) {
          jogosResultantes = jogosResultantes.filter(jogo =>
              jogo.nome.toLowerCase().includes(termo) ||
              jogo.genero.toLowerCase().includes(termo) ||
              jogo.plataforma.toLowerCase().includes(termo) ||
              jogo.desenvolvedor.toLowerCase().includes(termo)
          );
      }

      if (filtroDePlataforma !== 'todos') {
          const plataformaTermo = filtroDePlataforma.toLowerCase();
          jogosResultantes = jogosResultantes.filter(jogo => 
              jogo.plataforma.toLowerCase().includes(plataformaTermo)
          );
      }

      switch (filtroDeData) {
          case 'novos':
              jogosResultantes.sort((a, b) => {
                  const dataA = new Date(a.dataLancamento);
                  const dataB = new Date(b.dataLancamento);
                  return dataB - dataA;
              });
              break;

          case 'antigos':
              jogosResultantes.sort((a, b) => {
                  const dataA = new Date(a.dataLancamento);
                  const dataB = new Date(b.dataLancamento);
                  return dataA - dataB;
              });
              break;

          case 'lancamento':
              const hoje = new Date();
              jogosResultantes = jogosResultantes.filter(jogo => {
                  const dataLancamento = new Date(jogo.dataLancamento);
                  return dataLancamento > hoje;
              }).sort((a, b) => {
                  const dataA = new Date(a.dataLancamento);
                  const dataB = new Date(b.dataLancamento);
                  return dataA - dataB;
              });
              break;

          default:
              break;
      }

      return jogosResultantes;
  };
  
  const aplicarFiltroCompleto = (tipoFiltro, plataformaFiltro) => {
      const novoFiltroData = tipoFiltro !== undefined ? tipoFiltro : filtroAtual;
      const novoFiltroPlataforma = plataformaFiltro !== undefined ? plataformaFiltro : filtroPlataforma;

      setFiltroAtual(novoFiltroData);
      setFiltroPlataforma(novoFiltroPlataforma);
      setModalFiltroVisivel(false);

      const jogosResultantes = filtrarEOrdenarJogos(jogos, novoFiltroData, novoFiltroPlataforma, termoBusca);

      setJogosFiltrados(jogosResultantes);
      setPaginaAtual(1);
  };

  const aplicarFiltroOrdenacao = (tipoFiltro) => {
      aplicarFiltroCompleto(tipoFiltro, filtroPlataforma);
  };
  
  const aplicarFiltroPlataforma = (plataforma) => {
      aplicarFiltroCompleto(filtroAtual, plataforma);
  };

  const removerFiltros = () => {
    aplicarFiltroCompleto('Filtrar', 'todos');
    setTermoBusca('');
  };

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        const resposta = await axios.get(`${API_URL}/jogos`);
        const jogosFormatados = resposta.data.map(jogo => ({
          id: jogo.id || Math.random().toString(36).substring(7),
          nome: jogo.titulo || jogo.título || jogo.title || 'Nome não disponível',
          genero: jogo.genero || jogo.genre || 'Gênero não informado',
          plataforma: (jogo.plataforma || jogo.platform || 'Plataforma não informada').toLowerCase(), 
          imagem: jogo.imagem || jogo.imagem_url || jogo.image || 'https://via.placeholder.com/200?text=Sem+Imagem',
          requisitos: jogo.requisitos || jogo.requirements || 'Requisitos não disponíveis',
          desenvolvedor: jogo.desenvolvedor || jogo.developer || 'Desenvolvedor não informado',
          resumo: jogo.resumo || jogo.summary || 'Resumo não disponível',
          dataLancamento: jogo.data_lancamento || jogo.release_date || 'Data não informada'
        }));

        setJogos(jogosFormatados);
        setJogosFiltrados(jogosFormatados);
      } catch (erro) {
        console.error('Erro ao carregar jogos:', erro.message);
        setJogos([]);
        setJogosFiltrados([]);
      } finally {
        setCarregando(false);
      }
    };
    carregarJogos();
  }, []);

  useEffect(() => {
    const jogosResultantes = filtrarEOrdenarJogos(jogos, filtroAtual, filtroPlataforma, termoBusca);
    setJogosFiltrados(jogosResultantes);
    setPaginaAtual(1);
  }, [termoBusca, jogos, filtroAtual, filtroPlataforma]);

  const totalPaginas = Math.ceil(jogosFiltrados.length / jogosPorPagina);
  const inicio = (paginaAtual - 1) * jogosPorPagina;
  const fim = inicio + jogosPorPagina;
  const jogosPaginaAtual = jogosFiltrados.slice(inicio, fim);

  const irParaPagina = (pagina) => {
    if (pagina > 0 && pagina <= totalPaginas) {
      setPaginaAtual(pagina);
    }
  };

  const abrirModal = (jogo) => setJogoSelecionado(jogo);
  const fecharModal = () => setJogoSelecionado(null);

  const isFiltroAtivo = filtroAtual !== 'Filtrar' || filtroPlataforma !== 'todos';
  
  const obterTextoFiltro = () => {
      let partes = [];

      switch (filtroAtual) {
          case 'novos': partes.push('Novos'); break;
          case 'antigos': partes.push('Antigos'); break;
          case 'lancamento': partes.push('A Lançar'); break;
          default: break;
      }
      
      if (filtroPlataforma !== 'todos') {
          const plataformaNome = filtroPlataforma
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .replace('Nintendo Switch', 'Switch')
              .replace('Pc', 'PC');
              
          partes.push(plataformaNome);
      }

      return partes.length > 0 ? partes.join(' + ') : 'Filtrar';
  };
  
  const getPlatformIcon = (plataforma) => {
    if (plataforma.includes('xbox')) return 'logo-xbox';
    if (plataforma.includes('ps')) return 'logo-playstation';
    if (plataforma.includes('pc')) return 'desktop-outline';
    if (plataforma.includes('nintendo')) return 'game-controller-outline';
    if (plataforma.includes('mobile')) return 'phone-portrait-outline';
    return 'grid-outline';
  };

  const renderizarItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => abrirModal(item)}>
      <View style={styles.imagemContainer}>
        <Image source={{ uri: item.imagem }} style={styles.imagem} onError={() => setJogos(jogos.map(j => j.id === item.id ? { ...j, imagem: 'https://via.placeholder.com/200?text=Sem+Imagem' } : j))} />
      </View>
      <Text style={styles.nome} numberOfLines={1}>{item.nome}</Text>
    </TouchableOpacity>
  );

  if (carregando) {
    return (
      <View style={[styles.container, styles.carregandoContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#1A0033" />
        <ActivityIndicator size="large" color="#A259FF" />
        <Text style={styles.textoCarregando}>Carregando jogos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0033" />
      <View style={styles.header}>
        <Text style={styles.titulo}>🎮 Catálogo de Jogos</Text>
        <Text style={styles.subtitulo}>Explore e descubra novos títulos</Text>
      </View>

      <View style={styles.controlesContainer}>
        {/* Barra de Busca */}
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={20} color="#FFF" style={styles.iconeBusca} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar jogos..."
            placeholderTextColor="#fff"
            value={termoBusca}
            onChangeText={setTermoBusca}
          />
        </View>

        {/* Botão de Filtro */}
        <TouchableOpacity 
          style={[styles.botaoFiltro, isFiltroAtivo && styles.botaoFiltroAtivo]} 
          onPress={() => setModalFiltroVisivel(true)}
        >
          <Ionicons name="filter" size={20} color={isFiltroAtivo ? '#FFFFFF' : '#FFF'} />
          <Text style={[styles.textoBotaoFiltro, isFiltroAtivo && styles.textoBotaoFiltroAtivo]}>
            {obterTextoFiltro()}
          </Text>
          {isFiltroAtivo && (
            <TouchableOpacity 
              style={styles.botaoRemoverFiltro}
              onPress={(e) => {
                e.stopPropagation();
                removerFiltros();
              }}
            >
              <Ionicons name="close-circle" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Indicador de filtro ativo */}
      {isFiltroAtivo && (
        <View style={styles.indicadorFiltro}>
          <Text style={styles.textoIndicadorFiltro}>
            Filtro ativo: {obterTextoFiltro()}
          </Text>
          <TouchableOpacity onPress={removerFiltros}>
            <Text style={styles.botaoRemoverFiltroTexto}>Remover tudo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Jogos */}
      {jogosFiltrados.length > 0 ? (
        <>
          <FlatList
            data={jogosPaginaAtual}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderizarItem}
            contentContainerStyle={styles.lista}
            numColumns={2}
            columnWrapperStyle={styles.colunaWrapper}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.paginacao}>
            <TouchableOpacity style={[styles.botaoPagina, paginaAtual === 1 && styles.botaoPaginaDesabilitado]} onPress={() => irParaPagina(paginaAtual - 1)} disabled={paginaAtual === 1}>
              <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.textoPagina}>
              Página {paginaAtual} de {totalPaginas}
            </Text>
            <TouchableOpacity style={[styles.botaoPagina, paginaAtual === totalPaginas && styles.botaoPaginaDesabilitado]} onPress={() => irParaPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>
              <Ionicons name="arrow-forward-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum jogo encontrado</Text>
          <Text style={styles.emptySubtext}>
            {isFiltroAtivo 
              ? `Tente remover o filtro "${obterTextoFiltro()}" ou fazer uma busca diferente.`
              : 'Tente uma busca diferente ou verifique a conexão.'
            }
          </Text>
          {isFiltroAtivo && (
            <TouchableOpacity style={styles.botaoRemoverFiltroEmpty} onPress={removerFiltros}>
              <Text style={styles.botaoRemoverFiltroEmptyTexto}>Remover filtro</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal de Filtro (Ordenação e Plataforma) */}
      <Modal
        visible={modalFiltroVisivel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalFiltroVisivel(false)}
      >
        <View style={styles.modalFiltroOverlay}>
          <View style={styles.modalFiltroContainer}>
            <ScrollView>
                <Text style={styles.modalFiltroTitulo}>Ordenar por Data</Text>
                
                {/* Opções de ORDENAÇÃO */}
                <TouchableOpacity 
                    style={[styles.opcaoFiltro, filtroAtual === 'Filtrar' && styles.opcaoFiltroSelecionada]}
                    onPress={() => aplicarFiltroOrdenacao('Filtrar')}
                >
                    <Ionicons name="list" size={20} color={filtroAtual === 'Filtrar' ? '#A259FF' : '#BBBBBB'} />
                    <Text style={[styles.textoOpcaoFiltro, filtroAtual === 'Filtrar' && styles.textoOpcaoFiltroSelecionado]}>
                        Padrão / Sem Ordenação
                    </Text>
                    {filtroAtual === 'Filtrar' && <Ionicons name="checkmark" size={20} color="#A259FF" />}
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.opcaoFiltro, filtroAtual === 'novos' && styles.opcaoFiltroSelecionada]}
                    onPress={() => aplicarFiltroOrdenacao('novos')}
                >
                    <Ionicons name="arrow-down" size={20} color={filtroAtual === 'novos' ? '#A259FF' : '#BBBBBB'} />
                    <Text style={[styles.textoOpcaoFiltro, filtroAtual === 'novos' && styles.textoOpcaoFiltroSelecionado]}>
                        Mais Novos
                    </Text>
                    {filtroAtual === 'novos' && <Ionicons name="checkmark" size={20} color="#A259FF" />}
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.opcaoFiltro, filtroAtual === 'antigos' && styles.opcaoFiltroSelecionada]}
                    onPress={() => aplicarFiltroOrdenacao('antigos')}
                >
                    <Ionicons name="arrow-up" size={20} color={filtroAtual === 'antigos' ? '#A259FF' : '#BBBBBB'} />
                    <Text style={[styles.textoOpcaoFiltro, filtroAtual === 'antigos' && styles.textoOpcaoFiltroSelecionado]}>
                        Mais Antigos
                    </Text>
                    {filtroAtual === 'antigos' && <Ionicons name="checkmark" size={20} color="#A259FF" />}
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.opcaoFiltro, filtroAtual === 'lancamento' && styles.opcaoFiltroSelecionada]}
                    onPress={() => aplicarFiltroOrdenacao('lancamento')}
                >
                    <Ionicons name="calendar" size={20} color={filtroAtual === 'lancamento' ? '#A259FF' : '#BBBBBB'} />
                    <Text style={[styles.textoOpcaoFiltro, filtroAtual === 'lancamento' && styles.textoOpcaoFiltroSelecionado]}>
                        A Lançar
                    </Text>
                    {filtroAtual === 'lancamento' && <Ionicons name="checkmark" size={20} color="#A259FF" />}
                </TouchableOpacity>

                {/* Filtro por Plataforma */}
                <View style={styles.separador} />
                <Text style={styles.modalFiltroTitulo}>Filtrar por Plataforma</Text>

                <TouchableOpacity 
                    style={[styles.opcaoFiltro, filtroPlataforma === 'todos' && styles.opcaoFiltroSelecionada]}
                    onPress={() => aplicarFiltroPlataforma('todos')}
                >
                    <Ionicons name="globe-outline" size={20} color={filtroPlataforma === 'todos' ? '#A259FF' : '#BBBBBB'} />
                    <Text style={[styles.textoOpcaoFiltro, filtroPlataforma === 'todos' && styles.textoOpcaoFiltroSelecionado]}>
                        Todas as Plataformas
                    </Text>
                    {filtroPlataforma === 'todos' && <Ionicons name="checkmark" size={20} color="#A259FF" />}
                </TouchableOpacity>
                
                {PLATAFORMAS_DISPONIVEIS.map((plataforma) => (
                    <TouchableOpacity 
                        key={plataforma}
                        style={[styles.opcaoFiltro, filtroPlataforma === plataforma && styles.opcaoFiltroSelecionada]}
                        onPress={() => aplicarFiltroPlataforma(plataforma)}
                    >
                        <Ionicons 
                            name={getPlatformIcon(plataforma)}
                            size={20} 
                            color={filtroPlataforma === plataforma ? '#A259FF' : '#BBBBBB'} 
                        />
                        <Text style={[styles.textoOpcaoFiltro, filtroPlataforma === plataforma && styles.textoOpcaoFiltroSelecionado]}>
                            {plataforma.toUpperCase().replace('NINTENDO SWITCH', 'NINTENDO Switch')}
                        </Text>
                        {filtroPlataforma === plataforma && <Ionicons name="checkmark" size={20} color="#A259FF" />}
                    </TouchableOpacity>
                ))}

                <TouchableOpacity 
                    style={styles.botaoFecharFiltro}
                    onPress={() => setModalFiltroVisivel(false)}
                >
                    <Text style={styles.textoBotaoFecharFiltro}>Fechar</Text>
                </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Detalhes do Jogo (mantido) */}
      <Modal visible={!!jogoSelecionado} animationType="slide" transparent={false} onRequestClose={fecharModal}>
        {jogoSelecionado && (
          <ScrollView style={styles.modalContainer}>
            <TouchableOpacity style={styles.botaoFechar} onPress={fecharModal}>
              <Ionicons name="close-circle-outline" size={30} color="#BBBBBB" />
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>{jogoSelecionado.nome}</Text>
            <Image
              source={{ uri: jogoSelecionado.imagem }}
              style={styles.modalImagem}
              resizeMode="cover"
              onError={() => setJogoSelecionado({ ...jogoSelecionado, imagem: 'https://via.placeholder.com/200?text=Sem+Imagem' })}
            />
            <View style={styles.modalInfoContainer}>
              <View style={styles.infoItem}>
                <Ionicons name="game-controller-outline" size={18} color="#A259FF" style={styles.iconeInfo} />
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Gênero: </Text>{jogoSelecionado.genero}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="desktop-outline" size={18} color="#A259FF" style={styles.iconeInfo} />
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Plataforma: </Text>{jogoSelecionado.plataforma.toUpperCase()}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="business-outline" size={18} color="#A259FF" style={styles.iconeInfo} />
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Desenvolvedor: </Text>{jogoSelecionado.desenvolvedor}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={18} color="#A259FF" style={styles.iconeInfo} />
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Lançamento: </Text>{formatarData(jogoSelecionado.dataLancamento)}</Text>
              </View>
            </View>
            <View style={styles.modalDescricaoContainer}>
              <Text style={styles.descricaoTitulo}>Resumo</Text>
              <Text style={styles.descricaoTexto}>{jogoSelecionado.resumo}</Text>
              <Text style={styles.descricaoTitulo}>Requisitos</Text>
              <Text style={styles.descricaoTexto}>{jogoSelecionado.requisitos}</Text>
            </View>
          </ScrollView>
        )}
      </Modal>
    </View>
  );
};

const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#1A0033',
  },
  carregandoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  textoCarregando: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    marginTop: 64,
    marginBottom: 24,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitulo: {
    fontSize: 16,
    color: '#BBBBBB',
    marginTop: 5,
  },
  controlesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  buscaContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A0A50',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  iconeBusca: {
    marginRight: 10,
    color: '#FFF',
  },
  buscaInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#FFF',
  },
  botaoFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A259FF',
    paddingHorizontal: 14,
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    position: 'relative',
  },
  botaoFiltroAtivo: {
    backgroundColor: '#A259FF',
  },
  textoBotaoFiltro: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  textoBotaoFiltroAtivo: {
    color: '#FFFFFF',
  },
  botaoRemoverFiltro: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicadorFiltro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(162, 89, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  textoIndicadorFiltro: {
    color: '#A259FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  botaoRemoverFiltroTexto: {
    color: '#FF4757',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lista: {
    paddingBottom: 20,
  },
  colunaWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#2A0A50',
    borderRadius: 12,
    width: cardWidth,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#A259FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 6,
  },
  imagemContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 10,
  },
  imagem: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  nome: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  paginacao: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#3A1A6A',
  },
  botaoPagina: {
    backgroundColor: '#A259FF',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 15,
  },
  botaoPaginaDesabilitado: {
    backgroundColor: '#3A1A6A',
    opacity: 0.7,
  },
  textoPagina: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  botaoRemoverFiltroEmpty: {
    backgroundColor: '#A259FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  botaoRemoverFiltroEmptyTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalFiltroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalFiltroContainer: {
    backgroundColor: '#2A0A50',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.7, 
  },
  modalFiltroTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  separador: {
      borderBottomColor: '#3A1A6A',
      borderBottomWidth: 1,
      marginVertical: 15,
  },
  opcaoFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  opcaoFiltroSelecionada: {
    backgroundColor: 'rgba(162, 89, 255, 0.2)',
  },
  textoOpcaoFiltro: {
    flex: 1,
    color: '#BBBBBB',
    fontSize: 16,
    marginLeft: 10,
  },
  textoOpcaoFiltroSelecionado: {
    color: '#A259FF',
    fontWeight: 'bold',
  },
  botaoFecharFiltro: {
    backgroundColor: '#A259FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  textoBotaoFecharFiltro: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A0033',
    padding: 20,
  },
  botaoFechar: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalImagem: {
    width: '100%',
    height: width * 0.9,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalInfoContainer: {
    backgroundColor: 'rgba(58, 26, 106, 0.5)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconeInfo: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#EEEEEE',
    flex: 1,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#C4A0FF',
  },
  modalDescricaoContainer: {
    backgroundColor: 'rgba(58, 26, 106, 0.5)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 50,
  },
  descricaoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C4A0FF',
    marginBottom: 10,
    textAlign: 'center',
  },
  descricaoTexto: {
    fontSize: 14,
    color: '#EEEEEE',
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: 'bold',
  },
});

export default JogosTela;