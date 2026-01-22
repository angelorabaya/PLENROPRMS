# Sidebar Component

A production-ready, accessible, and responsive sidebar navigation component built with React, TypeScript, and Chakra UI.

## Features

- ✅ **Accordion Behavior**: Only one menu can be expanded at a time
- ✅ **Responsive Design**: Fixed sidebar on desktop, drawer on mobile
- ✅ **Dark/Light Mode**: Automatic theme adaptation
- ✅ **Accessibility**: Proper ARIA attributes and keyboard navigation
- ✅ **TypeScript**: Full type safety
- ✅ **Smooth Animations**: Collapse/expand transitions

## Installation

### Prerequisites

Ensure you have these dependencies in your Vite + React + Chakra UI project:

```bash
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion react-icons
```

### File Structure

```
src/
└── components/
    └── Sidebar/
        ├── index.ts        # Barrel exports
        ├── types.ts        # TypeScript interfaces
        ├── menuConfig.ts   # Menu structure configuration
        ├── Sidebar.tsx     # Main component
        └── README.md       # This file
```

## Usage

### Basic Usage

```tsx
import { useState } from 'react';
import { Box, IconButton, useDisclosure } from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import { Sidebar } from './components/Sidebar';

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activePath, setActivePath] = useState('/');

  const handleNavigate = (path: string) => {
    setActivePath(path);
    // If using React Router:
    // navigate(path);
  };

  return (
    <Box>
      {/* Mobile Menu Button */}
      <IconButton
        aria-label="Open menu"
        icon={<FiMenu />}
        display={{ base: 'flex', lg: 'none' }}
        position="fixed"
        top={4}
        left={4}
        zIndex="overlay"
        onClick={onOpen}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={isOpen}
        onClose={onClose}
        activePath={activePath}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <Box ml={{ base: 0, lg: '280px' }} p={8}>
        <h1>Your Page Content</h1>
      </Box>
    </Box>
  );
}
```

### With React Router

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box>
      <Sidebar
        isOpen={isOpen}
        onClose={onClose}
        activePath={location.pathname}
        onNavigate={navigate}
      />
      <Box ml={{ base: 0, lg: '280px' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
```

## Customization

### Adding New Menu Items

Edit `menuConfig.ts` to add new items:

```tsx
export const menuItems: MenuItem[] = [
  // ... existing items
  {
    id: 'reports',
    label: 'Reports',
    icon: FiBarChart,
    children: [
      {
        id: 'monthly-report',
        label: 'Monthly Report',
        path: '/reports/monthly',
        icon: FiCalendar,
      },
    ],
  },
];
```

### Changing Sidebar Width

In `Sidebar.tsx`, modify the width prop:

```tsx
// Desktop width
<Box w="280px" ... >
```

### Custom Colors

The component uses Chakra's color mode values. To customize:

```tsx
const activeBg = useColorModeValue('brand.50', 'brand.900');
const activeColor = useColorModeValue('brand.600', 'brand.200');
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Controls drawer visibility (mobile) |
| `onClose` | `() => void` | - | Callback when drawer should close |
| `activePath` | `string` | `'/'` | Current active route path |
| `onNavigate` | `(path: string) => void` | - | Callback when menu item is clicked |

## Accessibility

- Uses semantic HTML (`nav`, `button`, `role="menu"`)
- Proper `aria-expanded` for collapsible items
- Focus states for keyboard navigation
- Screen reader friendly labels
