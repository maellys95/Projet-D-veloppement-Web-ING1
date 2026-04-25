require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const app = express();
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'cytech0001',
  database: 'smart_campus'
});

db.connect(err => {
  if (err) {
    console.error('❌ Erreur connexion MySQL :', err);
  } else {
    console.log('✅ Connecté à MySQL');
  }
});

// ── Middleware
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', // Ajoute ce port
    process.env.FRONTEND_URL
  ].filter(Boolean), 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes
//app.use('/api', require('./routes/index'));

// ── Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Test DB
app.get('/test-db', (_req, res) => {
  db.query('SELECT 1 AS test', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Connexion OK', results });
  });
});
// ── USERS 
app.get('/users', (req, res) => {
  db.query('SELECT id, pseudo, email, first_name, last_name FROM users', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// ── USER BY ID 
app.get('/users/:id', (req, res) => {
  const id = req.params.id;

  db.query('SELECT id, pseudo, email FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(results[0]); //  important
  });
});


// ── LOGIN 
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      res.json({
        message: 'Connexion réussie',
        user: {
          id: user.id,
          pseudo: user.pseudo,
          email: user.email
        }
      });
    }
  );
});



// Route pour l'inscription
app.post('/register', async (req, res) => {
  const { pseudo, email, password, first_name, last_name, member_type } = req.body;

  try {
    // On crypte le mot de passe avant de l'envoyer en base SQL
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `INSERT INTO users (pseudo, email, password_hash, first_name, last_name, member_type, is_approved) 
                   VALUES (?, ?, ?, ?, ?, ?, 0)`;

    db.query(query, [pseudo, email, hashedPassword, first_name, last_name, member_type], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Utilisateur créé avec succès !' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du traitement.' });
  }
});

// ── ROUTE POUR RECUPERER LES SALLES
app.get('/rooms', (req, res) => {
  const sql = 'SELECT * FROM rooms'; // Tu récupères toutes les salles de la table rooms

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur rooms:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    res.json(results); // Envoie les résultats sous forme de JSON
  });
});

// ── ROUTE POUR RECUPERER LES OBJETS CONNECTES
app.get('/devices', (req, res) => {
  const sql = `
    SELECT 
      d.id,
      d.uid,
      d.name,
      d.status,
      r.name AS room_name,
      c.name AS category_name
    FROM devices d
    LEFT JOIN rooms r ON d.room_id = r.id
    LEFT JOIN device_categories c ON d.category_id = c.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur devices :', err);
      return res.status(500).json({ message: 'Erreur devices' });
    }

    res.json(results); // Retourne les résultats des objets connectés et les salles associées
  });
});


app.get('/rooms/:id', (req, res) => {
  const roomId = req.params.id;

  const sql = `
    SELECT 
      r.id,
      r.name,
      r.building,
      r.floor,
      r.capacity,
      r.description,
      d.id AS device_id,
      d.name AS device_name,
      d.status AS device_status,
      c.name AS category_name
    FROM rooms r
    LEFT JOIN devices d ON d.room_id = r.id
    LEFT JOIN device_categories c ON d.category_id = c.id
    WHERE r.id = ?
  `;

  db.query(sql, [roomId], (err, results) => {
    if (err) {
      console.error('Erreur pour récupérer les détails de la salle :', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }

    res.json(results);  // Renvoie la salle et les objets associés
  });
});

// ── ROUTE POUR RÉCUPÉRER LES ÉVÉNEMENTS

app.get('/events', (req, res) => {
  // On utilise event_date car c'est le nom dans ton fichier/base
  const sql = 'SELECT id, title, description, location, event_date, category FROM events ORDER BY event_date ASC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL détaillée :', err); // Regarde ton terminal Node pour voir l'erreur précise
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// ── ROUTE POUR RÉCUPÉRER LES ACTUALITÉS
app.get('/news', (req, res) => {
  // On filtre par 'published = 1' pour ne montrer que ce qui est prêt
  const sql = 'SELECT id, title, content, category, image_url, created_at FROM news WHERE published = 1 ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL News :', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// ── HEALTH CHECK
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── 404
app.use((_req, res) => res.status(404).json({ message: 'Route introuvable.' }));

// ── Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Smart Campus API running on http://localhost:${PORT}`);
});