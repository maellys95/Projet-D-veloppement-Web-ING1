import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./css/RoomDetail.css";

function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("60");
  const [formData, setFormData] = useState({
    title: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Pre-defined time slots
  const TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30"
  ];

  const DURATIONS = [
    { value: "30", label: "30 min" },
    { value: "60", label: "01h00" },
    { value: "90", label: "01h30" },
    { value: "120", label: "02h00" }
  ];

  // ── PROTECTION: Check authentication ──
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // ── FETCH ROOM & RESERVATIONS ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomRes = await fetch(`http://localhost:5000/rooms/${id}`);
        const roomData = await roomRes.json();
        
        if (roomData && roomData.length > 0) {
          setRoom(roomData[0]);

          // ── LOG ROOM VIEW (+0.5 pts) ──
          if (user) {
            fetch('http://localhost:5000/log-room-view', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userId: user.id, 
                roomId: roomData[0].id, 
                roomName: roomData[0].name 
              })
            }).catch(err => console.error('Error logging room view:', err));
          }

          // Fetch reservations for this room
          const reservRes = await fetch(`http://localhost:5000/rooms/${id}/reservations?t=${Date.now()}`);
          const reservData = await reservRes.json();
          console.log('✅ Initial reservations loaded:', reservData);
          setReservations(Array.isArray(reservData) ? reservData : []);

          // Set default date to first available
          const validDates = getValidDates();
          if (validDates.length > 0) {
            setSelectedDate(validDates[0]);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setMessage({ type: 'error', text: 'Erreur lors du chargement' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  // ── GET VALID DATES (7-14 days, exclude weekends) ──
  const getValidDates = () => {
    const today = new Date();
    const dates = [];
    let current = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const maxDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    while (current <= maxDate) {
      // Skip weekends
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // ── CHECK IF TIME SLOT IS AVAILABLE ──
  const isTimeSlotAvailable = (time) => {
    if (!selectedDate || !time) return false;

    const startDateTime = new Date(`${selectedDate}T${time}`);
    const durationMinutes = parseInt(selectedDuration);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    const hasConflict = reservations.some(res => {
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);
      
      return (startDateTime < resEnd && endDateTime > resStart);
    });

    return !hasConflict;
  };

  // ── HANDLE FORM INPUT ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  // ── HANDLE RESERVATION ──
  const handleReservation = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    // Validations
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Entrez un titre' });
      setSubmitting(false);
      return;
    }

    if (!selectedDate) {
      setMessage({ type: 'error', text: 'Sélectionnez une date' });
      setSubmitting(false);
      return;
    }

    if (!selectedTime) {
      setMessage({ type: 'error', text: 'Sélectionnez une heure' });
      setSubmitting(false);
      return;
    }

    if (!isTimeSlotAvailable(selectedTime)) {
      setMessage({ type: 'error', text: 'Ce créneau n\'est pas disponible' });
      setSubmitting(false);
      return;
    }

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const durationMinutes = parseInt(selectedDuration);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const response = await fetch('http://localhost:5000/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: parseInt(id),
          userId: user.id,
          title: formData.title,
          description: `Réservé par ${user.name || user.email}`,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          reservationType: 'personnel'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: result.error || 'Erreur' });
      } else {
        setMessage({ type: 'success', text: '✅ Réservation confirmée!' });
        
        setFormData({ title: '' });
        setSelectedTime("");
        setSelectedDuration("60");

        // Delay then refresh (DB needs time to write)
        setTimeout(async () => {
          try {
            const reservRes = await fetch(`http://localhost:5000/rooms/${id}/reservations?t=${Date.now()}`);
            const reservData = await reservRes.json();
            console.log('📊 Refreshed reservations:', reservData);
            setReservations(Array.isArray(reservData) ? reservData : []);
          } catch (err) {
            console.error('❌ Error refreshing reservations:', err);
          }
        }, 800);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la réservation' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── CHECK PERMISSIONS ──
  const canReserve = user && (
    user.user_level === 'complexe' || 
    (user.experience_level && ['avancé', 'expert'].includes(user.experience_level.toLowerCase())) ||
    user.email?.endsWith('@cyu.fr')
  );

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;
  }

  if (!room) {
    return (
      <main className="room-detail-page">
        <button className="back-button" onClick={() => navigate('/rooms')}>
          ← Retour aux salles
        </button>
        <div className="not-found">
          <p>Salle non trouvée</p>
        </div>
      </main>
    );
  }

  const formattedDate = selectedDate ? new Date(`${selectedDate}T00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  const validDates = getValidDates();

  return (
    <main className="room-detail-page">
      <button className="back-button" onClick={() => navigate('/rooms')}>
        ← Retour aux salles
      </button>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="page-header">
        <h1>{room.name}</h1>
        <p className="subtitle">{room.description || 'Salle de réunion'}</p>
      </div>

      <div className="room-detail-container">
        {/* LEFT: ROOM INFO */}
        <section className="room-info">
          <div className="room-capacity-badge">👥 {room.capacity} places</div>

          <div className="room-details">
            <div className="detail-item">
              <span className="detail-label">Bâtiment</span>
              <span className="detail-value">{room.building || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Étage</span>
              <span className="detail-value">{room.floor || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Capacité</span>
              <span className="detail-value">{room.capacity} personnes</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type</span>
              <span className="detail-value">{room.type || 'Standard'}</span>
            </div>
          </div>
        </section>

        {/* RIGHT: RESERVATION FORM */}
        {!user ? (
          <section className="auth-section">
            <div className="auth-box">
              <h2>Réserver cette salle</h2>
              <p>Connectez-vous pour réserver</p>
              <button 
                className="btn-login"
                onClick={() => navigate('/login')}
              >
                Se connecter
              </button>
            </div>
          </section>
        ) : !canReserve ? (
          <section className="auth-section">
            <div className="no-access-box">
              <h2>Accès refusé</h2>
              <p>Vous n'avez pas les droits pour réserver.</p>
            </div>
          </section>
        ) : (
          <section className="reservation-section">
            <form onSubmit={handleReservation} className="reservation-form">
              <h2>Nouvelle réservation</h2>

              {/* TITLE */}
              <div className="form-group">
                <label>Motif de la réservation*</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Ex: Projet de groupe, Réunion..."
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* DATE SELECTOR */}
              <div className="form-group">
                <label>Pour quel jour ?*</label>
                <div className="date-selector">
                  {validDates.map(date => {
                    const dateObj = new Date(`${date}T00:00`);
                    const dayLabel = dateObj.toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric'
                    });
                    const dayNum = dateObj.getDate();

                    return (
                      <button
                        key={date}
                        type="button"
                        className={`date-btn ${selectedDate === date ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(""); // Reset time on date change
                        }}
                      >
                        <span className="day-label">{dayLabel}</span>
                        <span className="day-num">{dayNum}</span>
                      </button>
                    );
                  })}
                </div>
                <small>7 à 14 jours, hors samedi/dimanche</small>
              </div>

              {/* SELECTED DATE DISPLAY */}
              {selectedDate && (
                <div className="selected-date-display">
                  📅 {formattedDate}
                </div>
              )}

              {/* TIME SLOTS */}
              {selectedDate && (
                <div className="form-group">
                  <label>À partir de quelle heure ?*</label>
                  <div className="time-slots-container">
                    {TIME_SLOTS.map(time => {
                      const isAvailable = isTimeSlotAvailable(time);
                      const isSelected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          className={`time-slot ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(time)}
                          disabled={!isAvailable}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DURATION */}
              <div className="form-group">
                <label>Durée*</label>
                <div className="duration-buttons">
                  {DURATIONS.map(dur => (
                    <button
                      key={dur.value}
                      type="button"
                      className={`duration-btn ${selectedDuration === dur.value ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDuration(dur.value);
                        setSelectedTime(""); // Reset time on duration change
                      }}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SUBMIT */}
              <button 
                type="submit" 
                className="btn-submit"
                disabled={submitting || !selectedDate || !selectedTime || !formData.title}
              >
                {submitting ? '⏳ Réservation...' : '✓ Réserver'}
              </button>
            </form>
          </section>
        )}
      </div>

      {/* EXISTING RESERVATIONS */}
      <section className="existing-reservations">
        <h2>Réservations actuelles ({reservations.length})</h2>
        
        {reservations.length > 0 ? (
          <div className="reservations-grid">
            {reservations.map(res => (
              <div key={res.id} className="reservation-card">
                <div className="res-date">
                  📅 {new Date(res.start_time).toLocaleDateString('fr-FR')}
                </div>
                <div className="res-time">
                  🕐 {new Date(res.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(res.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="res-title">{res.title}</div>
                <div className="res-user">👤 {res.user_name}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Aucune réservation pour le moment</p>
        )}
      </section>
    </main>
  );
}

export default RoomDetail;