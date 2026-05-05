import React, { useState, useMemo, useEffect } from 'react';
import componentData from '../data/Components.json';
import './ComponentLibrary.css';

const ComponentLibrary = () => {
  // State for theme — reads from localStorage on first render
  const [theme, setTheme] = useState(() => localStorage.getItem('el-theme') || 'dark');

  // Sync theme to localStorage and toggle class on <body>
  useEffect(() => {
    localStorage.setItem('el-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    // Cleanup: remove class when component unmounts
    return () => document.body.classList.remove('light-mode');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for category filtering
  const [selectedCategories, setSelectedCategories] = useState({
    'Resistors': false,
    'Capacitors': false,
    'Integrated Circuits': false,
  });

  // State for modal
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Helper for formatting keys (camelCase to Title Case)
  const formatKey = (key) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  // Handler for search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handler for category checkboxes
  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Derive the list of actively selected category names
  const activeCategories = useMemo(
    () => Object.keys(selectedCategories).filter(cat => selectedCategories[cat]),
    [selectedCategories]
  );

  // Filtered data: applies search AND category filters simultaneously (AND logic)
  const displayedComponents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return componentData.filter(component => {
      // --- Condition 1: Search term filter (case-insensitive) ---
      const matchesSearch =
        normalizedSearch === '' ||
        component.name.toLowerCase().includes(normalizedSearch) ||
        component.description.toLowerCase().includes(normalizedSearch) ||
        component.subCategory.toLowerCase().includes(normalizedSearch);

      // --- Condition 2: Category checkbox filter ---
      // If no categories are selected, this condition is always true
      const matchesCategory =
        activeCategories.length === 0 ||
        activeCategories.includes(component.category);

      // AND: both conditions must be satisfied
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategories]);

  return (
    <div className={`app-container ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Header / Top Bar */}
      <header className="top-bar">
        <input 
          type="text" 
          className="search-input"
          placeholder="Komponent ismi veya açıklamasına göre ara..." 
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
          aria-label="Tema değiştir"
        >
          <span className="theme-toggle-icon">
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          <span className="theme-toggle-label">
            {theme === 'dark' ? 'Aydınlık' : 'Karanlık'}
          </span>
        </button>
      </header>

      {/* Sidebar for Filtering */}
      <aside className="sidebar">
        <h3>Kategoriler</h3>
        <div className="filter-group">
          {Object.keys(selectedCategories).map(category => (
            <label key={category} className="filter-label">
              <input 
                type="checkbox" 
                checked={selectedCategories[category]}
                onChange={() => handleCategoryChange(category)}
              />
              {category}
            </label>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {displayedComponents.length > 0 ? (
          <div className="card-grid">
            {displayedComponents.map(component => (
              <div key={component.id} className="component-card" onClick={() => setSelectedComponent(component)}>
                <div className="card-category">{component.subCategory}</div>
                <h2 className="card-title">{component.name}</h2>
                <p className="card-description">{component.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-icon">🔍</p>
            <p className="empty-state-text">Aramanızla eşleşen komponent bulunamadı.</p>
            <p className="empty-state-hint">Farklı anahtar kelimeler deneyin veya kategori filtrelerini kaldırın.</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedComponent && (
        <div className="modal-backdrop" onClick={() => setSelectedComponent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedComponent(null)}>&times;</button>
            <div className="modal-header">
              <div className="card-category">{selectedComponent.subCategory}</div>
              <h2>{selectedComponent.name}</h2>
              <p>{selectedComponent.description}</p>
            </div>
            
            <div className="modal-body">
              <h3>Teknik Özellikler</h3>
              <div className="specifications-list">
                {Object.entries(selectedComponent.specifications).map(([key, value]) => {
                  if (key === 'formula') {
                    return (
                      <div key={key} className="spec-item formula-highlight">
                        <span className="spec-label">Formül:</span>
                        <span className="spec-value formula-text">{value}</span>
                      </div>
                    );
                  }
                  
                  if (key === 'pinConfiguration') {
                    return (
                      <div key={key} className="spec-item pin-config">
                        <span className="spec-label">Pin Yapısı ({value.pinCount} Pin):</span>
                        <div className="pin-list">
                          {value.pins.map(pin => (
                            <div key={pin.pin} className="pin-item">
                              <strong>Pin {pin.pin} ({pin.name}):</strong> {pin.function}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (Array.isArray(value)) {
                    return (
                      <div key={key} className="spec-item">
                        <span className="spec-label">{formatKey(key)}:</span>
                        <span className="spec-value">{value.join(', ')}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="spec-item">
                      <span className="spec-label">{formatKey(key)}:</span>
                      <span className="spec-value">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentLibrary;
