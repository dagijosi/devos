# Theme System Module

A robust, adaptable theme system for React applications, featuring support for **solid colors**, **gradients**, and **pattern** backgrounds. It seamlessly integrates with Tailwind CSS (v4) and provides easy-to-use context hooks and switcher components.

## 🚀 Features
- **Multiple Theme Types**: Support for Solid, Gradient, and Pattern-based themes.
- **Dynamic CSS Variables**: Automatically updates CSS variables on the `:root` element.
- **Tailwind Integration**: Pre-configured `styles.css` maps theme variables to Tailwind classes.
- **Persistence**: Automatically saves and loads the user's selected theme from `localStorage`.
- **System Preference**: Automatically defaults to a Dark Theme if the user's OS is in Dark Mode.
- **Easy Extension**: Type-safe theme definitions making it easy to add your own.

---

## 📦 Installation & Setup

1. **Copy the directory**:
   Copy the `theme-system` folder into your project's source directory (e.g., `src/theme-system`).

2. **Install Dependencies**:
   This module requires `react-icons` for the switcher UI.
   ```bash
   npm install react-icons
   ```

3. **Import System Styles**:
   In your main entry file (e.g., `src/main.tsx` or `src/App.tsx`), import the `styles.css` file **after** your main Tailwind/CSS import.

   ```tsx
   import './index.css'; // Your main CSS (containing @import "tailwindcss";)
   import './theme-system/styles.css'; // Theme system variables & overrides
   ```

4. **Add the Provider**:
   Wrap your application root with the `ThemeProvider`.

   ```tsx
   import { ThemeProvider } from './theme-system';

   function App() {
     return (
       <ThemeProvider>
         {/* Your Application Components */}
       </ThemeProvider>
     );
   }
   ```

---

## 🛠 Usage

### 1. Using Theme Colors (Tailwind)
The system maps CSS variables to Tailwind utility classes. You can use them directly in your components:

| Class Name | Maps To | Description |
|------------|---------|-------------|
| `bg-theme-background` | `--color-theme-background` | Main app background (solid) |
| `bg-theme-surface` | `--color-theme-surface` | Card/Panel background color |
| `text-theme-text` | `--color-theme-text` | Primary text color |
| `text-theme-icon` | `--color-theme-icon` | Primary icon/accent color |
| `border-theme-border` | `--color-theme-border` | Border color for dividers/inputs |

**Example:**
```tsx
<div className="bg-theme-surface border border-theme-border rounded-lg p-4">
  <h1 className="text-theme-text text-xl">Hello World</h1>
  <button className="bg-theme-icon text-white px-4 py-2 rounded">
    Action
  </button>
</div>
```

### 2. Using the Hook (`useTheme`)
Access the current theme state programmatically.

```tsx
import { useTheme } from './theme-system';

const MyComponent = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <div>
      <p>Current Theme: {currentTheme.name}</p>
      <button onClick={() => setTheme('dark-matter')}>
        Switch to Dark Matter
      </button>
    </div>
  );
};
```

### 3. Using the Theme Switcher
A pre-built UI component for switching themes.

```tsx
import { ThemeSwitcher } from './theme-system';

// Place it in your header, settings, or sidebar
<ThemeSwitcher />
```

---

## 🎨 Extending & Customizing

All themes are defined in `src/theme-system/themes.ts`. You can easily add your own.

### Theme Interface
```typescript
interface Theme {
  id: string;          // Unique ID (used for localStorage)
  name: string;        // Display name
  type: 'solid' | 'gradient' | 'pattern';
  colors: {
    background: string; // CSS color or Gradient string
    text: string;
    icon: string;
    border: string;
    surface: string;    // Background for elements on top of the main background
  };
  patternImage?: string; // Optional: URL or inline SVG/Gradient for patterns
  backgroundSize?: string; // Optional: 'cover', 'auto', or specific size (e.g. '20px 20px')
}
```

### Adding a New Theme
Open `themes.ts` and add a new object to the `themes` array:

```typescript
{
  id: 'my-new-theme',
  name: 'My New Theme',
  type: 'solid', // or 'gradient' or 'pattern'
  colors: {
    background: '#1a1a1a',
    text: '#ffffff',
    icon: '#ff0000',
    border: '#333333',
    surface: '#2a2a2a'
  }
}
```

### Theme Types Explained
- **Solid**: Simple flat background color.
- **Gradient**: `colors.background` should be a CSS linear-gradient string.
- **Pattern**: `colors.background` is the base color, and `patternImage` is overlayed (usually with `multiply` blend mode).

---

## 📚 Available Themes
The system comes with several built-in themes:

- **Solid**: Cyan Breeze, Deep Ocean, Frosted Cyan, Cyber Cyan, Dark Matter, Azure Day, Abyss Blue
- **Gradient**: Ocean Blue, Midnight Nebula
- **Pattern**: Paper Pattern, Grid Matrix, Graph Paper, Polka Dots, Carbon Fiber, Lavender Mist, Diagonal Stripes

---

## ⚠️ Troubleshooting

**Issues with Tailwind v4?**
Ensure `styles.css` is imported. If variables aren't picking up, check that your `index.css` includes `@import "tailwindcss";` and that `styles.css` defines the variables inside `:root`.

**Background Pattern Looking Weird?**
Check the `backgroundSize` property in the theme definition. For repeatable patterns like grids or dots, you often want fixed sizes (e.g., `20px 20px`). For textures, `cover` or `auto` might work best.
