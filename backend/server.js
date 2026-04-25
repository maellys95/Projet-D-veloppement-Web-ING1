const transporter = require('./mailer');
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

      if (!user.is_verified) {
        return res.status(403).json({
          message: 'Tu dois confirmer ton email avant de te connecter.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

res.json({
  message: 'Connexion réussie',
  user: {
    id: user.id,
    pseudo: user.pseudo,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    member_type: user.member_type,
    points: user.points,
    is_verified: user.is_verified,
    is_approved: user.is_approved // Important pour savoir s'il peut agir
  }
});
    }
  );
});



app.post('/register', async (req, res) => {
  // On récupère TOUS les champs nécessaires pour ta table SQL
  const { pseudo, email, password, first_name, last_name, member_type } = req.body;

  // --- VERIFICATION SERVEUR (Double sécurité) ---
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
  }

  // Regex pour n'accepter que des lettres (comme dans ton projet PHP)
  const nameRegex = /^[A-Za-zÀ-ÿ\s\-']+$/;
  if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
    return res.status(400).json({ message: 'Le nom et le prénom ne doivent contenir que des lettres.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const query = `
      INSERT INTO users 
      (pseudo, email, password_hash, first_name, last_name, member_type, is_verified, verify_token, verify_token_expires, is_approved, points) 
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 0)
    `;

    db.query(
      query,
      [pseudo, email, hashedPassword, first_name, last_name, member_type, verificationToken, verificationExpires],
      async (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Cet email ou pseudo est déjà utilisé.' });
        return res.status(500).json({ error: err.message });
      }

      // --- ENVOI DU MAIL DE BIENVENUE ---
      const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-email?token=${verificationToken}`;
      const mailOptions = {
        from: `"SmartCampus" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Confirme ton inscription SmartCampus',
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b;">
            <h2>Bonjour ${first_name} !</h2>

            <p>Merci pour ton inscription sur <strong>SmartCampus</strong>.</p>

            <p>Pour activer ton compte, clique sur le bouton ci-dessous :</p>

            <p>
              <a href="${confirmUrl}" 
                style="display:inline-block; padding:12px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:6px;">
                Confirmer mon inscription
              </a>
            </p>

            <p>Ce lien expire dans 24 heures.</p>

            <br>
            <p>L'équipe SmartCampus.</p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Mail de confirmation envoyé à ${email}`);
        res.status(201).json({ message: 'Utilisateur créé et mail de confirmation envoyé !' });
      } catch (mailError) {
        console.error('❌ Erreur lors de l\'envoi du mail :', mailError);
        // On renvoie quand même 201 car l'utilisateur EST créé en base
        res.status(201).json({ message: 'Utilisateur créé, mais l\'envoi du mail a échoué.' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du traitement du compte.' });
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

// ── CONFIRMATION EMAIL
app.get('/confirm-email', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token manquant.' });
  }

  const query = `
    SELECT * FROM users 
    WHERE verify_token = ? 
    AND verify_token_expires > NOW()
    LIMIT 1
  `;

  db.query(query, [token], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    const user = results[0];

    const updateQuery = `
      UPDATE users 
      SET is_verified = 1,
          verify_token = NULL,
          verify_token_expires = NULL
      WHERE id = ?
    `;

    db.query(updateQuery, [user.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        message: 'Email confirmé avec succès. Tu peux maintenant te connecter.'
      });
    });
  });
});



// ── 404
app.use((_req, res) => res.status(404).json({ message: 'Route introuvable.' }));

// ── Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Smart Campus API running on http://localhost:${PORT}`);
});