import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Globe, Image, Github } from "lucide-react";
import { I18nProvider, useI18n } from "@/lib/i18n-simple";
import TopBar from "@/components/top-bar";
import { getColor, getBorderRadius, getSpacing, getTypography } from "@/lib/design-system";

// Mock places data with better spacing
const places = [
  {
    id: "aotearoa",
    name: "Aotearoa",
    description: "Pictogramas culturalmente adaptativos para la cultura māori de Nueva Zelanda",
    pictogramCount: 24,
    language: "Māori / English",
    color: "#2E7D32"
  },
  {
    id: "tea-chile", 
    name: "TEA Chile",
    description: "Comunicación aumentativa especializada para personas con Trastorno del Espectro Autista",
    pictogramCount: 18,
    language: "Español",
    color: "#1976D2"
  },
  {
    id: "lectogram",
    name: "Lectogram", 
    description: "Herramientas de lectoescritura visual para el aprendizaje temprano",
    pictogramCount: 32,
    language: "Multilingual",
    color: "#7B1FA2"
  },
  {
    id: "mapuche",
    name: "Mapuche Kimün",
    description: "Pictogramas que preservan y transmiten el conocimiento mapuche", 
    pictogramCount: 15,
    language: "Mapudungún",
    color: "#F57C00"
  }
];

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    // Check for dark mode preference
    const darkModePreference = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(darkModePreference);
  }, []);

  // Detect scroll to show/hide TopBar
  useEffect(() => {
    const handleScroll = () => {
      const jumbotronHeight = 300; // Height where jumbotron disappears
      setIsScrolled(window.scrollY > jumbotronHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode ? '#0f0f0f' : getColor('surface.main'),
      color: isDarkMode ? '#ffffff' : getColor('surface.onSurface'),
      fontFamily: 'var(--font-family-primary)',
      transition: 'all 300ms ease'
    }}>
      {/* TopBar - only shows when scrolled */}
      <TopBar 
        title="PictoNet"
        showOnScroll={true}
        isScrolled={isScrolled}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: getSpacing('xl') }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: getSpacing('4xl') }}>
          <h1 style={{
            fontSize: '57px',
            fontWeight: '400',
            lineHeight: '1.12',
            background: 'linear-gradient(135deg, #6750A4 0%, #7D5260 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: getSpacing('lg')
          }}>
            PictoNet
          </h1>
          <p style={{
            fontSize: '28px',
            fontWeight: '400',
            lineHeight: '1.29',
            color: isDarkMode ? '#b0b0b0' : getColor('surface.onVariant'),
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Plataforma global de pictogramas AAC culturalmente adaptativos
          </p>
        </div>

        {/* Search */}
        <div style={{ maxWidth: '600px', margin: `0 auto ${getSpacing('4xl')} auto` }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: getSpacing('lg'), 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: isDarkMode ? '#888' : getColor('surface.onVariant')
              }} 
            />
            <input
              type="text"
              placeholder="Buscar lugares, culturas o tipos de pictogramas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: getSpacing('lg'),
                paddingLeft: '50px',
                background: isDarkMode ? '#2d2d2d' : getColor('surface.main'),
                border: `2px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`,
                borderRadius: getBorderRadius('xl'),
                fontSize: '16px',
                color: isDarkMode ? '#ffffff' : getColor('surface.onSurface')
              }}
            />
          </div>
        </div>

        {/* Places Grid with improved spacing */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: getSpacing('2xl'), // Increased gap between cards
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {filteredPlaces.map((place) => (
            <Link key={place.id} href={`/place/${place.id}`}>
              <div
                style={{
                  background: isDarkMode ? '#2d2d2d' : getColor('surface.main'),
                  borderRadius: getBorderRadius('xl'),
                  padding: getSpacing('xl'),
                  boxShadow: isDarkMode 
                    ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                    : '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
                  border: `1px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`,
                  borderLeft: `4px solid ${place.color}`,
                  transition: 'all 200ms ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 8px 30px rgba(0, 0, 0, 0.4)' 
                    : '0 8px 30px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                    : '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: getSpacing('md'), marginBottom: getSpacing('md') }}>
                  <div 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: place.color 
                    }} 
                  />
                  <h3 style={{ 
                    fontSize: '24px',
                    fontWeight: '400',
                    lineHeight: '1.33',
                    margin: 0,
                    color: isDarkMode ? '#ffffff' : getColor('surface.onSurface')
                  }}>
                    {place.name}
                  </h3>
                </div>
                
                <p style={{ 
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '1.43',
                  color: isDarkMode ? '#b0b0b0' : getColor('surface.onVariant'),
                  marginBottom: getSpacing('lg')
                }}>
                  {place.description}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: getSpacing('xs') }}>
                    <Image size={16} style={{ color: place.color }} />
                    <span style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      color: isDarkMode ? '#888' : getColor('surface.onVariant')
                    }}>
                      {place.pictogramCount} pictogramas
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: getSpacing('xs') }}>
                    <Globe size={16} style={{ color: place.color }} />
                    <span style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      color: isDarkMode ? '#888' : getColor('surface.onVariant')
                    }}>
                      {place.language}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>


    </div>
  );
}

export default function HomeSimple() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}