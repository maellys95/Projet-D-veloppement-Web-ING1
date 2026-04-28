import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import './css/Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Data
  const [summary, setSummary] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState([]);
  const [maintenanceDevices, setMaintenanceDevices] = useState([]);
  const [consumptionTrend, setConsumptionTrend] = useState([]);
  const [roomOccupancy, setRoomOccupancy] = useState([]);
  const [deviceEfficiency, setDeviceEfficiency] = useState([]);
  
  // Filters
  const [periodFilter, setPeriodFilter] = useState('7');
  const [statusFilter, setStatusFilter] = useState('');

  // ── PROTECTION: Only complexe users ──
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.user_level !== 'complexe') {
        navigate('/profile');
      }
      setUser(parsedUser);
    }
  }, [navigate]);

  // ── FETCH ALL DATA ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, statusRes, maintenanceRes, occupancyRes, trendRes, efficiencyRes] = await Promise.all([
          fetch('http://localhost:5000/reports/summary').then(r => r.json()),
          fetch('http://localhost:5000/reports/device-status').then(r => r.json()),
          fetch('http://localhost:5000/reports/maintenance-needed').then(r => r.json()),
          fetch('http://localhost:5000/reports/room-occupancy').then(r => r.json()),
          fetch(`http://localhost:5000/reports/consumption-trend?days=${periodFilter}`).then(r => r.json()),
          fetch('http://localhost:5000/reports/device-efficiency').then(r => r.json())
        ]);

        setSummary(summaryRes);
        setDeviceStatus(statusRes);
        setMaintenanceDevices(maintenanceRes);
        setRoomOccupancy(occupancyRes);
        setConsumptionTrend(trendRes);
        setDeviceEfficiency(efficiencyRes);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching reports:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [periodFilter]);

  // ── EXPORT CSV ──
  const handleExportCSV = () => {
    if (!deviceEfficiency || deviceEfficiency.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = ['ID', 'Appareil', 'UID', 'Catégorie', 'Salle', 'État', 'Lectures', 'Dernier relevé', 'Santé'];
    const rows = deviceEfficiency.map(device => [
      device.id,
      device.name,
      device.uid,
      device.category_name || '-',
      device.room_name || '-',
      device.status,
      device.data_points || 0,
      device.last_reading ? new Date(device.last_reading).toLocaleDateString('fr-FR') : '-',
      device.health_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_appareils_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('✅ Rapport CSV exporté!');
  };

  // ── EXPORT PDF ──
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      // ── HEADER ──
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246);
      pdf.text('Rapport Complet - Statistiques IoT', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(160, 174, 192);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;

      // ── SUMMARY STATS ──
      if (summary) {
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Résumé Exécutif', 20, yPos);
        yPos += 10;

        pdf.setFontSize(11);
        const statsText = [
          `Total Appareils: ${summary.total_devices}`,
          `Appareils Actifs: ${summary.devices_actifs}`,
          `À Maintenance: ${summary.devices_problemes}`,
          `Salles Occupées: ${summary.rooms_occupied}`
        ];

        statsText.forEach(stat => {
          pdf.text(stat, 30, yPos);
          yPos += 8;
        });

        yPos += 5;
      }

      // ── DEVICE STATUS ──
      if (deviceStatus.length > 0) {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('État des Appareils', 20, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        deviceStatus.forEach(status => {
          const percentage = summary ? ((status.count / summary.total_devices) * 100).toFixed(1) : 0;
          pdf.text(`${status.status}: ${status.count} appareils (${percentage}%)`, 30, yPos);
          yPos += 8;
        });

        yPos += 5;
      }

      // ── MAINTENANCE ALERTS ──
      if (maintenanceDevices.length > 0) {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(239, 68, 68);
        pdf.text('Appareils Necessitant Maintenance', 20, yPos);
        yPos += 10;

        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        
        maintenanceDevices.slice(0, 10).forEach(device => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(`• ${device.name} (${device.uid}) - ${device.status}`, 30, yPos);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`  Salle: ${device.room_name || 'Non assigne'}`, 35, yPos + 4);
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          yPos += 10;
        });

        yPos += 5;
      }

      // ── ROOM OCCUPANCY ──
      if (roomOccupancy.length > 0) {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Occupation des Salles', 20, yPos);
        yPos += 10;

        pdf.setFontSize(9);
        roomOccupancy.slice(0, 8).forEach(room => {
          const status = room.is_occupied ? 'Occupée' : 'Libre';
          const occupancy = room.capacity > 0 ? ((room.current_count / room.capacity) * 100).toFixed(0) : 0;
          pdf.text(`${room.name}: ${room.current_count}/${room.capacity} (${occupancy}%) - ${status}`, 30, yPos);
          yPos += 7;
        });

        yPos += 5;
      }

      // ── DEVICE EFFICIENCY TABLE ──
      if (deviceEfficiency.length > 0) {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Rapport d\'Efficacite des Appareils', 20, yPos);
        yPos += 10;

        // Table headers
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Appareil', 20, yPos);
        pdf.text('Categorie', 55, yPos);
        pdf.text('Salle', 85, yPos);
        pdf.text('Sante', 115, yPos);
        pdf.text('Lectures', 145, yPos);
        pdf.text('Derniere', 175, yPos);
        
        yPos += 5;
        pdf.setLineWidth(0.5);
        pdf.line(20, yPos, pageWidth - 20, yPos);
        yPos += 3;
        
        // Table data
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(7);
        
        deviceEfficiency.slice(0, 10).forEach(device => {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = 20;
            
            // Repeat header
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(59, 130, 246);
            pdf.text('Appareil', 20, yPos);
            pdf.text('Categorie', 55, yPos);
            pdf.text('Salle', 85, yPos);
            pdf.text('Sante', 115, yPos);
            pdf.text('Lectures', 145, yPos);
            pdf.text('Derniere', 175, yPos);
            yPos += 5;
            pdf.setLineWidth(0.5);
            pdf.line(20, yPos, pageWidth - 20, yPos);
            yPos += 3;
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(7);
          }

          const lastReading = device.last_reading ? new Date(device.last_reading).toLocaleDateString('fr-FR') : '-';
          
          pdf.text(device.name.substring(0, 20), 20, yPos);
          pdf.text(device.category_name ? device.category_name.substring(0, 15) : '-', 55, yPos);
          pdf.text(device.room_name ? device.room_name.substring(0, 15) : '-', 85, yPos);
          pdf.text(device.health_status.substring(0, 10), 115, yPos);
          pdf.text(String(device.data_points || 0), 145, yPos);
          pdf.text(lastReading, 175, yPos);
          yPos += 6;
        });

        yPos += 10;
      }

      // ── CONSUMPTION TREND ──
      if (consumptionTrend.length > 0) {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Tendance de Consommation', 20, yPos);
        yPos += 10;

        pdf.setFontSize(8);
        consumptionTrend.slice(0, 5).forEach(trend => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          const formattedDate = new Date(trend.date).toLocaleDateString('fr-FR');
          pdf.text(`${trend.name} (${formattedDate})`, 30, yPos);
          pdf.text(`  Moyen: ${parseFloat(trend.avg_value).toFixed(2)} | Max: ${parseFloat(trend.max_value).toFixed(2)} | Min: ${parseFloat(trend.min_value).toFixed(2)}`, 35, yPos + 5);
          yPos += 12;
        });
      }

      // ── FOOTER ──
      pdf.setFontSize(8);
      pdf.setTextColor(160, 174, 192);
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(`Page ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      pdf.save(`rapport_complet_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ Rapport PDF généré!');
    } catch (err) {
      console.error('❌ Error generating PDF:', err);
      alert('❌ Erreur lors de la génération du PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement des rapports...</div>;
  }

  const filteredEfficiency = statusFilter 
    ? deviceEfficiency.filter(d => d.status === statusFilter)
    : deviceEfficiency;

  return (
    <div className="reports-page">
      {/* ── HEADER ── */}
      <section className="reports-header">
        <div>
          <h1>Rapports & Statistiques 📊</h1>
          <p>Surveillance et optimisation des ressources du campus</p>
        </div>
      </section>

      {/* ── SUMMARY STATS ── */}
      {summary && (
        <section className="summary-grid">
          <div className="summary-card total">
            <div className="summary-icon">🖥️</div>
            <div className="summary-content">
              <div className="summary-number">{summary.total_devices}</div>
              <div className="summary-label">Appareils Total</div>
            </div>
          </div>
          <div className="summary-card actif">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <div className="summary-number">{summary.devices_actifs}</div>
              <div className="summary-label">Appareils Actifs</div>
            </div>
          </div>
          <div className="summary-card alerte">
            <div className="summary-icon">⚠️</div>
            <div className="summary-content">
              <div className="summary-number">{summary.devices_problemes}</div>
              <div className="summary-label">À Maintenance</div>
            </div>
          </div>
          <div className="summary-card occupancy">
            <div className="summary-icon">👥</div>
            <div className="summary-content">
              <div className="summary-number">{summary.rooms_occupied}</div>
              <div className="summary-label">Salles Occupées</div>
            </div>
          </div>
        </section>
      )}

      {/* ── DEVICE STATUS CHART ── */}
      <section className="report-section">
        <h2>État des Appareils</h2>
        <div className="status-distribution">
          {deviceStatus.map(status => (
            <div key={status.status} className="status-bar">
              <div className="status-bar-label">
                <span className={`status-icon ${status.status.toLowerCase()}`}>
                  {status.status}
                </span>
                <span className="status-count">{status.count}</span>
              </div>
              <div className="status-bar-container">
                <div 
                  className={`status-bar-fill ${status.status.toLowerCase()}`}
                  style={{ width: `${(status.count / summary.total_devices) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FILTERS ── */}
      <section className="filters-section">
        <select 
          value={periodFilter} 
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="filter-select"
        >
          <option value="7">Derniers 7 jours</option>
          <option value="14">Derniers 14 jours</option>
          <option value="30">Derniers 30 jours</option>
        </select>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les états</option>
          <option value="Actif">Actif</option>
          <option value="Inactif">Inactif</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Erreur">Erreur</option>
        </select>
      </section>

      {/* ── ROOM OCCUPANCY ── */}
      <section className="report-section">
        <h2>Occupation des Salles</h2>
        <div className="rooms-grid">
          {roomOccupancy.slice(0, 6).map(room => (
            <div key={room.id} className={`room-card ${room.is_occupied ? 'occupied' : 'empty'}`}>
              <div className="room-header">
                <h3>{room.name}</h3>
                <span className={`room-status ${room.is_occupied ? 'occupied' : 'empty'}`}>
                  {room.is_occupied ? '👥 Occupée' : '🚫 Libre'}
                </span>
              </div>
              <div className="room-info">
                <p>{room.current_count || 0} / {room.capacity} personnes</p>
                <div className="room-progress">
                  <div 
                    className="room-progress-fill"
                    style={{ width: `${(room.current_count / room.capacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAINTENANCE ALERTS ── */}
      {maintenanceDevices.length > 0 && (
        <section className="report-section alerts">
          <h2>⚠️ Appareils Nécessitant Maintenance</h2>
          <div className="alerts-list">
            {maintenanceDevices.map(device => (
              <div key={device.id} className="alert-item">
                <div className="alert-icon">⚙️</div>
                <div className="alert-content">
                  <h4>{device.name}</h4>
                  <p className="alert-uid">{device.uid}</p>
                  <div className="alert-meta">
                    <span className={`alert-status ${device.status.toLowerCase()}`}>
                      {device.status}
                    </span>
                    {device.days_since_update && (
                      <span className="alert-days">
                        Pas de lecture depuis {device.days_since_update} jours
                      </span>
                    )}
                  </div>
                </div>
                <div className="alert-location">
                  {device.room_name || 'Non assigné'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DEVICE EFFICIENCY ── */}
      <section className="report-section">
        <h2>Rapport d'Efficacité des Appareils</h2>
        <div className="efficiency-table">
          <table>
            <thead>
              <tr>
                <th>Appareil</th>
                <th>Catégorie</th>
                <th>Salle</th>
                <th>État</th>
                <th>Lectures</th>
                <th>Dernier relevé</th>
              </tr>
            </thead>
            <tbody>
              {filteredEfficiency.slice(0, 10).map(device => (
                <tr key={device.id}>
                  <td>
                    <strong>{device.name}</strong>
                    <p className="device-uid">{device.uid}</p>
                  </td>
                  <td>{device.category_name || '-'}</td>
                  <td>{device.room_name || '-'}</td>
                  <td>
                    <span className={`health-status ${device.health_status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {device.health_status}
                    </span>
                  </td>
                  <td>{device.data_points || 0}</td>
                  <td>
                    {device.last_reading 
                      ? new Date(device.last_reading).toLocaleDateString('fr-FR')
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CONSUMPTION TREND ── */}
      {consumptionTrend.length > 0 && (
        <section className="report-section">
          <h2>Tendance de Consommation</h2>
          <div className="trend-list">
            {consumptionTrend.slice(0, 5).map(trend => (
              <div key={`${trend.id}-${trend.date}`} className="trend-item">
                <div className="trend-header">
                  <h4>{trend.name}</h4>
                  <span className="trend-date">{trend.date}</span>
                </div>
                <div className="trend-values">
                  <div className="trend-value">
                    <span className="trend-label">Moyen</span>
                    <span className="trend-number">{parseFloat(trend.avg_value).toFixed(2)}</span>
                  </div>
                  <div className="trend-value">
                    <span className="trend-label">Max</span>
                    <span className="trend-number">{parseFloat(trend.max_value).toFixed(2)}</span>
                  </div>
                  <div className="trend-value">
                    <span className="trend-label">Min</span>
                    <span className="trend-number">{parseFloat(trend.min_value).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXPORT BUTTONS ── */}
      <section className="export-section">
        <button 
          className="btn-export" 
          onClick={handleExportPDF}
          disabled={exporting}
        >
          {exporting ? '⏳ Génération...' : '📄 Télécharger en PDF'}
        </button>
        <button 
          className="btn-export csv"
          onClick={handleExportCSV}
        >
          📊 Télécharger en CSV
        </button>
      </section>
    </div>
  );
};

export default Reports;