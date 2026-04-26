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
    is_approved: user.is_approved // Important pour savoir s'il peut agir
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

// ── UPDATE PROFILE
app.put('/users/:id/profile', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { gender, birth_date, age } = req.body;

  const photo_url = req.file ? `/uploads/${req.file.filename}` : req.body.photo_url || null;

  const query = `
    UPDATE users
    SET gender = ?, birth_date = ?, age = ?, photo_url = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [
      gender || 'Non précisé',
      birth_date || null,
      age || null,
      photo_url,
      id
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        message: 'Profil mis à jour avec succès.',
        user: {
          id,
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
// ============================================================
// PROGRESSION SYSTEM ROUTES - UPDATED
// ============================================================

// ── LOG USER CONNECTION (add 1 pt per login)
app.post('/log-connection', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID required' });
  }

  // Add 1 point for each connection
  const sql = 'UPDATE users SET points = points + 1 WHERE id = ?';

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('❌ Error logging connection:', err);
      return res.status(500).json({ error: err.message });
    }

    const logSql = 'INSERT INTO user_actions (user_id, action_type, description, points_earned, created_at) VALUES (?, ?, ?, ?, NOW())';
    db.query(logSql, [userId, 'connection', 'User logged in', 1], (logErr) => {
      if (logErr) console.error('❌ Error logging action:', logErr);
    });

    res.json({ 
      message: 'Connection logged',
      points_added: 1 
    });
  });
});

// ── LOG DEVICE CONSULTATION (add 1 pt per device view)
app.post('/log-device-view', (req, res) => {
  const { userId, deviceId, deviceName } = req.body;

  if (!userId || !deviceId) {
    return res.status(400).json({ message: 'User ID and Device ID required' });
  }

  // Add 1 point for device consultation
  const sql = 'UPDATE users SET points = points + 1 WHERE id = ?';

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('❌ Error logging device view:', err);
      return res.status(500).json({ error: err.message });
    }

    const logSql = 'INSERT INTO user_actions (user_id, action_type, description, points_earned, created_at) VALUES (?, ?, ?, ?, NOW())';
    db.query(logSql, [userId, 'device_view', `Consulted device: ${deviceName || deviceId}`, 1], (logErr) => {
      if (logErr) console.error('❌ Error logging action:', logErr);
    });

    res.json({ 
      message: 'Device view logged',
      points_added: 1 
    });
  });
});

// ── GET CURRENT USER WITH PROGRESSION DATA
// REMPLACE CETTE ROUTE DANS TON server.js (ligne 603)
app.get('/user-current/:userId', (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT 
      u.id,
      u.pseudo,
      u.email,
      u.first_name,
      u.last_name,
      u.points,
      u.chosen_level,
      u.experience_level,
      u.member_type,
      u.photo_url,
      u.gender,
      u.age,
      u.birth_date,
      COUNT(ua.id) as total_actions
    FROM users u
    LEFT JOIN user_actions ua ON u.id = ua.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.pseudo, u.email, u.first_name, u.last_name, u.points, u.chosen_level, u.experience_level, u.member_type, u.photo_url, u.gender, u.age, u.birth_date
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    // Calculate progression based on EXPERIENCE_LEVEL (points atteints)
    let attainedLevel = user.experience_level;
    let nextLevel, pointsNeeded;

    if (user.points < 10) {
      attainedLevel = 'débutant';
      nextLevel = 'intermédiaire';
      pointsNeeded = 10 - user.points;
    } else if (user.points < 25) {
      attainedLevel = 'intermédiaire';
      nextLevel = 'avancé';
      pointsNeeded = 25 - user.points;
    } else if (user.points < 50) {
      attainedLevel = 'avancé';
      nextLevel = 'expert';
      pointsNeeded = 50 - user.points;
    } else {
      attainedLevel = 'expert';
      nextLevel = null;
      pointsNeeded = 0;
    }

    res.json({
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        points: user.points,
        level: user.chosen_level, // CHOSEN level for display
        attained_level: attainedLevel, // ATTAINED level (based on points)
        member_type: user.member_type,
        photo_url: user.photo_url,
        gender: user.gender,
        age: user.age,
        birth_date: user.birth_date,
        total_actions: user.total_actions || 0
      },
      progression: {
        current_level: attainedLevel,
        next_level: nextLevel,
        points_needed: pointsNeeded,
        progress_percentage: attainedLevel === 'expert' 
          ? 100 
          : Math.round((user.points / (user.points + pointsNeeded)) * 100)
      }
    });
  });
});

// ── CHANGE USER LEVEL (only if points requirement met)
// REMPLACE CETTE ROUTE DANS TON server.js (ligne 687)
app.post('/change-level', (req, res) => {
  const { userId, newLevel } = req.body;

  if (!userId || !newLevel) {
    return res.status(400).json({ message: 'User ID and new level required' });
  }

  // Fetch current points
  db.query('SELECT points FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const points = results[0].points;
    let canChangeLevel = false;
    let errorMsg = '';

    // Vérifier si l'utilisateur a assez de points pour ce niveau
    if (newLevel === 'débutant') {
      canChangeLevel = true;
    } else if (newLevel === 'intermédiaire' && points >= 10) {
      canChangeLevel = true;
    } else if (newLevel === 'avancé' && points >= 25) {
      canChangeLevel = true;
    } else if (newLevel === 'expert' && points >= 50) {
      canChangeLevel = true;
    } else {
      errorMsg = `Tu as besoin de plus de points pour débloquer ${newLevel}`;
    }

    if (!canChangeLevel) {
      return res.status(403).json({ message: errorMsg });
    }

    // Update CHOSEN level (not experience_level)
    db.query('UPDATE users SET chosen_level = ? WHERE id = ?', [newLevel, userId], (updateErr) => {
      if (updateErr) {
        console.error('❌ Error changing level:', updateErr);
        return res.status(500).json({ error: updateErr.message });
      }

      console.log(`✅ User ${userId} changed chosen_level to ${newLevel}`);
      res.json({
        message: 'Level changed successfully!',
        new_level: newLevel,
        points: points
      });
    });
  });
});

// ── GET USER PROGRESSION STATS
// REMPLACE CETTE ROUTE DANS TON server.js (ligne 740)
app.get('/user-progression/:userId', (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT 
      u.id,
      u.pseudo,
      u.points,
      u.chosen_level,
      u.experience_level,
      COUNT(ua.id) as total_actions,
      SUM(ua.points_earned) as total_earned_points
    FROM users u
    LEFT JOIN user_actions ua ON u.id = ua.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.pseudo, u.points, u.chosen_level, u.experience_level
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    // Calculate next level based on POINTS
    let nextLevel, pointsNeeded;
    if (user.points < 10) {
      nextLevel = 'intermédiaire';
      pointsNeeded = 10 - user.points;
    } else if (user.points < 25) {
      nextLevel = 'avancé';
      pointsNeeded = 25 - user.points;
    } else if (user.points < 50) {
      nextLevel = 'expert';
      pointsNeeded = 50 - user.points;
    } else {
      nextLevel = 'Already at max level!';
      pointsNeeded = 0;
    }

    res.json({
      user: {
        id: user.id,
        pseudo: user.pseudo,
        current_level: user.chosen_level,
        current_points: user.points,
        total_actions: user.total_actions || 0,
        total_earned: user.total_earned_points || 0
      },
      progression: {
        next_level: nextLevel,
        points_needed: pointsNeeded,
        progress_to_next: Math.max(0, 100 - ((pointsNeeded / (user.points + pointsNeeded)) * 100))
      }
    });
  });
});

// ── CHANGE USER LEVEL (only if points requirement met)
// ── CHANGE USER LEVEL (only if points requirement met)
// REMPLACE CETTE ROUTE DANS TON server.js (ligne 687)
// FIX: Use experience_level instead of level

app.post('/change-level', (req, res) => {
  const { userId, newLevel } = req.body;

  if (!userId || !newLevel) {
    return res.status(400).json({ message: 'User ID and new level required' });
  }

  // Fetch current points
  db.query('SELECT points FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const points = results[0].points;
    let canChangeLevel = false;
    let errorMsg = '';

    // Vérifier si l'utilisateur a assez de points pour ce niveau
    if (newLevel === 'débutant') {
      canChangeLevel = true; // Tous les utilisateurs commencent en débutant
    } else if (newLevel === 'intermédiaire' && points >= 10) {
      canChangeLevel = true;
    } else if (newLevel === 'avancé' && points >= 25) {
      canChangeLevel = true;
    } else if (newLevel === 'expert' && points >= 50) {
      canChangeLevel = true;
    } else {
      errorMsg = `Tu as besoin de plus de points pour débloquer ${newLevel}`;
    }

    if (!canChangeLevel) {
      return res.status(403).json({ message: errorMsg });
    }

    // Update level - use experience_level column
    db.query('UPDATE users SET experience_level = ? WHERE id = ?', [newLevel, userId], (updateErr) => {
      if (updateErr) {
        console.error('❌ Error changing level:', updateErr);
        return res.status(500).json({ error: updateErr.message });
      }

      res.json({
        message: 'Level changed successfully!',
        new_level: newLevel,
        points: points
      });
    });
  });
});

// ── GET USER PROGRESSION STATS
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
    GROUP BY u.id
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    // Calculate next level
    let nextLevel, pointsNeeded;
    if (user.points < 10) {
      nextLevel = 'intermédiaire';
      pointsNeeded = 10 - user.points;
    } else if (user.points < 25) {
      nextLevel = 'avancé';
      pointsNeeded = 25 - user.points;
    } else if (user.points < 50) {
      nextLevel = 'expert';
      pointsNeeded = 50 - user.points;
    } else {
      nextLevel = 'Already at max level!';
      pointsNeeded = 0;
    }

    res.json({
      user: {
        id: user.id,
        pseudo: user.pseudo,
        current_level: user.experience_level,
        current_points: user.points,
        total_actions: user.total_actions || 0,
        total_earned: user.total_earned_points || 0
      },
      progression: {
        next_level: nextLevel,
        points_needed: pointsNeeded,
        progress_to_next: Math.max(0, 100 - ((pointsNeeded / (user.points + pointsNeeded)) * 100))
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

// ── 404
app.use((_req, res) => res.status(404).json({ message: 'Route introuvable.' }));

// ── Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Smart Campus API running on http://localhost:${PORT}`);
});