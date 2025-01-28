import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';


const App = () => {
  const [data, setData] = useState(() => []);
  const [filters, setFilters] = useState({
    year: 'all',
    rating: 'all',
    tags: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const handleImageError = (e) => {
    // Oculta todo el contenedor de la imagen
    e.target.parentElement.style.display = 'none';
  };
// Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.csv');
        const reader = response.body.getReader();
        const result = await reader.read();
        const decoder = new TextDecoder('utf-8');
        const csvData = decoder.decode(result.value);
        
        Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const formattedData = results.data.map(item => ({
              ...item,
              // Corrige los tags
              tags: item.tags 
                ? item.tags
                    .replace(/[\[\]']/g, '') // Elimina corchetes y comillas
                    .split(',')
                    .map(t => t.trim())
                : [],
              // Asegura los otros campos
              title: item.title?.trim() || 'Título desconocido',
              description: item.description?.trim() || 'Descripción no disponible',
              rating: parseFloat(item.rating) || 0,
              year: parseInt(item.year) || 0,
              cover: item.cover?.trim() || ''
            }));
            
            setData(formattedData);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Obtener tags únicos
  const allTags = [...new Set(data.flatMap(item => item.tags))].sort();

  // Filtrar tags según búsqueda
  const filteredTags = allTags.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );
    // Manejar selección de tags
    const handleTagSelect = (tag) => {
      setFilters(prev => ({
        ...prev,
        tags: prev.tags.includes(tag) 
          ? prev.tags.filter(t => t !== tag) 
          : [...prev.tags, tag]
      }));
    };
  // Lógica de filtrado actualizada
  const filteredData = data.filter(item => {
    return (
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filters.year === 'all' || item.year === Number(filters.year)) &&
      (filters.rating === 'all' || item.rating >= Number(filters.rating)) &&
      (filters.tags.length === 0 || 
        filters.tags.every(tag => item.tags.includes(tag)))
    );
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      year: 'all',
      rating: 'all',
      tags: [] // Corregir de 'tag' a 'tags'
    });
    setSearchTerm('');
    setTagSearch('');
  };

  const getUniqueOptions = (key) => {
    if (!Array.isArray(data)) return [];
    
    return [...new Set(
      data.flatMap(item => {
        if (key === 'tags') return item.tags || [];
        return item[key] !== undefined ? item[key] : [];
      })
    )].sort();
  };

  const renderRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => {
      const starType = index < Math.floor(rating) 
        ? 'full' 
        : index === Math.floor(rating) && rating % 1 !== 0 
          ? 'half' 
          : 'empty';
          
      const pathD = {
        full: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
        half: 'M12 2L9.19 8.62L2 9.24L7.45 14L5.82 21L12 17.27V2Z',
        empty: 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z'
      }[starType];
  
      return (
        <svg
          key={index}
          className={`star ${starType}`}
          viewBox="0 0 24 24"
        >
          <path d={pathD} />
        </svg>
      );
    });
  };

  if (loading) {
    return <div className="loading">Cargando datos...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Biblioteca de Mangas/Manhuas/Manhwas</h1>
      </header>

      <div className="filters-container">
        {/* Barra de búsqueda principal */}
        <input
          type="text"
          placeholder="Buscar por título..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Selector de tags mejorado */}
        <div className="tags-filter">
          <div className="tags-search">
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
            />
        </div>
        <div className="tags-list">
            {filteredTags.map(tag => (
              <label key={tag} className="tag-checkbox">
                <input
                  type="checkbox"
                  checked={filters.tags.includes(tag)}
                  onChange={() => handleTagSelect(tag)}
                />
                <span className="checkmark"></span>
                {tag}
              </label>
            ))}
          </div>
          <div className="selected-tags">
            {filters.tags.map(tag => (
              <span key={tag} className="selected-tag">
                {tag}
                <button onClick={() => handleTagSelect(tag)}>×</button>
              </span>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <select name="year" value={filters.year} onChange={handleFilterChange}>
            <option value="all">Todos los años</option>
            {getUniqueOptions('year')
              .filter(year => !isNaN(year))
              .map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
          </select>

          <select name="rating" value={filters.rating} onChange={handleFilterChange}>
            <option value="all">Todas las valoraciones</option>
            {[5, 4, 3, 2, 1].map(num => (
              <option key={num} value={num}>{num}+ estrellas</option>
            ))}
          </select>

          

          <button onClick={resetFilters} className="reset-btn">Reiniciar filtros</button>
        </div>
      </div>
      
      {filteredData.length === 0 && (
      <div className="no-results">
      {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : "Cargando datos..."}
    </div>
)}
      <div className="grid-container">
        {filteredData.map(item => (
          <div key={item.title} className="card">
            <div className="card-media">
              <img 
                src={item.cover} 
                alt={item.title}
                onError={handleImageError}
                loading="lazy"
              />
            </div>
            <div className="card-content">
              <div className="card-header">
                <h3>{item.title}</h3>
                <div className="rating">{renderRatingStars(item.rating)}</div>
              </div>
              <div className="card-body">
                <p className="description">{item.description}</p>
                <div className="meta-info">
                  <p><strong>Año:</strong> {item.year}</p>
                  <p className="tags">
                    <strong>Tags:</strong> 
                    {item.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;