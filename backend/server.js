const transporter = require('./mailer');
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

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
    age: user.age,
    gender: user.gender,
    birth_date: user.birth_date,
    photo_url: user.photo_url,
    points: user.points,
    is_verified: user.is_verified,
    is_approved: user.is_approved, // Important pour savoir s'il peut agir
  user_level: user.user_level,        // simple/complexe
    level: user.experience_level,            // débutant/intermédiaire/avancé/expert
    experience_level: user.experience_level  // basé sur points
  }
});
    }
  );
});



app.post('/register', upload.single('photo'), async (req, res) => {
  // On récupère TOUS les champs nécessaires pour ta table SQL
  const {  pseudo,  email,  password,  first_name,  last_name,  member_type,  age,  gender,  birth_date} = req.body;
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
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const query = `
      INSERT INTO users 
      (pseudo, email, password_hash, first_name, last_name, member_type, age, gender, birth_date, photo_url, is_verified, verify_token, verify_token_expires, is_approved, points) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 0)
    `;

    db.query(
      query,
      [pseudo,  email,  hashedPassword,  first_name,  last_name,  member_type,  age || null,  gender || 'Non précisé',  birth_date || null,  photo_url || null,  verificationToken,  verificationExpires],
      async (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Cet email ou pseudo est déjà utilisé.' });
        return res.status(500).json({ error: err.message });
      }

      // ── APPLY PROFESSOR BONUS IF @cyu.fr ──
      if (email.endsWith('@cyu.fr')) {
        const bonusPoints = 10;
        const userId = result.insertId;
        
        console.log(`🎓 Professor detected: ${email} - Applying +10 pts bonus`);
        
        // Update points with bonus
        db.query('UPDATE users SET points = ? WHERE id = ?', [bonusPoints, userId], (bonusErr) => {
          if (bonusErr) {
            console.error('❌ Error applying professor bonus:', bonusErr);
          } else {
            console.log(`✅ Professor bonus (+10 pts) applied to ${email}`);
          }
        });

        // Log the bonus action
        db.query(
          'INSERT INTO user_actions (user_id, action_type, description, points_earned, created_at) VALUES (?, ?, ?, ?, NOW())',
          [userId, 'professor_bonus', 'Professor registration bonus', bonusPoints],
          (logErr) => {
            if (logErr) console.error('❌ Error logging bonus:', logErr);
          }
        );
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
      d.description,
      d.category_id,
      c.name AS category_name,
      d.room_id,
      r.name AS room_name,
      d.brand,
      d.model,
      d.status,
      d.connectivity,
      d.ip_address,
      d.last_seen,
      d.created_at,
      d.updated_at
    FROM devices d
    LEFT JOIN device_categories c ON d.category_id = c.id
    LEFT JOIN rooms r ON d.room_id = r.id
    ORDER BY d.name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching devices:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Fetched ${results.length} devices`);
    res.json(results);
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

// ── ROUTE POUR RÉCUPÉRER LES MEMBRES
app.get('/members', (req, res) => {
  //const sql = 'SELECT id, pseudo, first_name, last_name, member_type FROM users WHERE is_verified = 1 AND is_approved = 1';
const sql = 'SELECT id, pseudo, first_name, last_name, email, age, gender, birth_date, photo_url, member_type, experience_level, points FROM users WHERE is_verified = 1 AND is_approved = 1';
  //   
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur members :', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    res.json(results); // Retourne les membres vérifiés et approuvés
  });
});

// ── ROUTE POUR RÉCUPÉRER UN MEMBRE PAR ID
app.get('/members/:id', (req, res) => {
  const memberId = req.params.id;

  const sql = 'SELECT id, pseudo, first_name, last_name, member_type, age, gender, birth_date, photo_url, experience_level, points FROM users WHERE id = ? AND is_verified = 1 AND is_approved = 1';

  db.query(sql, [memberId], (err, results) => {
    if (err) {
      console.error('Erreur pour récupérer le membre :', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    res.json(results[0]); // Retourne les détails du membre
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

// ── MOT DE PASSE OUBLIÉ
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email requis.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

  db.query(
    'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
    [resetToken, resetExpires, email],
    async (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"SmartCampus" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Réinitialisation de ton mot de passe SmartCampus',
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b;">
            <h2>Réinitialisation du mot de passe</h2>
            <p>Tu as demandé à réinitialiser ton mot de passe.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block; padding:12px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:6px;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p>Ce lien expire dans 15 minutes.</p>
            <p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Un email de réinitialisation a été envoyé.' });
      } catch (mailError) {
        res.status(500).json({ message: 'Erreur lors de l’envoi de l’email.' });
      }
    }
  );
});

// ── RÉINITIALISER LE MOT DE PASSE
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token et nouveau mot de passe requis.' });
  }

  db.query(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1',
    [token],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0) {
        return res.status(400).json({ message: 'Lien invalide ou expiré.' });
      }

      const user = results[0];
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hashedPassword, user.id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({ message: 'Mot de passe modifié avec succès.' });
        }
      );
    }
  );
});

// ============================================================
// PROFILE ROUTES
// ============================================================

// ── UPDATE PROFILE
app.put('/users/:email/profile', upload.single('photo'), (req, res) => {
  const { email } = req.params;
  const { gender, birth_date, age } = req.body;

  const photo_url = req.file ? `/uploads/${req.file.filename}` : req.body.photo_url || null;

  const query = `
    UPDATE users
    SET gender = ?, birth_date = ?, age = ?, photo_url = ?
    WHERE email = ?
  `;

  db.query(
    query,
    [
      gender || 'Non précisé',
      birth_date || null,
      age || null,
      photo_url,
      email
    ],
    (err) => {
      if (err) {
        console.error('❌ Error updating profile:', err);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: 'Profil mis à jour avec succès.',
        user: {
          email,
          gender,
          birth_date,
          age,
          photo_url
        }
      });
    }
  );
});

// ============================================================
// PROGRESSION SYSTEM ROUTES
// ============================================================

// ── LOG USER CONNECTION (add 1 pt per login)
app.post('/log-connection', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID required' });
  }

  // Add 1 point for each connection ✅
  const pointsToAdd = 1;
  const sql = 'UPDATE users SET points = points + ? WHERE id = ?';

  db.query(sql, [pointsToAdd, userId], (err, result) => {
    if (err) {
      console.error('❌ Error logging connection:', err);
      return res.status(500).json({ error: err.message });
    }

    // Log the action
    const logSql = `
      INSERT INTO user_actions (user_id, action_type, description, points_earned, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    db.query(logSql, [userId, 'connection', 'User logged in', pointsToAdd], (logErr) => {
      if (logErr) console.error('❌ Error logging action:', logErr);
    });

    res.json({ 
      message: 'Connection logged',
      points_added: pointsToAdd 
    });
  });
});

// ── LOG DEVICE CONSULTATION (add 0.5 pt per device view)
app.post('/log-device-view', (req, res) => {
  const { userId, deviceId, deviceName } = req.body;

  if (!userId || !deviceId) {
    return res.status(400).json({ message: 'User ID and Device ID required' });
  }

  // Add 0.5 points for device consultation ✅
  const pointsToAdd = 0.5;
  const sql = 'UPDATE users SET points = points + ? WHERE id = ?';

  db.query(sql, [pointsToAdd, userId], (err, result) => {
    if (err) {
      console.error('❌ Error logging device view:', err);
      return res.status(500).json({ error: err.message });
    }

    // Log the action
    const logSql = `
      INSERT INTO user_actions (user_id, action_type, description, points_earned, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    db.query(logSql, [userId, 'device_view', `Consulted device: ${deviceName || deviceId}`, pointsToAdd], (logErr) => {
      if (logErr) console.error('❌ Error logging action:', logErr);
    });

    res.json({ 
      message: 'Device view logged',
      points_added: pointsToAdd 
    });
  });
});

// ── GET CURRENT USER WITH PROGRESSION DATA
// ✅ THIS IS THE CORRECT ROUTE - USE THIS ONE!
// ============================================================
// FIXED: /user-current/:userId route
// ============================================================
// Remove is_active and email_verified (they don't exist in users table)

app.get('/user-current/:userId', (req, res) => {
  const userId = req.params.userId;

  // ── FETCH USER DATA ──
  // ✅ FIXED: Removed is_active and email_verified (non-existent columns)
  const userQuery = `
    SELECT 
      id, first_name, last_name, pseudo, email, member_type,
      experience_level, user_level, points, age, gender, birth_date,
      photo_url, created_at
    FROM users 
    WHERE id = ?
  `;

  db.query(userQuery, [userId], (err, userResults) => {
    if (err) {
      console.error('❌ Error fetching user:', err);
      return res.status(500).json({ error: err.message });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResults[0];

    // ── CALCULATE PROGRESSION BASED ON POINTS ──
    // ✅ UPDATED THRESHOLDS: 1pt per login + 0.5pt per device view
    const levelThresholds = {
      'débutant': 1,      // 1 point (1 login)
      'intermédiaire': 5, // 5 points
      'avancé': 10,       // 10 points
      'expert': 20        // 20 points
    };

    // Determine current level based on points
    let currentLevel = 'débutant';
    for (const [level, threshold] of Object.entries(levelThresholds)) {
      if (user.points >= threshold) {
        currentLevel = level;
      }
    }

    // Determine next level
    const levelKeys = Object.keys(levelThresholds);
    const currentLevelThreshold = levelThresholds[currentLevel];
    const currentLevelIndex = levelKeys.findIndex(l => levelThresholds[l] === currentLevelThreshold);
    const nextLevel = currentLevelIndex < levelKeys.length - 1 ? levelKeys[currentLevelIndex + 1] : null;
    const nextLevelThreshold = nextLevel ? levelThresholds[nextLevel] : currentLevelThreshold;
    const pointsNeeded = Math.max(0, nextLevelThreshold - user.points);

    // Calculate progress percentage
    const progressPercentage = nextLevel 
      ? ((user.points - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100
      : 100;

    // ── FETCH TOTAL ACTIONS ──
    const actionsQuery = `
      SELECT COUNT(*) as total_actions 
      FROM user_actions 
      WHERE user_id = ?
    `;

    db.query(actionsQuery, [userId], (err, actionResults) => {
      if (err) {
        console.error('❌ Error fetching actions:', err);
        return res.status(500).json({ error: err.message });
      }

      const totalActions = actionResults[0]?.total_actions || 0;

      // ── RESPONSE ──
      res.json({
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          pseudo: user.pseudo,
          email: user.email,
          member_type: user.member_type,
          level: currentLevel,
          user_level: user.user_level,
          points: parseFloat(user.points).toFixed(2),
          age: user.age,
          gender: user.gender,
          birth_date: user.birth_date,
          photo_url: user.photo_url,
          created_at: user.created_at
        },
        progression: {
          current_level: currentLevel,
          next_level: nextLevel,
          total_actions: totalActions,
          points_needed: parseFloat(pointsNeeded).toFixed(2),
          progress_percentage: Math.round(progressPercentage)
        }
      });
    });
  });
});

// ── GET USER PROGRESSION STATS (OPTIONAL - detailed stats)
app.get('/user-progression/:userId', (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT 
      u.id,
      u.pseudo,
      u.points,
      u.experience_level,
      COUNT(ua.id) as total_actions,
      SUM(ua.points_earned) as total_earned_points
    FROM users u
    LEFT JOIN user_actions ua ON u.id = ua.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.pseudo, u.points, u.experience_level
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching progression:', err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    // ✅ UPDATED THRESHOLDS
    const levelThresholds = {
      'débutant': 1,
      'intermédiaire': 5,
      'avancé': 10,
      'expert': 20
    };

    let currentLevel = 'débutant';
    for (const [level, threshold] of Object.entries(levelThresholds)) {
      if (user.points >= threshold) {
        currentLevel = level;
      }
    }

    const levelKeys = Object.keys(levelThresholds);
    const currentLevelThreshold = levelThresholds[currentLevel];
    const currentLevelIndex = levelKeys.findIndex(l => levelThresholds[l] === currentLevelThreshold);
    const nextLevel = currentLevelIndex < levelKeys.length - 1 ? levelKeys[currentLevelIndex + 1] : null;
    const nextLevelThreshold = nextLevel ? levelThresholds[nextLevel] : currentLevelThreshold;
    const pointsNeeded = Math.max(0, nextLevelThreshold - user.points);

    res.json({
      user: {
        id: user.id,
        pseudo: user.pseudo,
        current_level: currentLevel,
        current_points: parseFloat(user.points).toFixed(2),
        total_actions: user.total_actions || 0,
        total_earned: parseFloat(user.total_earned_points || 0).toFixed(2)
      },
      progression: {
        next_level: nextLevel,
        points_needed: parseFloat(pointsNeeded.toFixed(2)),
        progress_percentage: nextLevel 
          ? Math.round(((user.points - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100)
          : 100
      }
    });
  });
});

// ── APPLY PROFESSOR BONUS (10 pts for @cyu.fr emails)
app.post('/apply-professor-bonus', (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ message: 'User ID and email required' });
  }

  if (!email.endsWith('@cyu.fr')) {
    return res.status(400).json({ message: 'Not a professor email' });
  }

  const bonusPoints = 10;
  const sql = 'UPDATE users SET points = points + ? WHERE id = ?';

  db.query(sql, [bonusPoints, userId], (err, result) => {
    if (err) {
      console.error('❌ Error applying professor bonus:', err);
      return res.status(500).json({ error: err.message });
    }

    const logSql = 'INSERT INTO user_actions (user_id, action_type, description, points_earned, created_at) VALUES (?, ?, ?, ?, NOW())';
    db.query(logSql, [userId, 'professor_bonus', 'Professor registration bonus', bonusPoints], (logErr) => {
      if (logErr) console.error('❌ Error logging bonus:', logErr);
    });

    res.json({
      message: 'Professor bonus applied',
      bonus_points: bonusPoints
    });
  });
});

// ============================================================
// QUIZ ROUTES
// ============================================================
// ============================================================
// QUIZ ROUTES - USING EMAIL INSTEAD OF USER ID
// ============================================================

// ── GET AVAILABLE QUIZZES FOR USER (by email, not ID)
app.get('/quizzes/:userEmail', (req, res) => {
  const userEmail = req.params.userEmail;

  // 1. Récupère le level de l'utilisateur par EMAIL
  db.query('SELECT id, points FROM users WHERE email = ?', [userEmail], (err, userResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (userResults.length === 0) return res.status(404).json({ message: 'User not found' });

    const userId = userResults[0].id;
    const points = userResults[0].points;
    let unlockedDifficulties = ['débutant'];

    if (points >= 10) unlockedDifficulties.push('intermédiaire');
    if (points >= 25) unlockedDifficulties.push('avancé');
    if (points >= 50) unlockedDifficulties.push('expert');

    // 2. Récupère les quiz déverrouillés
    const placeholders = unlockedDifficulties.map(() => '?').join(',');
    const sql = `
      SELECT 
        q.id,
        q.title,
        q.description,
        q.difficulty_level,
        q.category,
        q.points_reward,
        COALESCE(uqp.is_completed, 0) as is_completed,
        COALESCE(uqp.is_passed, 0) as is_passed,
        COALESCE(uqp.best_score, 0) as best_score,
        COUNT(qq.id) as total_questions
      FROM quizzes q
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
      LEFT JOIN user_quiz_progress uqp ON q.id = uqp.quiz_id AND uqp.user_id = ?
      WHERE q.difficulty_level IN (${placeholders}) AND q.is_active = 1
      GROUP BY q.id
      ORDER BY q.difficulty_level, q.title
    `;

    const params = [userId, ...unlockedDifficulties];
    db.query(sql, params, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });
});

// ── GET SPECIFIC QUIZ WITH QUESTIONS
app.get('/quiz/:quizId/:userEmail', (req, res) => {
  const { quizId, userEmail } = req.params;

  // D'abord récupère l'user ID par email
  db.query('SELECT id FROM users WHERE email = ?', [userEmail], (err, userResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (userResults.length === 0) return res.status(404).json({ message: 'User not found' });

    const userId = userResults[0].id;

    const sql = `
      SELECT 
        q.id,
        q.title,
        q.description,
        q.difficulty_level,
        q.points_reward
      FROM quizzes q
      WHERE q.id = ?
    `;

    db.query(sql, [quizId], (err, quizResults) => {
      if (err) return res.status(500).json({ error: err.message });
      if (quizResults.length === 0) return res.status(404).json({ message: 'Quiz not found' });

      const quiz = quizResults[0];

      // Récupère les questions
      const questionsSql = `
        SELECT 
          id,
          question_text,
          question_order
        FROM quiz_questions
        WHERE quiz_id = ?
        ORDER BY question_order
      `;

      db.query(questionsSql, [quizId], (err, questions) => {
        if (err) return res.status(500).json({ error: err.message });

        // Pour chaque question, récupère les réponses
        Promise.all(
          questions.map(q => {
            return new Promise((resolve, reject) => {
              const answersSql = `
                SELECT 
                  id,
                  answer_text,
                  answer_order,
                  is_correct
                FROM quiz_answers
                WHERE question_id = ?
                ORDER BY answer_order
              `;
              db.query(answersSql, [q.id], (err, answers) => {
                if (err) reject(err);
                resolve({ ...q, answers });
              });
            });
          })
        ).then(questionsWithAnswers => {
          res.json({
            quiz,
            questions: questionsWithAnswers
          });
        }).catch(err => res.status(500).json({ error: err.message }));
      });
    });
  });
});

// ── SUBMIT QUIZ RESULT
app.post('/quiz/:quizId/submit', (req, res) => {
  const { quizId } = req.params;
  const { userEmail, score, totalQuestions } = req.body;

  if (!userEmail || score === undefined || !totalQuestions) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Récupère l'user ID par email
  db.query('SELECT id FROM users WHERE email = ?', [userEmail], (err, userResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (userResults.length === 0) return res.status(404).json({ message: 'User not found' });

    const userId = userResults[0].id;
    const isPassed = score === totalQuestions;
    const bonusPoints = isPassed ? 10 : 0;

    // 1. Enregistre le résultat
    const resultSql = `
      INSERT INTO quiz_results 
      (user_id, quiz_id, score, total_questions, is_passed, points_earned, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(resultSql, [userId, quizId, score, totalQuestions, isPassed ? 1 : 0, bonusPoints], 
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2. Met à jour la progression utilisateur
        const progressSql = `
          INSERT INTO user_quiz_progress 
          (user_id, quiz_id, is_completed, is_passed, attempts, best_score, unlocked_at)
          VALUES (?, ?, 1, ?, 1, ?, NOW())
          ON DUPLICATE KEY UPDATE 
            is_completed = 1,
            is_passed = GREATEST(is_passed, ?),
            attempts = attempts + 1,
            best_score = GREATEST(best_score, ?)
        `;

        db.query(progressSql, [userId, quizId, isPassed ? 1 : 0, score, isPassed ? 1 : 0, score], 
          (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // 3. Ajoute les points si réussi
            if (isPassed) {
              db.query('UPDATE users SET points = points + ? WHERE id = ?', [bonusPoints, userId], 
                (err) => {
                  if (err) console.error('Error adding points:', err);
                }
              );

              // Log l'action
              db.query(
                'INSERT INTO user_actions (user_id, action_type, description, points_earned, created_at) VALUES (?, ?, ?, ?, NOW())',
                [userId, 'quiz_passed', `Quiz "${quizId}" completed with 100%`, bonusPoints],
                (err) => {
                  if (err) console.error('Error logging action:', err);
                }
              );
            }

            res.json({
              message: isPassed ? 'Quiz passed! +10 pts bonus!' : 'Quiz submitted',
              isPassed,
              bonusPoints,
              score,
              totalQuestions
            });
          }
        );
      }
    );
  });
});

// ── CHECK IF USER CAN UNLOCK NEXT QUIZ LEVEL
app.get('/quiz/next/:userEmail', (req, res) => {
  const userEmail = req.params.userEmail;

  db.query('SELECT points FROM users WHERE email = ?', [userEmail], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    const points = results[0].points;

    // Détermine le prochain quiz niveau
    let nextLevel = null;
    let pointsNeeded = 0;

    if (points < 10) {
      nextLevel = 'intermédiaire';
      pointsNeeded = 10 - points;
    } else if (points < 25) {
      nextLevel = 'avancé';
      pointsNeeded = 25 - points;
    } else if (points < 50) {
      nextLevel = 'expert';
      pointsNeeded = 50 - points;
    }

    res.json({
      nextLevel,
      pointsNeeded,
      canUnlock: pointsNeeded === 0
    });
  });
});


// ── GET ALL SERVICES ──
app.get('/services', (req, res) => {
  const sql = `
    SELECT 
      id,
      name,
      description,
      category,
      icon,
      is_active
    FROM services
    WHERE is_active = 1
    ORDER BY category, name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching services:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Fetched ${results.length} services`);
    res.json(results);
  });
});

// ============================================================
// DEVICE MANAGEMENT ROUTES (for complexe users)
// ============================================================

// ── CREATE NEW DEVICE ──
app.post('/devices', (req, res) => {
  const { uid, name, description, category_id, room_id, brand, model, status, connectivity, ip_address } = req.body;

  if (!uid || !name) {
    return res.status(400).json({ message: 'UID et nom requis' });
  }

  const sql = `
    INSERT INTO devices (uid, name, description, category_id, room_id, brand, model, status, connectivity, ip_address, last_seen, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
  `;

  db.query(sql, [uid, name, description, category_id || null, room_id || null, brand || null, model || null, status || 'Actif', connectivity || 'Wi-Fi', ip_address || null], (err, result) => {
    if (err) {
      console.error('❌ Error creating device:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Ce UID existe déjà' });
      }
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Device created: ${name} (ID: ${result.insertId})`);
    res.status(201).json({
      message: 'Objet créé avec succès',
      device: {
        id: result.insertId,
        uid,
        name,
        description,
        category_id,
        room_id,
        brand,
        model,
        status,
        connectivity,
        ip_address
      }
    });
  });
});

// ── UPDATE DEVICE ──
app.put('/devices/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, room_id, brand, model, status, connectivity, ip_address } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nom requis' });
  }

  const sql = `
    UPDATE devices 
    SET name = ?, description = ?, category_id = ?, room_id = ?, brand = ?, model = ?, status = ?, connectivity = ?, ip_address = ?, updated_at = NOW()
    WHERE id = ?
  `;

  db.query(sql, [name, description || null, category_id || null, room_id || null, brand || null, model || null, status || 'Actif', connectivity || 'Wi-Fi', ip_address || null, id], (err, result) => {
    if (err) {
      console.error('❌ Error updating device:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Objet non trouvé' });
    }

    console.log(`✅ Device updated: ${name}`);
    res.json({
      message: 'Objet modifié avec succès',
      device: { id, name, description, category_id, room_id, brand, model, status, connectivity, ip_address }
    });
  });
});

/// ── DELETE DEVICE (Direct deletion for complexe users) ──
app.delete('/devices/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM devices WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting device:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Objet non trouvé' });
    }

    console.log(`✅ Device ${id} deleted`);
    res.json({ message: '✅ Objet supprimé avec succès' });
  });
});

// ── TOGGLE DEVICE STATUS (Actif/Inactif) ──
app.patch('/devices/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Actif', 'Inactif', 'Maintenance', 'Erreur'].includes(status)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

  const sql = 'UPDATE devices SET status = ?, updated_at = NOW() WHERE id = ?';

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('❌ Error updating device status:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Objet non trouvé' });
    }

    console.log(`✅ Device ${id} status updated to: ${status}`);
    res.json({
      message: `Objet changé en ${status}`,
      device: { id, status }
    });
  });
});

// ── GET DEVICE CATEGORIES ──
app.get('/device-categories', (req, res) => {
  const sql = 'SELECT id, name FROM device_categories ORDER BY name';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching categories:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET ROOMS (for device assignment) ──
app.get('/api/rooms', (req, res) => {
  const sql = 'SELECT id, name FROM rooms ORDER BY name';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching rooms:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});


// ============================================================
// DEVICE ATTRIBUTES ROUTES (Configuration parameters)
// ============================================================

// ── GET DEVICE ATTRIBUTES ──
app.get('/devices/:id/attributes', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT id, device_id, attr_key, attr_value, unit
    FROM device_attributes
    WHERE device_id = ?
    ORDER BY attr_key
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching attributes:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── CREATE/UPDATE ATTRIBUTE ──
app.post('/devices/:id/attributes', (req, res) => {
  const { id } = req.params;
  const { attr_key, attr_value, unit } = req.body;

  if (!attr_key || !attr_value) {
    return res.status(400).json({ message: 'Clé et valeur requis' });
  }

  // Vérifier si l'attribut existe déjà
  const checkSql = 'SELECT id FROM device_attributes WHERE device_id = ? AND attr_key = ?';

  db.query(checkSql, [id, attr_key], (err, results) => {
    if (err) {
      console.error('❌ Error checking attribute:', err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      // UPDATE
      const updateSql = 'UPDATE device_attributes SET attr_value = ?, unit = ?, updated_at = NOW() WHERE device_id = ? AND attr_key = ?';
      db.query(updateSql, [attr_value, unit || null, id, attr_key], (err) => {
        if (err) {
          console.error('❌ Error updating attribute:', err);
          return res.status(500).json({ error: err.message });
        }

        console.log(`✅ Attribute updated: ${attr_key} = ${attr_value}`);
        res.json({
          message: 'Attribut modifié',
          attribute: { device_id: id, attr_key, attr_value, unit }
        });
      });
    } else {
      // INSERT
      const insertSql = 'INSERT INTO device_attributes (device_id, attr_key, attr_value, unit) VALUES (?, ?, ?, ?)';
      db.query(insertSql, [id, attr_key, attr_value, unit || null], (err, result) => {
        if (err) {
          console.error('❌ Error creating attribute:', err);
          return res.status(500).json({ error: err.message });
        }

        console.log(`✅ Attribute created: ${attr_key} = ${attr_value}`);
        res.status(201).json({
          message: 'Attribut créé',
          attribute: { id: result.insertId, device_id: id, attr_key, attr_value, unit }
        });
      });
    }
  });
});

// ── DELETE ATTRIBUTE ──
app.delete('/devices/:deviceId/attributes/:attrId', (req, res) => {
  const { deviceId, attrId } = req.params;

  const sql = 'DELETE FROM device_attributes WHERE id = ? AND device_id = ?';

  db.query(sql, [attrId, deviceId], (err, result) => {
    if (err) {
      console.error('❌ Error deleting attribute:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Attribut non trouvé' });
    }

    console.log(`✅ Attribute ${attrId} deleted`);
    res.json({ message: 'Attribut supprimé' });
  });
});

// ============================================================
// DEVICE ATTRIBUTE TEMPLATES ROUTES
// ============================================================

// ── GET ATTRIBUTE TEMPLATES FOR A CATEGORY ──
app.get('/device-categories/:categoryId/templates', (req, res) => {
  const { categoryId } = req.params;

  const sql = `
    SELECT id, attr_key, attr_label, attr_unit, attr_type, possible_values
    FROM device_attribute_templates
    WHERE category_id = ?
    ORDER BY attr_label
  `;

  db.query(sql, [categoryId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching templates:', err);
      return res.status(500).json({ error: err.message });
    }

    // Parse possible_values JSON if it exists
    const parsedResults = results.map(r => ({
      ...r,
      possible_values: r.possible_values ? JSON.parse(r.possible_values) : null
    }));

    res.json(parsedResults);
  });
});

// ── GET ALL TEMPLATES ──
app.get('/attribute-templates', (req, res) => {
  const sql = `
    SELECT id, category_id, attr_key, attr_label, attr_unit, attr_type, possible_values
    FROM device_attribute_templates
    ORDER BY category_id, attr_label
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching all templates:', err);
      return res.status(500).json({ error: err.message });
    }

    const parsedResults = results.map(r => ({
      ...r,
      possible_values: r.possible_values ? JSON.parse(r.possible_values) : null
    }));

    res.json(parsedResults);
  });
});


// ============================================================
// REPORTS & ANALYTICS ROUTES
// ============================================================

// ── GET DEVICE CONSUMPTION DATA (Last 30 days) ──
app.get('/reports/device-consumption', (req, res) => {
  const sql = `
    SELECT 
      d.id,
      d.name,
      d.uid,
      c.name as category_name,
      dd.attr_key,
      dd.value,
      dd.recorded_at
    FROM device_data dd
    JOIN devices d ON dd.device_id = d.id
    LEFT JOIN device_categories c ON d.category_id = c.id
    WHERE dd.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND dd.attr_key IN ('consommation_jour', 'consommation_mois', 'consommation', 'puissance_actuelle')
    ORDER BY dd.recorded_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching consumption data:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET DEVICE STATUS SUMMARY ──
app.get('/reports/device-status', (req, res) => {
  const sql = `
    SELECT 
      d.status,
      COUNT(*) as count,
      COUNT(CASE WHEN d.category_id IS NOT NULL THEN 1 END) as with_category
    FROM devices d
    GROUP BY d.status
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching device status:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET DEVICES NEEDING MAINTENANCE ──
app.get('/reports/maintenance-needed', (req, res) => {
  const sql = `
    SELECT 
      d.id,
      d.name,
      d.uid,
      d.status,
      c.name as category_name,
      r.name as room_name,
      d.brand,
      d.model,
      d.last_seen,
      d.created_at,
      DATEDIFF(NOW(), d.updated_at) as days_since_update
    FROM devices d
    LEFT JOIN device_categories c ON d.category_id = c.id
    LEFT JOIN rooms r ON d.room_id = r.id
    WHERE d.status IN ('Maintenance', 'Erreur')
       OR d.last_seen < DATE_SUB(NOW(), INTERVAL 7 DAY)
    ORDER BY d.status DESC, d.last_seen ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching maintenance data:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET ROOM OCCUPANCY STATS ──
app.get('/reports/room-occupancy', (req, res) => {
  const sql = `
    SELECT 
      r.id,
      r.name,
      r.building,
      r.capacity,
      ro.current_count,
      ro.is_occupied,
      ro.occupancy_type,
      CASE 
        WHEN ro.current_count = 0 THEN 0
        ELSE ROUND((ro.current_count / r.capacity) * 100, 2)
      END as occupancy_percentage
    FROM rooms r
    LEFT JOIN room_occupancy ro ON r.id = ro.room_id
    ORDER BY ro.is_occupied DESC, r.name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching occupancy data:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET CONSUMPTION TREND (Daily average) ──
app.get('/reports/consumption-trend', (req, res) => {
  const days = req.query.days || 7;
  
  const sql = `
    SELECT 
      DATE(dd.recorded_at) as date,
      d.name,
      d.id,
      AVG(CAST(dd.value AS DECIMAL(10,2))) as avg_value,
      MAX(CAST(dd.value AS DECIMAL(10,2))) as max_value,
      MIN(CAST(dd.value AS DECIMAL(10,2))) as min_value
    FROM device_data dd
    JOIN devices d ON dd.device_id = d.id
    WHERE dd.recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND dd.attr_key IN ('consommation', 'consommation_jour', 'puissance_actuelle')
    GROUP BY DATE(dd.recorded_at), d.id, d.name
    ORDER BY DATE(dd.recorded_at) DESC
  `;

  db.query(sql, [days], (err, results) => {
    if (err) {
      console.error('❌ Error fetching trend data:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET DEVICE EFFICIENCY REPORT ──
app.get('/reports/device-efficiency', (req, res) => {
  const sql = `
    SELECT 
      d.id,
      d.name,
      d.uid,
      c.name as category_name,
      r.name as room_name,
      d.status,
      COUNT(dd.id) as data_points,
      MAX(dd.recorded_at) as last_reading,
      CASE 
        WHEN d.status = 'Actif' THEN 'Opérationnel'
        WHEN d.status = 'Inactif' THEN 'Inactif'
        WHEN d.status = 'Maintenance' THEN 'À Maintenance'
        ELSE 'Erreur'
      END as health_status
    FROM devices d
    LEFT JOIN device_categories c ON d.category_id = c.id
    LEFT JOIN rooms r ON d.room_id = r.id
    LEFT JOIN device_data dd ON d.id = dd.device_id 
      AND dd.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY d.id
    ORDER BY d.status, d.name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching efficiency data:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET SUMMARY STATS ──
app.get('/reports/summary', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as total FROM devices', (err, res) => {
        if (err) reject(err);
        resolve(res[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM devices WHERE status = "Actif"', (err, res) => {
        if (err) reject(err);
        resolve(res[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM devices WHERE status IN ("Maintenance", "Erreur")', (err, res) => {
        if (err) reject(err);
        resolve(res[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM room_occupancy WHERE is_occupied = 1', (err, res) => {
        if (err) reject(err);
        resolve(res[0]);
      });
    })
  ])
  .then(([total, actifs, problemes, occupied_rooms]) => {
    res.json({
      total_devices: total.total,
      devices_actifs: actifs.count,
      devices_problemes: problemes.count,
      rooms_occupied: occupied_rooms.count
    });
  })
  .catch(err => {
    console.error('❌ Error fetching summary:', err);
    res.status(500).json({ error: err.message });
  });
});


// ============================================================
// DEVICE HISTORY & EFFICIENCY ANALYSIS ROUTES
// ============================================================

// ── GET DEVICE DATA HISTORY (Last 30 days) ──
app.get('/devices/:deviceId/history', (req, res) => {
  const { deviceId } = req.params;
  const days = req.query.days || 30;

  const sql = `
    SELECT 
      dd.id,
      dd.attr_key,
      dd.value,
      dd.recorded_at,
      d.name as device_name,
      d.uid
    FROM device_data dd
    JOIN devices d ON dd.device_id = d.id
    WHERE dd.device_id = ?
      AND dd.recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY dd.recorded_at DESC
  `;

  db.query(sql, [deviceId, days], (err, results) => {
    if (err) {
      console.error('❌ Error fetching device history:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET DEVICE EFFICIENCY SCORE ──
app.get('/devices/:deviceId/efficiency', (req, res) => {
  const { deviceId } = req.params;

  const sql = `
    SELECT 
      d.id,
      d.name,
      d.uid,
      d.status,
      d.last_seen,
      d.created_at,
      d.updated_at,
      c.name as category_name,
      COUNT(dd.id) as data_points_30d,
      MAX(dd.recorded_at) as last_data_point,
      DATEDIFF(NOW(), d.updated_at) as days_since_update,
      CASE 
        WHEN d.status = 'Maintenance' THEN 'MAINTENANCE_REQUISE'
        WHEN d.status = 'Erreur' THEN 'EN_ERREUR'
        WHEN DATEDIFF(NOW(), d.last_seen) > 7 THEN 'INACTIF_LONGTEMPS'
        WHEN COUNT(dd.id) = 0 THEN 'PAS_DE_DONNEES'
        WHEN d.status = 'Inactif' THEN 'INACTIF'
        ELSE 'OPERATIONNEL'
      END as health_status
    FROM devices d
    LEFT JOIN device_categories c ON d.category_id = c.id
    LEFT JOIN device_data dd ON d.id = dd.device_id 
      AND dd.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    WHERE d.id = ?
    GROUP BY d.id
  `;

  db.query(sql, [deviceId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching device efficiency:', err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(results[0]);
  });
});

// ── GET DEVICE CONSUMPTION STATS ──
app.get('/devices/:deviceId/consumption-stats', (req, res) => {
  const { deviceId } = req.params;

  const sql = `
    SELECT 
      dd.attr_key,
      AVG(CAST(dd.value AS DECIMAL(10,2))) as avg_value,
      MAX(CAST(dd.value AS DECIMAL(10,2))) as max_value,
      MIN(CAST(dd.value AS DECIMAL(10,2))) as min_value,
      COUNT(*) as data_count,
      DATE(dd.recorded_at) as measurement_date
    FROM device_data dd
    WHERE dd.device_id = ?
      AND dd.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND dd.attr_key IN ('consommation', 'consommation_jour', 'puissance_actuelle', 'temperature_actuelle', 'humidite')
    GROUP BY DATE(dd.recorded_at), dd.attr_key
    ORDER BY DATE(dd.recorded_at) DESC
  `;

  db.query(sql, [deviceId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching consumption stats:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// ── GET INEFFICIENCY INDICATORS ──
app.get('/devices/:deviceId/inefficiency-check', (req, res) => {
  const { deviceId } = req.params;

  const sql = `
    SELECT 
      d.id,
      d.name,
      d.uid,
      d.status,
      d.last_seen,
      c.name as category_name,
      COUNT(dd.id) as recent_readings,
      DATEDIFF(NOW(), d.last_seen) as days_inactive,
      DATEDIFF(NOW(), d.updated_at) as days_since_config,
      CASE 
        WHEN d.status = 'Maintenance' THEN 'Maintenance requise - Intervention necessaire'
        WHEN d.status = 'Erreur' THEN 'Device en erreur - A verifier immediatement'
        WHEN DATEDIFF(NOW(), d.last_seen) > 7 THEN CONCAT('Inactif depuis ', DATEDIFF(NOW(), d.last_seen), ' jours - A investiguer')
        WHEN COUNT(dd.id) = 0 AND DATEDIFF(NOW(), d.created_at) > 3 THEN 'Pas de donnees depuis 30 jours - Verifier la connexion'
        WHEN d.status = 'Inactif' THEN 'Device desactive - Reactiver si necessaire'
        ELSE 'Operationnel'
      END as recommendation,
      CASE 
        WHEN d.status = 'Maintenance' THEN 'CRITIQUE'
        WHEN d.status = 'Erreur' THEN 'CRITIQUE'
        WHEN DATEDIFF(NOW(), d.last_seen) > 7 THEN 'IMPORTANT'
        WHEN COUNT(dd.id) = 0 THEN 'MOYEN'
        ELSE 'BON'
      END as priority
    FROM devices d
    LEFT JOIN device_categories c ON d.category_id = c.id
    LEFT JOIN device_data dd ON d.id = dd.device_id 
      AND dd.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    WHERE d.id = ?
    GROUP BY d.id
  `;

  db.query(sql, [deviceId], (err, results) => {
    if (err) {
      console.error('❌ Error checking inefficiency:', err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(results[0]);
  });
});

// ============================================================

// ============================================================
// ROOM RESERVATIONS ROUTES
// ============================================================

// ── GET ROOM RESERVATIONS (List all for a room) ──
app.get('/rooms/:roomId/reservations', (req, res) => {
  const { roomId } = req.params;

  const sql = `
    SELECT 
      id, room_id, user_id, reservation_type, title, description,
      start_time, end_time, status, created_at
    FROM room_reservations
    WHERE room_id = ? AND status = 'active'
    ORDER BY start_time ASC
  `;

  db.query(sql, [roomId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching reservations:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Fetched ${results?.length || 0} reservations for room ${roomId}`);
    res.json(results || []);
  });
});

// ── CREATE RESERVATION ──
app.post('/reservations', (req, res) => {
  const { roomId, userId, title, description, startTime, endTime, reservationType } = req.body;

  if (!roomId || !userId || !title || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const checkSql = `
    SELECT COUNT(*) as count FROM room_reservations
    WHERE room_id = ? AND status = 'active'
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))
  `;

  db.query(checkSql, [roomId, endTime, startTime, endTime, startTime, startTime, endTime], (err, results) => {
    if (err) {
      console.error('❌ Error checking availability:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (results[0].count > 0) {
      return res.status(409).json({ error: 'Cet horaire n\'est pas disponible' });
    }

    const insertSql = `
      INSERT INTO room_reservations (room_id, user_id, title, description, start_time, end_time, reservation_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `;

    db.query(insertSql, [roomId, userId, title, description || '', startTime, endTime, reservationType || 'personnel'], (err, result) => {
      if (err) {
        console.error('❌ Error creating reservation:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Reservation created with ID: ${result.insertId}`);
      res.status(201).json({ id: result.insertId, message: 'Reservation created successfully' });
    });
  });
});

// ============================================================
// DELETE RESERVATION ROUTE (CANCEL)
// ============================================================

// ── DELETE / CANCEL A RESERVATION
app.delete('/reservations/:reservationId', (req, res) => {
  const { reservationId } = req.params;

  if (!reservationId) {
    return res.status(400).json({ error: 'Reservation ID required' });
  }

  // ✅ UPDATE status to 'annulee'
  const sql = `
    UPDATE room_reservations
    SET status = 'annulee'
    WHERE id = ?
  `;

  db.query(sql, [reservationId], (err, result) => {
    if (err) {
      console.error('❌ Error canceling reservation:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({
      message: 'Réservation annulée avec succès',
      reservationId: reservationId,
      status: 'annulee'
    });
  });
});

// ============================================================
// LOG ROOM VIEW ROUTE (for points system)
// +0.5 pts per room view
// ============================================================

app.post('/log-room-view', (req, res) => {
  const { userId, roomId, roomName } = req.body;

  if (!userId || !roomId) {
    return res.status(400).json({ error: 'userId and roomId required' });
  }

  // ── INSERT INTO user_actions ──
  const sql = `
    INSERT INTO user_actions (user_id, action_type, description, points_earned, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  const actionType = 'room_viewed';
  const description = `Viewed room: ${roomName || roomId}`;
  const pointsEarned = 0.5; // +0.5 points per room view

  db.query(sql, [userId, actionType, description, pointsEarned], (err, result) => {
    if (err) {
      console.error('❌ Error logging room view:', err);
      return res.status(500).json({ error: err.message });
    }

    // ── UPDATE USER POINTS ──
    const updateSql = `
      UPDATE users 
      SET points = points + ?
      WHERE id = ?
    `;

    db.query(updateSql, [pointsEarned, userId], (err) => {
      if (err) {
        console.error('❌ Error updating points:', err);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: 'Room view logged successfully',
        points_earned: pointsEarned,
        room_id: roomId,
        room_name: roomName
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