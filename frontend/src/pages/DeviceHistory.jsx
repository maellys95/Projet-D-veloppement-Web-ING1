import React, { useState, useEffect } from 'react';

const DeviceHistory = ({ deviceId, deviceName }) => {
  const [history, setHistory] = useState([]);
  const [efficiency, setEfficiency] = useState(null);
  const [inefficiency, setInefficiency] = useState(null);
  const [consumptionStats, setConsumptionStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('historique'); // historique, efficacite, recommandations

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, efficiencyRes, inefficiencyRes, consumptionRes] = await Promise.all([
          fetch(`http://localhost:5000/devices/${deviceId}/history?days=30`).then(r => r.json()),
          fetch(`http://localhost:5000/devices/${deviceId}/efficiency`).then(r => r.json()),
          fetch(`http://localhost:5000/devices/${deviceId}/inefficiency-check`).then(r => r.json()),
          fetch(`http://localhost:5000/devices/${deviceId}/consumption-stats`).then(r => r.json())
        ]);

        setHistory(historyRes);
        setEfficiency(efficiencyRes);
        setInefficiency(inefficiencyRes);
        setConsumptionStats(consumptionRes);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching device data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div className="device-history-panel">
      {/* TABS */}
      <div className="history-tabs">
        <button 
          className={`tab-btn ${activeTab === 'historique' ? 'active' : ''}`}
          onClick={() => setActiveTab('historique')}
        >
          📊 Historique
        </button>
        <button 
          className={`tab-btn ${activeTab === 'efficacite' ? 'active' : ''}`}
          onClick={() => setActiveTab('efficacite')}
        >
          ⚡ Efficacite
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommandations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommandations')}
        >
          💡 Recommandations
        </button>
      </div>

      {/* HISTORIQUE TAB */}
      {activeTab === 'historique' && (
        <div className="tab-content">
          <h3>Historique des Donnees (30 derniers jours)</h3>
          {history.length > 0 ? (
            <div className="history-list">
              {history.slice(0, 20).map(entry => (
                <div key={entry.id} className="history-item">
                  <div className="history-date">
                    {new Date(entry.recorded_at).toLocaleDateString('fr-FR')} 
                    <span className="history-time">
                      {new Date(entry.recorded_at).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="history-data">
                    <strong>{entry.attr_key.replace(/_/g, ' ').toUpperCase()}</strong>
                    <span className="history-value">{entry.value}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#a0aec0' }}>Aucune donnee historique disponible</p>
          )}
        </div>
      )}

      {/* EFFICACITE TAB */}
      {activeTab === 'efficacite' && efficiency && (
        <div className="tab-content">
          <h3>Analyse d'Efficacite</h3>
          <div className="efficiency-stats">
            <div className="stat-box">
              <label>Etat du Device</label>
              <div className={`stat-value status-${efficiency.status.toLowerCase()}`}>
                {efficiency.status}
              </div>
            </div>
            <div className="stat-box">
              <label>Sante</label>
              <div className={`stat-value health-${efficiency.health_status.toLowerCase().replace(/_/g, '-')}`}>
                {efficiency.health_status.replace(/_/g, ' ')}
              </div>
            </div>
            <div className="stat-box">
              <label>Lectures (30j)</label>
              <div className="stat-value">{efficiency.data_points_30d || 0}</div>
            </div>
            <div className="stat-box">
              <label>Inactif depuis</label>
              <div className="stat-value">
                {efficiency.days_since_update ? `${efficiency.days_since_update} jours` : 'Actif'}
              </div>
            </div>
          </div>

          {consumptionStats.length > 0 && (
            <div className="consumption-breakdown">
              <h4>Consommation (30 derniers jours)</h4>
              <div className="consumption-items">
                {consumptionStats.map((stat, idx) => (
                  <div key={idx} className="consumption-item">
                    <strong>{stat.attr_key.replace(/_/g, ' ').toUpperCase()}</strong>
                    <div className="consumption-metrics">
                      <span>Moyen: {parseFloat(stat.avg_value).toFixed(2)}</span>
                      <span>Max: {parseFloat(stat.max_value).toFixed(2)}</span>
                      <span>Min: {parseFloat(stat.min_value).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RECOMMANDATIONS TAB */}
      {activeTab === 'recommandations' && inefficiency && (
        <div className="tab-content">
          <h3>Recommandations & Alertes</h3>
          
          <div className={`alert-box priority-${inefficiency.priority.toLowerCase()}`}>
            <div className="alert-header">
              <strong>Priorite: {inefficiency.priority}</strong>
            </div>
            <p className="alert-message">{inefficiency.recommandation}</p>
          </div>

          <div className="recommandation-details">
            <div className="detail-box">
              <label>Nom</label>
              <value>{inefficiency.name}</value>
            </div>
            <div className="detail-box">
              <label>Categorie</label>
              <value>{inefficiency.category_name || '-'}</value>
            </div>
            <div className="detail-box">
              <label>Dernier acces</label>
              <value>
                {inefficiency.last_seen 
                  ? new Date(inefficiency.last_seen).toLocaleDateString('fr-FR')
                  : 'Jamais'
                }
              </value>
            </div>
            <div className="detail-box">
              <label>Donnees recentes</label>
              <value>{inefficiency.recent_readings} readings</value>
            </div>
          </div>

          {inefficiency.priority !== 'BON' && (
            <div className="action-box">
              <h4>Actions recommandees:</h4>
              <ul>
                {inefficiency.priority === 'CRITIQUE' && (
                  <>
                    <li>Verifier immediatement l'etat du device</li>
                    <li>Consulter les logs d'erreur</li>
                    <li>Prevenir un technicien pour intervention</li>
                  </>
                )}
                {inefficiency.priority === 'IMPORTANT' && (
                  <>
                    <li>Verifier la connexion reseau</li>
                    <li>Relancer les services si necessaire</li>
                    <li>Planifier une maintenance preventive</li>
                  </>
                )}
                {inefficiency.priority === 'MOYEN' && (
                  <>
                    <li>Verifier la configuration</li>
                    <li>Tester les capteurs</li>
                    <li>Planifier une inspection</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceHistory;