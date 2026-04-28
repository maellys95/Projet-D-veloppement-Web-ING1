import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/AdminDevices.css';
import DeviceHistory from "./DeviceHistory";
import './css/DeviceHistory.css';

const AdminDevices = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalStep, setModalStep] = useState(1); // Step 1: Basic, Step 2: Advanced
  
  // Attributes
  const [selectedDeviceForAttributes, setSelectedDeviceForAttributes] = useState(null);
  const [deviceAttributes, setDeviceAttributes] = useState([]);
  const [attributeTemplates, setAttributeTemplates] = useState([]);
  const [newAttribute, setNewAttribute] = useState({ template_id: '', attr_value: '' });
  
  // Form data
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    description: '',
    category_id: '',
    room_id: '',
    brand: '',
    model: '',
    status: 'Actif',
    connectivity: 'Wi-Fi',
    ip_address: ''
  });

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

  // ── FETCH DATA ──
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/devices').then(r => r.json()),
      fetch('http://localhost:5000/device-categories').then(r => r.json()),
      fetch('http://localhost:5000/api/rooms').then(r => r.json())
    ])
      .then(([devicesData, categoriesData, roomsData]) => {
        setDevices(devicesData);
        setCategories(categoriesData);
        setRooms(roomsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  // ── FETCH DEVICE ATTRIBUTES ──
  const fetchDeviceAttributes = async (deviceId) => {
    try {
      const response = await fetch(`http://localhost:5000/devices/${deviceId}/attributes`);
      const data = await response.json();
      setDeviceAttributes(data);
    } catch (err) {
      console.error('❌ Error fetching attributes:', err);
    }
  };

  // ── FETCH ATTRIBUTE TEMPLATES ──
  const fetchTemplatesForCategory = async (categoryId) => {
    try {
      const response = await fetch(`http://localhost:5000/device-categories/${categoryId}/templates`);
      const data = await response.json();
      setAttributeTemplates(data);
    } catch (err) {
      console.error('❌ Error fetching templates:', err);
      setAttributeTemplates([]);
    }
  };

  // ── OPEN MODAL ──
  const openModal = (device = null) => {
    if (device) {
      setFormData({
        uid: device.uid,
        name: device.name,
        description: device.description || '',
        category_id: device.category_id || '',
        room_id: device.room_id || '',
        brand: device.brand || '',
        model: device.model || '',
        status: device.status,
        connectivity: device.connectivity || 'Wi-Fi',
        ip_address: device.ip_address || ''
      });
      setEditingId(device.id);
    } else {
      setFormData({
        uid: '', name: '', description: '', category_id: '', room_id: '',
        brand: '', model: '', status: 'Actif', connectivity: 'Wi-Fi', ip_address: ''
      });
      setEditingId(null);
    }
    setModalStep(1);
    setShowModal(true);
  };

  // ── CLOSE MODAL ──
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setModalStep(1);
  };

  // ── HANDLE FORM INPUT ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── SUBMIT FORM ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.uid || !formData.name) {
      alert('UID et nom sont requis');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `http://localhost:5000/devices/${editingId}`
        : 'http://localhost:5000/devices';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`❌ Erreur: ${result.message}`);
        return;
      }

      const devicesData = await fetch('http://localhost:5000/devices').then(r => r.json());
      setDevices(devicesData);
      closeModal();
      alert(`✅ ${editingId ? 'Objet modifié' : 'Objet créé'} avec succès!`);
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Erreur lors de la sauvegarde');
    }
  };

  // ── ADD/UPDATE ATTRIBUTE ──
  const handleAddAttribute = async (deviceId) => {
    if (!newAttribute.template_id || !newAttribute.attr_value) {
      alert('Sélectionne un paramètre et une valeur');
      return;
    }

    const template = attributeTemplates.find(t => t.id === parseInt(newAttribute.template_id));
    if (!template) {
      alert('Template non trouvé');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/devices/${deviceId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attr_key: template.attr_key,
          attr_value: newAttribute.attr_value,
          unit: template.attr_unit || ''
        })
      });

      if (!response.ok) {
        alert('Erreur lors de l\'ajout');
        return;
      }

      await fetchDeviceAttributes(deviceId);
      setNewAttribute({ template_id: '', attr_value: '' });
      alert('✅ Paramètre ajouté!');
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  // ── DELETE ATTRIBUTE ──
  const handleDeleteAttribute = async (deviceId, attrId) => {
    if (!window.confirm('Supprimer cet attribut?')) return;

    try {
      await fetch(`http://localhost:5000/devices/${deviceId}/attributes/${attrId}`, {
        method: 'DELETE'
      });
      await fetchDeviceAttributes(deviceId);
      alert('✅ Attribut supprimé!');
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  // ── DELETE DEVICE ──
  const handleDelete = async (deviceId) => {
    if (!window.confirm('Êtes-vous sûr?')) return;

    try {
      await fetch(`http://localhost:5000/devices/${deviceId}`, {
        method: 'DELETE'
      });
      setDevices(devices.filter(d => d.id !== deviceId));
      alert('✅ Objet supprimé!');
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  // ── TOGGLE STATUS ──
  const handleToggleStatus = async (deviceId, currentStatus) => {
    const newStatus = currentStatus === 'Actif' ? 'Inactif' : 'Actif';

    try {
      await fetch(`http://localhost:5000/devices/${deviceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setDevices(devices.map(d => d.id === deviceId ? { ...d, status: newStatus } : d));
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  // ── FILTER DEVICES ──
  const filteredDevices = devices.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       d.uid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !categoryFilter || d.category_id === parseInt(categoryFilter);
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // ── STATS ──
  const stats = {
    total: devices.length,
    actifs: devices.filter(d => d.status === 'Actif').length,
    inactifs: devices.filter(d => d.status === 'Inactif').length,
    maintenance: devices.filter(d => d.status === 'Maintenance').length,
    erreur: devices.filter(d => d.status === 'Erreur').length
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div className="admin-devices-page">
      {/* ── HEADER ── */}
      <section className="admin-header">
        <div>
          <h1>Gestion des Objets Connectés</h1>
          <p>Administrez les appareils IoT du campus</p>
        </div>
        <button className="btn-add-device" onClick={() => openModal()}>
          ➕ Nouvel objet
        </button>
      </section>

      {/* ── STATS ── */}
      <section className="stats-grid">
        <div className="stat-card total">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card actif">
          <div className="stat-number">{stats.actifs}</div>
          <div className="stat-label">Actifs</div>
        </div>
        <div className="stat-card inactif">
          <div className="stat-number">{stats.inactifs}</div>
          <div className="stat-label">Inactifs</div>
        </div>
        <div className="stat-card maintenance">
          <div className="stat-number">{stats.maintenance}</div>
          <div className="stat-label">Maintenance</div>
        </div>
        <div className="stat-card erreur">
          <div className="stat-number">{stats.erreur}</div>
          <div className="stat-label">Erreurs</div>
        </div>
      </section>

      {/* ── FILTERS ── */}
      <section className="filters-section">
        <input
          type="text"
          placeholder="🔍 Rechercher par nom ou UID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
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

      {/* ── DEVICES LIST ── */}
      <section className="devices-section">
        <div className="section-header">
          <h2>Appareils ({filteredDevices.length})</h2>
        </div>

        {filteredDevices.length > 0 ? (
          <div className="devices-list">
            {filteredDevices.map(device => (
              <div key={device.id} className="device-item">
                <div className="device-info">
                  <h3>{device.name}</h3>
                  <p className="device-uid">{device.uid}</p>
                  <div className="device-meta">
                    <span>{device.category_name}</span>
                    <span>•</span>
                    <span>{device.room_name || 'Non assigné'}</span>
                  </div>
                </div>
                
                <div className="device-status">
                  <span className={`status-badge ${device.status.toLowerCase()}`}>
                    {device.status}
                  </span>
                </div>

                <div className="device-actions">
                  <button 
                    className="btn-icon toggle"
                    onClick={() => handleToggleStatus(device.id, device.status)}
                    title={device.status === 'Actif' ? 'Désactiver' : 'Activer'}
                  >
                    {device.status === 'Actif' ? '⏹️' : '▶️'}
                  </button>
                  <button 
                    className="btn-icon config"
                    onClick={() => {
                        console.log('Device:', device);
                        console.log('Category ID:', device.category_id);
                      setSelectedDeviceForAttributes(device.id);
                      fetchDeviceAttributes(device.id);
                      fetchTemplatesForCategory(device.category_id);
                    }}
                    title="Configurer les paramètres"
                  >
                    ⚙️
                  </button>
                  <button 
                    className="btn-icon edit"
                    onClick={() => openModal(device)}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-icon delete"
                    onClick={() => handleDelete(device.id)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Aucun appareil trouvé</p>
            <p style={{ fontSize: '0.9rem', color: '#a0aec0' }}>Ajuste tes filtres ou crée un nouvel objet</p>
          </div>
        )}
      </section>

      {/* ── MODAL: CREATE/EDIT DEVICE ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Modifier l\'objet' : 'Créer un nouvel objet'}</h2>
              <button className="btn-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              {modalStep === 1 && (
                <div className="modal-content">
                  <h3>Informations de base</h3>
                  <input
                    type="text"
                    name="uid"
                    placeholder="UID (identifiant unique)*"
                    value={formData.uid}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Nom*"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Sélectionner une catégorie*</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Sélectionner une salle</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 2: Advanced */}
              {modalStep === 2 && (
                <div className="modal-content">
                  <h3>Paramètres avancés</h3>
                  <input
                    type="text"
                    name="brand"
                    placeholder="Marque"
                    value={formData.brand}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    name="model"
                    placeholder="Modèle"
                    value={formData.model}
                    onChange={handleInputChange}
                  />
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Erreur">Erreur</option>
                  </select>
                  <select
                    name="connectivity"
                    value={formData.connectivity}
                    onChange={handleInputChange}
                  >
                    <option value="Wi-Fi">Wi-Fi</option>
                    <option value="Bluetooth">Bluetooth</option>
                    <option value="Zigbee">Zigbee</option>
                    <option value="Z-Wave">Z-Wave</option>
                    <option value="Ethernet">Ethernet</option>
                    <option value="LoRa">LoRa</option>
                  </select>
                  <input
                    type="text"
                    name="ip_address"
                    placeholder="Adresse IP"
                    value={formData.ip_address}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <div className="modal-actions">
                {modalStep === 2 && (
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setModalStep(1)}
                  >
                    ← Retour
                  </button>
                )}
                {modalStep === 1 && (
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setModalStep(2)}
                  >
                    Suivant →
                  </button>
                )}
                {modalStep === 2 && (
                  <button type="submit" className="btn-primary">
                    {editingId ? '✏️ Modifier' : '➕ Créer'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIGURE ATTRIBUTES ── */}
      {selectedDeviceForAttributes && (
        <div className="modal-overlay" onClick={() => setSelectedDeviceForAttributes(null)}>
          <div className="modal attributes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Paramètres de {devices.find(d => d.id === selectedDeviceForAttributes)?.name}</h2>
              <button className="btn-close" onClick={() => setSelectedDeviceForAttributes(null)}>✕</button>
            </div>

            <div className="modal-content">
              {attributeTemplates.length > 0 ? (
                <div className="attribute-form">
                  <h3>Ajouter un paramètre</h3>
                  <div className="attribute-inputs">
                    <select
                      name="template_id"
                      value={newAttribute.template_id}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, template_id: e.target.value }))}
                    >
                      <option value="">Sélectionner un paramètre...</option>
                      {attributeTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.attr_label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="attr_value"
                      placeholder="Valeur"
                      value={newAttribute.attr_value}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, attr_value: e.target.value }))}
                    />
                    <button
                      className="btn-primary"
                      onClick={() => handleAddAttribute(selectedDeviceForAttributes)}
                    >
                      ➕ Ajouter
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#a0aec0' }}>Aucun paramètre disponible pour cette catégorie</p>
              )}

              <div className="attributes-list">
                <h3>Paramètres actuels</h3>
                {deviceAttributes.length > 0 ? (
                  <div className="attr-cards">
                    {deviceAttributes.map(attr => (
                      <div key={attr.id} className="attr-card">
                        <div>
                          <strong>{attr.attr_key.replace(/_/g, ' ').toUpperCase()}</strong>
                          <p>{attr.attr_value} {attr.unit || ''}</p>
                        </div>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDeleteAttribute(selectedDeviceForAttributes, attr.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#a0aec0' }}>Aucun paramètre configuré</p>
                )}
              </div>

              {/* DEVICE HISTORY */}
              <DeviceHistory 
                deviceId={selectedDeviceForAttributes} 
                deviceName={devices.find(d => d.id === selectedDeviceForAttributes)?.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDevices;