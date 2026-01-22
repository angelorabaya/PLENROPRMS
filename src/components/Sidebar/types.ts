// Types for Sidebar navigation structure

export interface SubMenuItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<{ size?: number | string }>;
  /** Optional notification badge count */
  badge?: number;
}

export interface MenuItem {
  id: string;
  label: string;
  path?: string; // Optional - only for items without children
  icon: React.ComponentType<{ size?: number | string }>;
  children?: SubMenuItem[];
  /** Optional notification badge count */
  badge?: number;
}

export interface UserProfile {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface SidebarProps {
  /** Whether the sidebar is open (for mobile responsiveness) */
  isOpen?: boolean;
  /** Callback when sidebar should close (mobile) */
  onClose?: () => void;
  /** Current active route path */
  activePath?: string;
  /** Callback when a menu item is clicked */
  onNavigate?: (path: string) => void;
  /** Whether sidebar is collapsed to icon-only mode */
  isCollapsed?: boolean;
  /** Callback to toggle collapsed state */
  onToggleCollapse?: () => void;
  /** User profile information */
  user?: UserProfile;
  /** Callback when user clicks logout */
  onLogout?: () => void;
}
