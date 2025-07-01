import React, { useState } from 'react';
import { Link } from 'wouter';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { getColor, getSpacing, getBorderRadius } from '@/lib/design-system';
import LanguageSelector from './language-selector';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  showOnScroll?: boolean;
  isScrolled?: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function TopBar({ 
  title = "PictoNet",
  subtitle,
  breadcrumbs,
  showOnScroll = false,
  isScrolled = false,
  isDarkMode = false,
  onToggleDarkMode
}: TopBarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // TODO: Connect to real auth

  // En modo showOnScroll, solo mostrar cuando isScrolled sea true
  const shouldShow = !showOnScroll || isScrolled;

  if (!shouldShow) return null;

  return (
    <>
      {/* TopBar */}
      <div style={{
        position: showOnScroll ? 'fixed' : 'static',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: isDarkMode ? '#1a1a1a' : getColor('surface.main'),
        borderBottom: `1px solid ${isDarkMode ? '#333' : getColor('outline.variant')}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${getSpacing('xl')}`,
        zIndex: 1000,
        boxShadow: showOnScroll ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
      }}>
        {/* Left - Logo/Title with Breadcrumbs */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: getSpacing('xs'),
              fontSize: '20px',
              fontWeight: '400',
              color: isDarkMode ? '#ffffff' : getColor('surface.onSurface'),
            }}>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {crumb.href ? (
                    <Link href={crumb.href} style={{ 
                      textDecoration: 'none', 
                      color: 'inherit',
                      cursor: 'pointer'
                    }}>
                      <span style={{ 
                        opacity: index === breadcrumbs.length - 1 ? 1 : 0.7,
                        fontWeight: index === breadcrumbs.length - 1 ? '500' : '400'
                      }}>
                        {crumb.label}
                      </span>
                    </Link>
                  ) : (
                    <span style={{ 
                      opacity: index === breadcrumbs.length - 1 ? 1 : 0.7,
                      fontWeight: index === breadcrumbs.length - 1 ? '500' : '400'
                    }}>
                      {crumb.label}
                    </span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <span style={{ opacity: 0.5, fontSize: '16px' }}> &gt; </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <Link href="/">
              <h1 style={{
                fontSize: '24px',
                fontWeight: '400',
                margin: 0,
                color: isDarkMode ? '#ffffff' : getColor('surface.onSurface'),
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                textDecoration: 'none'
              }}>
                {title}
              </h1>
            </Link>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p style={{
              fontSize: '14px',
              color: isDarkMode ? '#cccccc' : getColor('surface.onSurfaceVariant'),
              margin: '2px 0 0 0',
              whiteSpace: 'nowrap'
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right - Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: getSpacing('md')
        }}>
          {/* Language Selector */}
          <LanguageSelector />

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: getSpacing('sm'),
                borderRadius: getBorderRadius('md'),
                display: 'flex',
                alignItems: 'center',
                color: isDarkMode ? '#ffffff' : getColor('surface.onSurface')
              }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          )}

          {/* User Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{
                background: 'transparent',
                border: `2px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`,
                borderRadius: getBorderRadius('md'),
                padding: getSpacing('sm'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: getSpacing('xs'),
                color: isDarkMode ? '#ffffff' : getColor('surface.onSurface')
              }}
            >
              <User size={20} />
              <ChevronDown size={16} />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: getSpacing('xs'),
                background: isDarkMode ? '#2d2d2d' : getColor('surface.main'),
                border: `1px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`,
                borderRadius: getBorderRadius('md'),
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                zIndex: 1001
              }}>
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setShowUserDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: getSpacing('md'),
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: isDarkMode ? '#ffffff' : getColor('surface.onSurface'),
                        fontSize: '14px',
                        borderBottom: `1px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`
                      }}
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setShowUserDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: getSpacing('md'),
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: isDarkMode ? '#ffffff' : getColor('surface.onSurface'),
                        fontSize: '14px'
                      }}
                    >
                      Registrarse
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      style={{
                        width: '100%',
                        padding: getSpacing('md'),
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: isDarkMode ? '#ffffff' : getColor('surface.onSurface'),
                        fontSize: '14px',
                        borderBottom: `1px solid ${isDarkMode ? '#404040' : getColor('outline.variant')}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: getSpacing('sm')
                      }}
                    >
                      <Settings size={16} />
                      Configuración
                    </button>
                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        setShowUserDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: getSpacing('md'),
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: isDarkMode ? '#ffffff' : getColor('surface.onSurface'),
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: getSpacing('sm')
                      }}
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer when fixed positioned */}
      {showOnScroll && isScrolled && (
        <div style={{ height: '64px' }} />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            style={{
              background: isDarkMode ? '#2d2d2d' : getColor('surface.main'),
              borderRadius: getBorderRadius('xl'),
              padding: getSpacing('2xl'),
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                  // TODO: Implement real OAuth
                  setIsAuthenticated(true);
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

      {/* Click outside to close dropdown */}
      {showUserDropdown && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowUserDropdown(false)}
        />
      )}
    </>
  );
}