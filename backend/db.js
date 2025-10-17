const mysql = require('mysql2');
 
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gamefinder'
});
 
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no banco de dados:', err.stack);
    return;
  }
  console.log('Conectado ao banco de dados com sucesso!');
});
 
module.exports = db;