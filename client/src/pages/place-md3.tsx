import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Settings, Palette, Book, Plus, Search, Grid, List, Filter, Github } from "lucide-react";
import { I18nProvider, useI18n } from "@/lib/i18n-simple";
import TopBar from "@/components/top-bar";
import { getColor, getBorderRadius, getSpacing, getTypography } from "@/lib/design-system";

// Mock data for places
const placesData = {
  aotearoa: {
    name: "Aotearoa",
    description: "Pictogramas culturalmente adaptativos para la cultura māori de Nueva Zelanda",
    language: "Māori / English",
    color: "#2E7D32",
    pictogramCount: 24,
    categories: ["familia", "hogar", "actividades", "emociones"],
    pictograms: [
      { id: 1, name: "cama", translation: "moenga", category: "hogar", svg: "<svg>...</svg>" },
      { id: 2, name: "persona", translation: "tangata", category: "familia", svg: "<svg>...</svg>" },
      { id: 3, name: "casa", translation: "whare", category: "hogar", svg: "<svg>...</svg>" },
      { id: 4, name: "familia", translation: "whānau", category: "familia", svg: "<svg>...</svg>" }
    ],
    styles: {
      "white-outline-black": { fill: "#ffffff", stroke: "#000000", strokeWidth: "3" },
      "black-outline-white": { fill: "#000000", stroke: "#ffffff", strokeWidth: "3" }
    }
  },
  "tea-chile": {
    name: "TEA Chile",
    description: "Comunicación aumentativa especializada para personas con Trastorno del Espectro Autista",
    language: "Español",
    color: "#1976D2",
    pictogramCount: 18,
    categories: ["rutinas", "emociones", "necesidades", "actividades"],
    pictograms: [
      { id: 1, name: "rutina mañana", translation: "rutina mañana", category: "rutinas", svg: "<svg>...</svg>" },
      { id: 2, name: "feliz", translation: "feliz", category: "emociones", svg: "<svg>...</svg>" },
      { id: 3, name: "comer", translation: "comer", category: "necesidades", svg: "<svg>...</svg>" }
    ],
    styles: {
      "high-contrast": { fill: "#000000", stroke: "#ffffff", strokeWidth: "4" },
      "soft-colors": { fill: "#3f51b5", stroke: "#1976d2", strokeWidth: "2" }
    }
  },
  lectogram: {
    name: "Lectogram",
    description: "Herramientas de lectoescritura visual para el aprendizaje temprano",
    language: "Multilingual",
    color: "#7B1FA2",
    pictogramCount: 32,
    categories: ["letras", "números", "palabras", "conceptos"],
    pictograms: [
      { id: 1, name: "letra A", translation: "A", category: "letras", svg: "<svg>...</svg>" },
      { id: 2, name: "número 1", translation: "1", category: "números", svg: "<svg>...</svg>" }
    ],
    styles: {
      "educational": { fill: "#7b1fa2", stroke: "#4a148c", strokeWidth: "2" }
    }
  },
  mapuche: {
    name: "Mapuche Kimün",
    description: "Pictogramas que preservan y transmiten el conocimiento mapuche",
    language: "Mapudungún",
    color: "#F57C00",
    pictogramCount: 15,
    categories: ["naturaleza", "ceremonias", "familia", "territorio"],
    pictograms: [
      { id: 1, name: "tierra", translation: "mapu", category: "naturaleza", svg: "<svg>...</svg>" },
      { id: 2, name: "gente", translation: "che", category: "familia", svg: "<svg>...</svg>" }
    ],
    styles: {
      "earth-tones": { fill: "#8d6e63", stroke: "#5d4037", strokeWidth: "3" }
    }
  }
};

function PlaceContent() {
  const [match, params] = useRoute("/place/:slug");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useI18n();

  const slug = params?.slug || "";
  const placeData = placesData[slug as keyof typeof placesData];

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark-theme');
  };

  const filteredPictograms = placeData?.pictograms.filter(pictogram => {
    const matchesSearch = pictogram.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pictogram.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || pictogram.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  if (!placeData) {
    return (
      <div style={{ padding: getSpacing('xl'), textAlign: 'center' }}>
        <h1>Lugar no encontrado</h1>
        <Link href="/">
          <button>Volver al inicio</button>
        </Link>
      </div>
    );
  }

  // Material Design 3 Styles
  const materialStyles = {
    container: {
      minHeight: '100vh',
      background: isDarkMode 
        ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      color: isDarkMode ? '#ffffff' : getColor('surface.onSurface'),
      fontFamily: 'var(--font-family-primary)',
      transition: 'all 300ms ease'
    },
    topBar: {
      background: isDarkMode ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${isDarkMode ? '#333' : getColor('outline.variant')}`,
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)'
    },
    header: {
      background: isDarkMode ? '#2d2d2d' : getColor('surface.main'),
      borderRadius: getBorderRadius('xl'),
      padding: getSpacing('xl'),
      marginBottom: getSpacing('xl'),
      boxShadow: isDarkMode 
        ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
        : '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
      border: `1px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`,
      borderLeft: `4px solid ${placeData.color}`
    },
    filterBar: {
      background: isDarkMode ? '#2d2d2d' : getColor('surface.main'),
      borderRadius: getBorderRadius('lg'),
      padding: getSpacing('md'),
      marginBottom: getSpacing('lg'),
      boxShadow: isDarkMode 
        ? '0 2px 10px rgba(0, 0, 0, 0.2)' 
        : '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
      border: `1px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`
    },
    pictogramCard: {
      background: isDarkMode ? '#2d2d2d' : getColor('surface.main'),
      borderRadius: getBorderRadius('lg'),
      padding: getSpacing('md'),
      boxShadow: isDarkMode 
        ? '0 2px 10px rgba(0, 0, 0, 0.2)' 
        : '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
      border: `1px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`,
      transition: 'all 200ms ease',
      cursor: 'pointer'
    },
    button: {
      padding: `${getSpacing('sm')} ${getSpacing('md')}`,
      background: getColor('primary.main'),
      color: getColor('primary.onPrimary'),
      border: 'none',
      borderRadius: getBorderRadius('md'),
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: getSpacing('xs'),
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 150ms ease'
    },
    authModal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    authCard: {
      background: isDarkMode ? '#2d2d2d' : getColor('surface.main'),
      borderRadius: getBorderRadius('xl'),
      padding: getSpacing('2xl'),
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)'
    }
  };

  return (
    <div style={materialStyles.container}>
      {/* Top Bar */}
      <TopBar 
        breadcrumbs={[
          { label: "PictoNet", href: "/" },
          { label: placeData.name }
        ]}
        subtitle={placeData.language}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      
      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: getSpacing('xl') }}>
        {/* Place Header */}
        <div style={materialStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: getSpacing('md'), marginBottom: getSpacing('md') }}>
            <div 
              style={{ 
                width: '16px', 
                height: '16px', 
                borderRadius: '50%', 
                background: placeData.color 
              }} 
            />
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              lineHeight: '1.25',
              margin: 0,
              color: isDarkMode ? '#ffffff' : getColor('surface.onSurface')
            }}>
              {placeData.name}
            </h1>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: isDarkMode ? '#888' : getColor('surface.onVariant'),
              background: isDarkMode ? '#404040' : getColor('surface.variant'),
              padding: `${getSpacing('xs')} ${getSpacing('sm')}`,
              borderRadius: getBorderRadius('sm')
            }}>
              {placeData.language}
            </span>
          </div>
          
          <p style={{
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
            color: isDarkMode ? '#b0b0b0' : getColor('surface.onVariant'),
            marginBottom: getSpacing('lg')
          }}>
            {placeData.description}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: getSpacing('lg') }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: isDarkMode ? '#888' : getColor('surface.onVariant')
            }}>
              {placeData.pictogramCount} pictogramas disponibles
            </span>
            <Link href="/editor">
              <button style={materialStyles.button}>
                <Plus size={16} />
                Crear Nuevo
              </button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={materialStyles.filterBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: getSpacing('md'), marginBottom: getSpacing('md') }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: getSpacing('sm'), 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: isDarkMode ? '#888' : getColor('surface.onVariant')
                }} 
              />
              <input
                type="text"
                placeholder="Buscar pictogramas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: `${getSpacing('sm')} ${getSpacing('sm')} ${getSpacing('sm')} 32px`,
                  background: isDarkMode ? '#404040' : getColor('surface.variant'),
                  border: `1px solid ${isDarkMode ? '#555' : getColor('outline.variant')}`,
                  borderRadius: getBorderRadius('md'),
                  fontSize: '14px',
                  color: isDarkMode ? '#ffffff' : getColor('surface.onSurface')
                }}
              />
            </div>

            {/* View Toggle */}
            <div style={{ display: 'flex', gap: getSpacing('xs') }}>
              <button
                style={{
                  ...materialStyles.button,
                  background: activeView === 'grid' ? getColor('primary.main') : 'transparent',
                  color: activeView === 'grid' ? getColor('primary.onPrimary') : (isDarkMode ? '#ffffff' : getColor('primary.main')),
                  border: `2px solid ${isDarkMode ? '#666' : getColor('primary.main')}`,
                  padding: getSpacing('sm')
                }}
                onClick={() => setActiveView('grid')}
              >
                <Grid size={16} />
              </button>
              <button
                style={{
                  ...materialStyles.button,
                  background: activeView === 'list' ? getColor('primary.main') : 'transparent',
                  color: activeView === 'list' ? getColor('primary.onPrimary') : (isDarkMode ? '#ffffff' : getColor('primary.main')),
                  border: `2px solid ${isDarkMode ? '#666' : getColor('primary.main')}`,
                  padding: getSpacing('sm')
                }}
                onClick={() => setActiveView('list')}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: getSpacing('xs'), flexWrap: 'wrap' }}>
            <button
              style={{
                ...materialStyles.button,
                background: selectedCategory === 'all' ? getColor('primary.main') : 'transparent',
                color: selectedCategory === 'all' ? getColor('primary.onPrimary') : (isDarkMode ? '#ffffff' : getColor('primary.main')),
                border: `2px solid ${isDarkMode ? '#666' : getColor('primary.main')}`,
                fontSize: '12px'
              }}
              onClick={() => setSelectedCategory('all')}
            >
              Todas
            </button>
            {placeData.categories.map(category => (
              <button
                key={category}
                style={{
                  ...materialStyles.button,
                  background: selectedCategory === category ? getColor('primary.main') : 'transparent',
                  color: selectedCategory === category ? getColor('primary.onPrimary') : (isDarkMode ? '#ffffff' : getColor('primary.main')),
                  border: `2px solid ${isDarkMode ? '#666' : getColor('primary.main')}`,
                  fontSize: '12px',
                  textTransform: 'capitalize'
                }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Pictograms Grid/List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeView === 'grid' 
            ? 'repeat(auto-fill, minmax(200px, 1fr))' 
            : '1fr',
          gap: getSpacing('md')
        }}>
          {filteredPictograms.map((pictogram) => (
            <div
              key={pictogram.id}
              style={materialStyles.pictogramCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isDarkMode 
                  ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isDarkMode 
                  ? '0 2px 10px rgba(0, 0, 0, 0.2)' 
                  : '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)';
              }}
            >
              {/* SVG Preview */}
              <div style={{
                width: '100%',
                height: activeView === 'grid' ? '120px' : '80px',
                background: isDarkMode ? '#404040' : '#f5f5f5',
                borderRadius: getBorderRadius('md'),
                marginBottom: getSpacing('sm'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDarkMode ? '#888' : '#666'
              }}>
                <Palette size={32} />
              </div>
              
              {/* Pictogram Info */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  margin: 0,
                  marginBottom: getSpacing('xs'),
                  color: isDarkMode ? '#ffffff' : getColor('surface.onSurface')
                }}>
                  {pictogram.name}
                </h3>
                
                <p style={{
                  fontSize: '14px',
                  color: isDarkMode ? '#b0b0b0' : getColor('surface.onVariant'),
                  margin: 0,
                  marginBottom: getSpacing('xs')
                }}>
                  {pictogram.translation}
                </p>
                
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: placeData.color,
                  background: isDarkMode ? '#333' : getColor('surface.variant'),
                  padding: `${getSpacing('xs')} ${getSpacing('sm')}`,
                  borderRadius: getBorderRadius('sm'),
                  textTransform: 'capitalize'
                }}>
                  {pictogram.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPictograms.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: getSpacing('4xl'),
            color: isDarkMode ? '#888' : getColor('surface.onVariant')
          }}>
            <Palette size={64} style={{ marginBottom: getSpacing('lg'), opacity: 0.5 }} />
            <h3 style={{ marginBottom: getSpacing('md') }}>No se encontraron pictogramas</h3>
            <p>Intenta ajustar los filtros o crear un nuevo pictograma.</p>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={materialStyles.authModal} onClick={() => setShowAuthModal(false)}>
          <div style={materialStyles.authCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: getSpacing('xl') }}>
              <h2 style={{ 
                fontSize: '28px',
                fontWeight: '400',
                margin: 0,
                color: isDarkMode ? '#ffffff' : getColor('surface.onSurface')
              }}>
                Iniciar Sesión
              </h2>
              <p style={{ 
                fontSize: '14px',
                color: isDarkMode ? '#b0b0b0' : getColor('surface.onVariant'),
                marginTop: getSpacing('sm')
              }}>
                Elige tu método preferido
              </p>
            </div>

            {/* OAuth Providers */}
            {[
              { name: 'Google', icon: '🔍', color: '#4285F4' },
              { name: 'GitHub', icon: '⚫', color: '#333333' },
              { name: 'Microsoft', icon: '🪟', color: '#00A4EF' },
              { name: 'Discord', icon: '💬', color: '#5865F2' }
            ].map((provider) => (
              <button
                key={provider.name}
                style={{
                  width: '100%',
                  padding: getSpacing('md'),
                  margin: `${getSpacing('xs')} 0`,
                  background: 'transparent',
                  border: `2px solid ${provider.color}`,
                  borderRadius: getBorderRadius('md'),
                  color: provider.color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: getSpacing('sm'),
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => {
                  console.log(`Auth with ${provider.name}`);
                  setShowAuthModal(false);
                }}
              >
                <span style={{ fontSize: '20px' }}>{provider.icon}</span>
                Continuar con {provider.name}
              </button>
            ))}

            <div style={{ textAlign: 'center', marginTop: getSpacing('lg') }}>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDarkMode ? '#888' : getColor('surface.onVariant'),
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={() => setShowAuthModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlaceMD3() {
  return (
    <I18nProvider>
      <PlaceContent />
    </I18nProvider>
  );
}