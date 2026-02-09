import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const BullishBananaPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
    },
  },

  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}',
    },

    formField: {
      paddingX: '1rem',
      paddingY: '0.75rem',
      borderRadius: '12px',
      focusRing: {
        width: '2px',
        style: 'solid',
        color: 'rgba(5, 150, 105, 0.2)',
        offset: '0',
        shadow: 'none',
      },
    },

    overlay: {
      modal: {
        borderRadius: '16px',
      },
    },

    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
        primary: {
          color: '#059669',
          contrastColor: '#ffffff',
          hoverColor: '#064e3b',
          activeColor: '#047857',
        },
        formField: {
          background: '#ffffff',
          borderColor: '#e2e8f0',
          hoverBorderColor: '#94a3b8',
          focusBorderColor: '#059669',
          color: '#1e293b',
          placeholderColor: '#94a3b8',
          filledBackground: '#f8fafc',
          filledHoverBackground: '#f8fafc',
          filledFocusBackground: '#ffffff',
        },
        content: {
          background: '#ffffff',
          hoverBackground: '#f8fafc',
          borderColor: '#e2e8f0',
          color: '#1e293b',
          hoverColor: '#1e293b',
        },
        text: {
          color: '#1e293b',
          hoverColor: '#1e293b',
          mutedColor: '#64748b',
          hoverMutedColor: '#475569',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
        primary: {
          color: '#34d399',
          contrastColor: '#0f172a',
          hoverColor: '#6ee7b7',
          activeColor: '#a7f3d0',
        },
        formField: {
          background: '#1e293b',
          borderColor: '#334155',
          hoverBorderColor: '#475569',
          focusBorderColor: '#34d399',
          color: '#f1f5f9',
          placeholderColor: '#64748b',
          filledBackground: '#1e293b',
          filledHoverBackground: '#253447',
          filledFocusBackground: '#1e293b',
        },
        content: {
          background: '#1e293b',
          hoverBackground: '#253447',
          borderColor: '#334155',
          color: '#f1f5f9',
          hoverColor: '#f1f5f9',
        },
        text: {
          color: '#f1f5f9',
          hoverColor: '#f1f5f9',
          mutedColor: '#94a3b8',
          hoverMutedColor: '#cbd5e1',
        },
      },
    },
  },

  components: {
    card: {
      root: {
        background: '{content.background}',
        borderRadius: '16px',
        color: '{content.color}',
        shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      },
      body: {
        padding: '1.25rem',
        gap: '0.5rem',
      },
    },

    button: {
      root: {
        borderRadius: '12px',
        label: {
          fontWeight: '600',
        },
      },
    },

    tag: {
      root: {
        fontSize: '0.7rem',
        fontWeight: '700',
        padding: '0.35rem 0.65rem',
        borderRadius: '6px',
      },
      colorScheme: {
        light: {
          success: {
            background: '#d1fae5',
            color: '#065f46',
          },
          danger: {
            background: '#fee2e2',
            color: '#991b1b',
          },
        },
        dark: {
          success: {
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
          },
          danger: {
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
          },
        },
      },
    },

    datatable: {
      header: {
        background: '{content.background}',
        borderColor: 'transparent',
        padding: '2rem',
      },
      headerCell: {
        background: '{surface.100}',
        borderColor: 'transparent',
        color: '{text.muted.color}',
        padding: '1.25rem 2rem',
      },
      row: {
        background: '{content.background}',
        hoverBackground: '{content.hover.background}',
        color: '{content.color}',
      },
      bodyCell: {
        borderColor: '{content.border.color}',
        padding: '1.5rem 2rem',
      },
      footer: {
        background: '{content.background}',
        borderColor: '{content.border.color}',
      },
      colorScheme: {
        light: {
          root: {
            borderColor: 'transparent',
          },
          headerCell: {
            background: '#f1f5f9',
          },
        },
        dark: {
          root: {
            borderColor: 'transparent',
          },
          headerCell: {
            background: '#162232',
          },
        },
      },
    },

    paginator: {
      root: {
        background: '{content.background}',
        borderRadius: '0',
        padding: '1.5rem',
      },
    },

    dialog: {
      root: {
        borderRadius: '16px',
      },
      header: {
        padding: '1.5rem',
      },
      content: {
        padding: '0 1.5rem 1.5rem 1.5rem',
      },
      footer: {
        padding: '0 1.5rem 1.5rem 1.5rem',
      },
    },

    popover: {
      root: {
        borderRadius: '20px',
      },
    },

    tooltip: {
      root: {
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
      },
      colorScheme: {
        light: {
          root: {
            background: '#1e293b',
            color: '#f8fafc',
          },
        },
        dark: {
          root: {
            background: '#1e293b',
            color: '#f8fafc',
          },
        },
      },
    },

    drawer: {
      root: {
        background: '{content.background}',
      },
    },
  },
});
