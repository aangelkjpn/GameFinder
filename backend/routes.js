const express = require('express');
const router = express.Router();
const db = require('./db');
const crypto = require('crypto');

function gerarHash(senha) {
  return crypto.createHash('sha256').update(senha).digest('hex');
}

function formatTags(tags) {
  if (Array.isArray(tags)) return tags.join(',');
  return tags || '';
}

// --- Verifica se email ja existe ---
router.post('/check-email', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email é obrigatório' });
  }

  const query = 'SELECT id FROM cadastro WHERE email = ?';

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Erro ao verificar email:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    res.json({ exists: results.length > 0 });
  });
});

// --- ROTAS DE AUTENTICAÇÃO ---
router.post('/register', (req, res) => {
  const { usuario, email, senha } = req.body;

  if (!usuario || !email || !senha) {
    return res.status(400).json({ message: 'Preencha todos os campos!' });
  }

  const checkQuery = 'SELECT id FROM cadastro WHERE email = ?';

  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error('Erro ao verificar email:', err);
      return res.status(500).json({ message: 'Erro no servidor' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado!' });
    }

    const senhaHash = gerarHash(senha);
    const insertQuery = 'INSERT INTO cadastro (usuario, email, senha) VALUES (?, ?, ?)';

    db.query(insertQuery, [usuario, email, senhaHash], (err, results) => {
      if (err) {
        console.error('Erro ao registrar:', err);
        return res.status(500).json({ message: 'Erro no servidor' });
      }
      res.status(200).json({ message: 'Usuário registrado com sucesso!' });
    });
  });
});


router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  const senhaHash = gerarHash(senha);
  const query = 'SELECT * FROM cadastro WHERE email = ? AND senha = ?';

  db.query(query, [email, senhaHash], (err, results) => {
    if (err) {
      console.error('Erro na query:', err);
      return res.status(500).json({ message: 'Erro no servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Email ou senha inválidos!' });
    }

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      user: results[0]
    });
  });
});

router.get('/usuario/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório' });
  }

  const query = `
    SELECT 
      c.id, 
      c.email, 
      c.usuario,
      p.nome,
      p.bio,
      p.avatar_url,
      p.banner_url,
      p.pronouns,
      p.links,
      p.preferences,
      p.favorites,
      p.activities,
      p.followers_count,
      p.status
    FROM cadastro c
    LEFT JOIN perfis p ON c.id = p.usuario_id
    WHERE c.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const userData = results[0];
    if (!userData.nome) {
      userData.nome = userData.usuario;
    }

    res.status(200).json(userData);
  });
});

// --- ROTA PARA ATUALIZAR PERFIL DO USUÁRIO ---
router.put('/usuario/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, bio, avatar_url, banner_url, pronouns, links, preferences, favorites, activities } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório' });
  }

  const checkProfileQuery = 'SELECT * FROM perfis WHERE usuario_id = ?';

  db.query(checkProfileQuery, [id], (err, results) => {
    if (err) {
      console.error('Erro ao verificar perfil:', err);
      return res.status(500).json({ message: 'Erro ao verificar perfil' });
    }

    if (results.length === 0) {
      const insertQuery = `
        INSERT INTO perfis 
        (usuario_id, nome, email, bio, avatar_url, banner_url, pronouns, links, preferences, favorites, activities)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        id, nome || null, email || null, bio || null, avatar_url || null,
        banner_url || null, pronouns || null, links || null,
        preferences || null, favorites || null, activities || null
      ];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error('Erro ao criar perfil:', err);
          return res.status(500).json({ message: 'Erro ao criar perfil' });
        }
        res.status(200).json({ message: 'Perfil criado com sucesso!' });
      });
    } else {
      const updateQuery = `
        UPDATE perfis 
        SET nome = ?, email = ?, bio = ?, avatar_url = ?, banner_url = ?, pronouns = ?, 
            links = ?, preferences = ?, favorites = ?, activities = ?, data_atualizacao = CURRENT_TIMESTAMP
        WHERE usuario_id = ?
      `;

      const values = [
        nome || null, email || null, bio || null, avatar_url || null,
        banner_url || null, pronouns || null, links || null,
        preferences || null, favorites || null, activities || null, id
      ];

      db.query(updateQuery, values, (err, result) => {
        if (err) {
          console.error('Erro ao atualizar perfil:', err);
          return res.status(500).json({ message: 'Erro ao atualizar perfil' });
        }
        res.status(200).json({ message: 'Perfil atualizado com sucesso!' });
      });
    }
  });
});

// --- ROTAS DE JOGOS ---
router.get('/jogos', (req, res) => {
  const query = 'SELECT * FROM jogos  ORDER BY RAND()';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar jogos:', err);
      return res.status(500).json({ message: 'Erro ao buscar jogos' });
    }
    res.status(200).json(results);
  });
});

// --- ROTAS DE AVALIAÇÕES ---
router.post('/salvar-avaliacao', (req, res) => {
  const { usuario_id, jogo_nome, nota, comentario, tags } = req.body;

  if (!usuario_id || !jogo_nome || !nota) {
    return res.status(400).json({ message: 'Dados incompletos' });
  }

  const safeComment = comentario || '';
  const safeTags = formatTags(tags);

  // Verifica se o jogo existe
  const findGameQuery = 'SELECT id FROM jogos WHERE titulo = ?';
  db.query(findGameQuery, [jogo_nome], (err, gameResults) => {
    if (err) {
      console.error('Erro ao buscar jogo:', err);
      return res.status(500).json({ message: 'Erro ao buscar jogo' });
    }

    const handleSaveReview = (jogo_id) => {
      const insertQuery = `
        INSERT INTO avaliacoes (usuario_id, jogo_id, nota, comentario, tags)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [usuario_id, jogo_id, nota, safeComment, safeTags], (err, result) => {
        if (err) {
          console.error('Erro ao salvar avaliação:', err);
          return res.status(500).json({ message: 'Erro ao salvar avaliação' });
        }
        res.status(200).json({ id: result.insertId });
      });
    };

    if (gameResults.length === 0) {
      const insertGameQuery = 'INSERT INTO jogos (titulo) VALUES (?)';
      db.query(insertGameQuery, [jogo_nome], (err, insertResult) => {
        if (err) {
          console.error('Erro ao criar jogo:', err);
          return res.status(500).json({ message: 'Erro ao criar jogo' });
        }
        handleSaveReview(insertResult.insertId);
      });
    } else {
      handleSaveReview(gameResults[0].id);
    }
  });
});

router.get('/avaliacoes', (req, res) => {
  const query = `
    SELECT 
      a.id, 
      a.nota, 
      COALESCE(a.comentario, '') AS comentario,
      COALESCE(a.tags, '') AS tags,
      a.data_criacao,
      j.titulo AS nome_jogo,
      c.usuario AS nome_usuario,
      c.id AS usuario_id
    FROM avaliacoes a
    JOIN jogos j ON a.jogo_id = j.id
    JOIN cadastro c ON a.usuario_id = c.id
    ORDER BY a.data_criacao DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar avaliações:', err);
      return res.status(500).json({ message: 'Erro ao buscar avaliações' });
    }

    const formattedResults = results.map(av => ({
      ...av,
      tags: av.tags ? av.tags.split(',').filter(tag => tag.trim() !== '') : []
    }));

    res.status(200).json(formattedResults);
  });
});

router.put('/avaliacoes/:id', (req, res) => {
  const { id } = req.params;
  const { usuario_id, jogo_nome, nota, comentario, tags } = req.body;

  if (!usuario_id || !jogo_nome || !nota) {
    return res.status(400).json({ message: 'Dados incompletos' });
  }

  const safeComment = comentario || '';
  const safeTags = formatTags(tags);

  const findGameQuery = 'SELECT id FROM jogos WHERE titulo = ?';
  db.query(findGameQuery, [jogo_nome], (err, gameResults) => {
    if (err) {
      console.error('Erro ao buscar jogo:', err);
      return res.status(500).json({ message: 'Erro ao buscar jogo' });
    }

    const handleUpdateReview = (jogo_id) => {
      const updateQuery = `
        UPDATE avaliacoes 
        SET 
          jogo_id = ?,
          nota = ?,
          comentario = ?,
          tags = ?,
          data_atualizacao = CURRENT_TIMESTAMP
        WHERE id = ? AND usuario_id = ?
      `;
      db.query(updateQuery, [jogo_id, nota, safeComment, safeTags, id, usuario_id], (err, result) => {
        if (err) {
          console.error('Erro ao atualizar avaliação:', err);
          return res.status(500).json({ message: 'Erro ao atualizar avaliação' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Avaliação não encontrada ou usuário não autorizado' });
        }

        res.status(200).json({ success: true });
      });
    };

    if (gameResults.length === 0) {
      const insertGameQuery = 'INSERT INTO jogos (titulo) VALUES (?)';
      db.query(insertGameQuery, [jogo_nome], (err, insertResult) => {
        if (err) {
          console.error('Erro ao criar jogo:', err);
          return res.status(500).json({ message: 'Erro ao criar jogo' });
        }
        handleUpdateReview(insertResult.insertId);
      });
    } else {
      handleUpdateReview(gameResults[0].id);
    }
  });
});

router.delete('/avaliacoes/:id', (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório' });
  }

  const deleteQuery = 'DELETE FROM avaliacoes WHERE id = ? AND usuario_id = ?';
  db.query(deleteQuery, [id, usuario_id], (err, result) => {
    if (err) {
      console.error('Erro ao deletar avaliação:', err);
      return res.status(500).json({ message: 'Erro ao deletar avaliação' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Avaliação não encontrada ou usuário não autorizado' });
    }

    res.status(200).json({ success: true });
  });
});

module.exports = router;