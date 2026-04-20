require('dotenv').config();
console.log(process.env.DB_NAME);

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());

/* ===========================
   TEST DB
=========================== */
app.get('/test-db', (req, res) => {
  db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur DB' });
    }
    res.json(results);
  });
});

/* ===========================
   ROUTE TEST
=========================== */
app.get('/', (req, res) => {
  res.send('API Smart Campus OK');
});

/* ===========================
   USERS
=========================== */
app.get('/users', (req, res) => {
  db.query(
    'SELECT id, pseudo, email, member_type FROM users',
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur users' });
      }
      res.json(results);
    }
  );
});

/* ===========================
   ROOMS
=========================== */
app.get('/rooms', (req, res) => {
  db.query('SELECT * FROM rooms', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur rooms' });
    }
    res.json(results);
  });
});

/* ===========================
   DEVICES
=========================== */
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
      console.error(err);
      return res.status(500).json({ message: 'Erreur devices' });
    }
    res.json(results);
  });
});

/* ===========================
   ATTRIBUTS DEVICE
=========================== */
app.get('/devices/:id/attributes', (req, res) => {
  const id = req.params.id;

  db.query(
    'SELECT * FROM device_attributes WHERE device_id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur attributs' });
      }
      res.json(results);
    }
  );
});

/* ===========================
   NEWS
=========================== */
app.get('/news', (req, res) => {
  db.query(
    'SELECT * FROM news WHERE published = 1 ORDER BY created_at DESC',
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur news' });
      }
      res.json(results);
    }
  );
});

/* ===========================
   EVENTS
=========================== */
app.get('/events', (req, res) => {
  db.query(
    'SELECT * FROM events ORDER BY event_date ASC',
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur events' });
      }
      res.json(results);
    }
  );
});


app.get('/reservations', (req, res) => {
  const sql = `
    SELECT 
      rr.id,
      rr.room_id,
      rr.user_id,
      rr.start_time,
      rr.end_time,
      rr.purpose,
      rr.status,
      rr.created_at,
      r.name AS room_name,
      u.pseudo AS user_pseudo
    FROM room_reservations rr
    JOIN rooms r ON rr.room_id = r.id
    JOIN users u ON rr.user_id = u.id
    ORDER BY rr.start_time ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur réservations' });
    }

    res.json(results);
  });
});

app.post('/reservations', (req, res) => {
  const { room_id, user_id, start_time, end_time, purpose } = req.body;

  if (!room_id || !user_id || !start_time || !end_time) {
    return res.status(400).json({
      message: 'room_id, user_id, start_time et end_time sont obligatoires'
    });
  }

  const userSql = 'SELECT id, pseudo, member_type, is_verified FROM users WHERE id = ?';

  db.query(userSql, [user_id], (userErr, userResults) => {
    if (userErr) {
      console.error(userErr);
      return res.status(500).json({ message: 'Erreur vérification utilisateur' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = userResults[0];

    if (!user.is_verified) {
      return res.status(403).json({
        message: 'Votre compte n’est pas encore vérifié par code email'
      });
    }

    if (user.member_type !== 'Enseignant') {
      return res.status(403).json({
        message: 'Seuls les enseignants peuvent réserver une salle'
      });
    }

    const checkSql = `
      SELECT * FROM room_reservations
      WHERE room_id = ?
        AND status = 'active'
        AND (
          (start_time < ? AND end_time > ?)
          OR
          (start_time >= ? AND start_time < ?)
        )
    `;

    db.query(
      checkSql,
      [room_id, end_time, start_time, start_time, end_time],
      (checkErr, checkResults) => {
        if (checkErr) {
          console.error(checkErr);
          return res.status(500).json({ message: 'Erreur vérification réservation' });
        }

        if (checkResults.length > 0) {
          return res.status(409).json({
            message: 'Cette salle est déjà réservée sur ce créneau'
          });
        }

        const insertSql = `
          INSERT INTO room_reservations (room_id, user_id, start_time, end_time, purpose)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [room_id, user_id, start_time, end_time, purpose || null],
          (insertErr, result) => {
            if (insertErr) {
              console.error(insertErr);
              return res.status(500).json({ message: 'Erreur ajout réservation' });
            }

            res.status(201).json({
              message: 'Réservation ajoutée',
              reservationId: result.insertId
            });
          }
        );
      }
    );
  });
});


app.get('/rooms/free', (req, res) => {
  const { start_time, end_time } = req.query;

  if (!start_time || !end_time) {
    return res.status(400).json({
      message: 'start_time et end_time sont obligatoires dans l’URL'
    });
  }

  const sql = `
    SELECT *
    FROM rooms
    WHERE id NOT IN (
      SELECT room_id
      FROM room_reservations
      WHERE status = 'active'
        AND (
          (start_time < ? AND end_time > ?)
          OR
          (start_time >= ? AND start_time < ?)
        )
    )
    ORDER BY name ASC
  `;

  db.query(sql, [end_time, start_time, start_time, end_time], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur salles libres' });
    }

    res.json(results);
  });
});


app.delete('/reservations/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM room_reservations WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur suppression réservation' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    res.json({ message: 'Réservation supprimée' });
  });
});

app.put('/reservations/:id', (req, res) => {
  const { id } = req.params;
  const { room_id, start_time, end_time, purpose, status } = req.body;

  if (!room_id || !start_time || !end_time) {
    return res.status(400).json({
      message: 'room_id, start_time et end_time sont obligatoires'
    });
  }

  const checkSql = `
    SELECT * FROM room_reservations
    WHERE room_id = ?
      AND id != ?
      AND status = 'active'
      AND (
        (start_time < ? AND end_time > ?)
        OR
        (start_time >= ? AND start_time < ?)
      )
  `;

  db.query(
    checkSql,
    [room_id, id, end_time, start_time, start_time, end_time],
    (checkErr, checkResults) => {
      if (checkErr) {
        console.error(checkErr);
        return res.status(500).json({ message: 'Erreur vérification modification' });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          message: 'Cette salle est déjà réservée sur ce créneau'
        });
      }

      const updateSql = `
        UPDATE room_reservations
        SET room_id = ?, start_time = ?, end_time = ?, purpose = ?, status = ?
        WHERE id = ?
      `;

      db.query(
        updateSql,
        [
          room_id,
          start_time,
          end_time,
          purpose || null,
          status || 'active',
          id
        ],
        (updateErr, result) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ message: 'Erreur modification réservation' });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Réservation non trouvée' });
          }

          res.json({ message: 'Réservation modifiée' });
        }
      );
    }
  );
});

const transporter = require('./mailer');

/* ===========================
   REGISTER
=========================== */
app.post('/register', async (req, res) => {
  let {
    email,
    password,
    first_name,
    last_name,
    member_type
  } = req.body;

  if (!email || !password || !first_name || !last_name || !member_type) {
    return res.status(400).json({
      message: 'Tous les champs sont obligatoires'
    });
  }

  first_name = first_name.toLowerCase().trim();
  last_name = last_name.toLowerCase().trim();
  email = email.toLowerCase().trim();

  const pseudo = 'e-' + first_name[0] + last_name;
  const expectedEmail = `${first_name}.${last_name}@etu.cyu.fr`;

  if (email !== expectedEmail) {
    return res.status(400).json({
      message: `Email invalide. Format attendu : ${expectedEmail}`
    });
  }

  if (member_type !== 'Étudiant' && member_type !== 'Enseignant') {
    return res.status(400).json({
      message: 'member_type doit être Étudiant ou Enseignant'
    });
  }

  const checkSql = 'SELECT id FROM users WHERE email = ? OR pseudo = ?';

  db.query(checkSql, [email, pseudo], async (checkErr, checkResults) => {
    if (checkErr) {
      console.error(checkErr);
      return res.status(500).json({ message: 'Erreur vérification utilisateur' });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({
        message: 'Utilisateur déjà existant'
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const insertSql = `
      INSERT INTO users (
        pseudo,
        email,
        password_hash,
        first_name,
        last_name,
        member_type,
        is_verified,
        is_approved,
        verification_code,
        verification_expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?)
    `;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      insertSql,
      [
        pseudo,
        email,
        hashedPassword,
        first_name,
        last_name,
        member_type,
        verificationCode,
        expiresAt
      ],
      async (insertErr, result) => {
        if (insertErr) {
          console.error(insertErr);
          return res.status(500).json({ message: 'Erreur inscription' });
        }

        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Code de vérification Smart Campus',
            text: `Bonjour,\n\nVotre code de vérification est : ${verificationCode}\n\nCe code expire dans 10 minutes.`
          });

          res.status(201).json({
            message: 'Inscription créée. Un code de vérification a été envoyé par email.',
            userId: result.insertId
          });
        } catch (mailErr) {
          console.error(mailErr);
          return res.status(500).json({
            message: 'Utilisateur créé mais email non envoyé'
          });
        }
      }
    );
  });
});

/* ===========================
   VERIFY CODE
=========================== */
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      message: 'email et code sont obligatoires'
    });
  }

  const sql = `
    SELECT id, verification_code, verification_expires_at, is_verified
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [email.toLowerCase().trim()], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur vérification code' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = results[0];

    if (user.is_verified) {
      return res.json({ message: 'Compte déjà vérifié' });
    }

    if (user.verification_code !== code) {
      return res.status(400).json({ message: 'Code invalide' });
    }

    if (!user.verification_expires_at || new Date(user.verification_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Code expiré' });
    }

    const updateSql = `
      UPDATE users
      SET is_verified = 1,
          verification_code = NULL,
          verification_expires_at = NULL
      WHERE id = ?
    `;

    db.query(updateSql, [user.id], (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ message: 'Erreur validation compte' });
      }

      res.json({ message: 'Compte vérifié avec succès' });
    });
  });
});

/* ===========================
   LOGIN
=========================== */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email et mot de passe obligatoires'
    });
  }

  const sql = `
    SELECT id, pseudo, email, password_hash, member_type, is_verified
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [email.toLowerCase().trim()], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur connexion' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = results[0];

    if (!user.is_verified) {
      return res.status(403).json({
        message: 'Compte non vérifié. Veuillez entrer le code reçu par email.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Mot de passe incorrect'
      });
    }

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        member_type: user.member_type
      }
    });
  });
});

/* ===========================
   LANCEMENT SERVEUR
=========================== */
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});