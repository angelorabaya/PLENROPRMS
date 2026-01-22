import { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  Icon,
  Flex,
  Collapse,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useBreakpointValue,
  Avatar,
  IconButton,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronRight, FiChevronLeft, FiLogOut, FiMenu } from 'react-icons/fi';
import type { MenuItem, SubMenuItem, SidebarProps, UserProfile } from './types';
import { menuItems } from './menuConfig';

// ============================================================================
// Sub-components
// ============================================================================

interface NotificationBadgeProps {
  count?: number;
  isCollapsed?: boolean;
}

/**
 * Notification badge component
 */
const NotificationBadge = ({ count, isCollapsed }: NotificationBadgeProps) => {
  if (!count || count <= 0) return null;

  return (
    <Badge
      colorScheme="red"
      borderRadius="full"
      px={isCollapsed ? 1 : 2}
      py={0.5}
      fontSize="xs"
      minW={isCollapsed ? 4 : 5}
      textAlign="center"
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

interface MenuItemButtonProps {
  item: MenuItem;
  isExpanded: boolean;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  hoverBg: string;
  activeBg: string;
  activeColor: string;
  textColor: string;
}

/**
 * Individual menu item button (top-level)
 */
const MenuItemButton = ({
  item,
  isExpanded,
  isActive,
  isCollapsed,
  onClick,
  hoverBg,
  activeBg,
  activeColor,
  textColor,
}: MenuItemButtonProps) => {
  const hasChildren = item.children && item.children.length > 0;

  const button = (
    <Flex
      as="button"
      type="button"
      w="full"
      align="center"
      justify={isCollapsed ? 'center' : 'space-between'}
      px={isCollapsed ? 2 : 4}
      py={3}
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s ease"
      bg={isActive && !hasChildren ? activeBg : 'transparent'}
      color={isActive && !hasChildren ? activeColor : textColor}
      _hover={{
        bg: isActive && !hasChildren ? activeBg : hoverBg,
        transform: isCollapsed ? 'none' : 'translateX(2px)',
      }}
      _focus={{
        outline: 'none',
        boxShadow: 'outline',
      }}
      onClick={onClick}
      aria-expanded={hasChildren ? isExpanded : undefined}
      role={hasChildren ? 'button' : 'menuitem'}
      position="relative"
    >
      <Flex align="center" gap={isCollapsed ? 0 : 3}>
        <Icon as={item.icon} boxSize={5} />
        {!isCollapsed && (
          <Text fontWeight="medium" fontSize="sm">
            {item.label}
          </Text>
        )}
      </Flex>

      {!isCollapsed && (
        <Flex align="center" gap={2}>
          <NotificationBadge count={item.badge} />
          {hasChildren && (
            <Icon
              as={isExpanded ? FiChevronDown : FiChevronRight}
              boxSize={4}
              transition="transform 0.2s ease"
            />
          )}
        </Flex>
      )}

      {/* Badge for collapsed mode */}
      {isCollapsed && item.badge && item.badge > 0 && (
        <Badge
          position="absolute"
          top={1}
          right={1}
          colorScheme="red"
          borderRadius="full"
          fontSize="2xs"
          minW={3}
          h={3}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {item.badge > 9 ? '9+' : item.badge}
        </Badge>
      )}
    </Flex>
  );

  if (isCollapsed) {
    return (
      <Tooltip label={item.label} placement="right" hasArrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};

interface SubMenuItemButtonProps {
  item: SubMenuItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  hoverBg: string;
  activeBg: string;
  activeColor: string;
  textColor: string;
}

/**
 * Sub-menu item button
 */
const SubMenuItemButton = ({
  item,
  isActive,
  isCollapsed,
  onClick,
  hoverBg,
  activeBg,
  activeColor,
  textColor,
}: SubMenuItemButtonProps) => {
  const button = (
    <Flex
      as="button"
      type="button"
      w="full"
      align="center"
      justify={isCollapsed ? 'center' : 'space-between'}
      gap={isCollapsed ? 0 : 3}
      px={isCollapsed ? 2 : 4}
      py={2.5}
      pl={isCollapsed ? 2 : 12}
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s ease"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : textColor}
      _hover={{
        bg: isActive ? activeBg : hoverBg,
        transform: isCollapsed ? 'none' : 'translateX(2px)',
      }}
      _focus={{
        outline: 'none',
        boxShadow: 'outline',
      }}
      onClick={onClick}
      role="menuitem"
    >
      <Flex align="center" gap={isCollapsed ? 0 : 3}>
        {item.icon && <Icon as={item.icon} boxSize={4} opacity={0.8} />}
        {!isCollapsed && (
          <Text fontSize="sm" fontWeight={isActive ? 'medium' : 'normal'}>
            {item.label}
          </Text>
        )}
      </Flex>
      {!isCollapsed && <NotificationBadge count={item.badge} />}
    </Flex>
  );

  if (isCollapsed) {
    return (
      <Tooltip label={item.label} placement="right" hasArrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};

interface UserProfileSectionProps {
  user: UserProfile;
  isCollapsed: boolean;
  onLogout?: () => void;
  borderColor: string;
  hoverBg: string;
}

/**
 * User profile section at the bottom of sidebar
 */
const UserProfileSection = ({
  user,
  isCollapsed,
  onLogout,
  borderColor,
  hoverBg,
}: UserProfileSectionProps) => {
  const userInfo = (
    <Flex
      p={isCollapsed ? 2 : 4}
      borderTop="1px"
      borderColor={borderColor}
      align="center"
      gap={3}
      justify={isCollapsed ? 'center' : 'flex-start'}
    >
      <Avatar
        size={isCollapsed ? 'sm' : 'sm'}
        name={user.name}
        src={user.avatarUrl}
        bg="blue.500"
        color="white"
      />
      {!isCollapsed && (
        <Box flex={1} minW={0}>
          <Text fontWeight="medium" fontSize="sm" isTruncated>
            {user.name}
          </Text>
          {user.role && (
            <Text fontSize="xs" color="gray.500" isTruncated>
              {user.role}
            </Text>
          )}
        </Box>
      )}
      {!isCollapsed && onLogout && (
        <Tooltip label="Logout" hasArrow>
          <IconButton
            aria-label="Logout"
            icon={<FiLogOut />}
            size="sm"
            variant="ghost"
            onClick={onLogout}
            _hover={{ bg: hoverBg, color: 'red.500' }}
          />
        </Tooltip>
      )}
    </Flex>
  );

  if (isCollapsed && onLogout) {
    return (
      <Box borderTop="1px" borderColor={borderColor}>
        <Tooltip label={user.name} placement="right" hasArrow>
          <Flex p={2} justify="center">
            <Avatar
              size="sm"
              name={user.name}
              src={user.avatarUrl}
              bg="blue.500"
              color="white"
              cursor="pointer"
            />
          </Flex>
        </Tooltip>
        <Tooltip label="Logout" placement="right" hasArrow>
          <Flex justify="center" pb={2}>
            <IconButton
              aria-label="Logout"
              icon={<FiLogOut />}
              size="sm"
              variant="ghost"
              onClick={onLogout}
              _hover={{ bg: hoverBg, color: 'red.500' }}
            />
          </Flex>
        </Tooltip>
      </Box>
    );
  }

  return userInfo;
};

// ============================================================================
// Main Sidebar Component
// ============================================================================

interface SidebarContentProps {
  activePath: string;
  onNavigate: (path: string) => void;
  expandedMenuId: string | null;
  setExpandedMenuId: (id: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  user?: UserProfile;
  onLogout?: () => void;
}

/**
 * Sidebar content - reused in both desktop and mobile views
 */
const SidebarContent = ({
  activePath,
  onNavigate,
  expandedMenuId,
  setExpandedMenuId,
  isCollapsed,
  onToggleCollapse,
  user,
  onLogout,
}: SidebarContentProps) => {
  // Theme-aware colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const logoColor = useColorModeValue('blue.600', 'blue.300');

  const handleMenuClick = useCallback(
    (item: MenuItem) => {
      if (item.children && item.children.length > 0) {
        // In collapsed mode, expand sidebar first
        if (isCollapsed && onToggleCollapse) {
          onToggleCollapse();
          setExpandedMenuId(item.id);
        } else {
          // Toggle accordion behavior - collapse others when opening new one
          setExpandedMenuId(expandedMenuId === item.id ? null : item.id);
        }
      } else if (item.path) {
        onNavigate(item.path);
      }
    },
    [expandedMenuId, setExpandedMenuId, onNavigate, isCollapsed, onToggleCollapse]
  );

  const handleSubMenuClick = useCallback(
    (subItem: SubMenuItem) => {
      onNavigate(subItem.path);
    },
    [onNavigate]
  );

  const isItemActive = useCallback(
    (item: MenuItem): boolean => {
      if (item.path) {
        return activePath === item.path;
      }
      // Check if any child is active
      return item.children?.some((child) => activePath === child.path) ?? false;
    },
    [activePath]
  );

  return (
    <Box
      h="full"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      transition="width 0.2s ease"
      w={isCollapsed ? '70px' : 'full'}
    >
      {/* Logo / Brand Header */}
      <Flex
        h="16"
        align="center"
        justify={isCollapsed ? 'center' : 'space-between'}
        px={isCollapsed ? 2 : 4}
        borderBottom="1px"
        borderColor={borderColor}
        flexShrink={0}
      >
        {!isCollapsed && (
          <Text fontSize="xl" fontWeight="bold" color={logoColor} letterSpacing="tight">
            PLENRO-PRMS
          </Text>
        )}
        {isCollapsed && (
          <Text fontSize="xl" fontWeight="bold" color={logoColor}>
            P
          </Text>
        )}
        {onToggleCollapse && (
          <Tooltip label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} hasArrow>
            <IconButton
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              icon={isCollapsed ? <FiMenu /> : <FiChevronLeft />}
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              display={{ base: 'none', lg: 'flex' }}
            />
          </Tooltip>
        )}
      </Flex>

      {/* Navigation Menu */}
      <VStack
        as="nav"
        role="navigation"
        aria-label="Main navigation"
        flex={1}
        overflowY="auto"
        py={4}
        px={isCollapsed ? 2 : 3}
        spacing={1}
        align="stretch"
      >
        {menuItems.map((item) => (
          <Box key={item.id}>
            <MenuItemButton
              item={item}
              isExpanded={expandedMenuId === item.id}
              isActive={isItemActive(item)}
              isCollapsed={isCollapsed}
              onClick={() => handleMenuClick(item)}
              hoverBg={hoverBg}
              activeBg={activeBg}
              activeColor={activeColor}
              textColor={textColor}
            />

            {/* Collapsible Sub-menu */}
            {item.children && item.children.length > 0 && !isCollapsed && (
              <Collapse in={expandedMenuId === item.id} animateOpacity>
                <VStack
                  mt={1}
                  spacing={1}
                  align="stretch"
                  role="menu"
                  aria-label={`${item.label} submenu`}
                >
                  {item.children.map((subItem) => (
                    <SubMenuItemButton
                      key={subItem.id}
                      item={subItem}
                      isActive={activePath === subItem.path}
                      isCollapsed={isCollapsed}
                      onClick={() => handleSubMenuClick(subItem)}
                      hoverBg={hoverBg}
                      activeBg={activeBg}
                      activeColor={activeColor}
                      textColor={textColor}
                    />
                  ))}
                </VStack>
              </Collapse>
            )}
          </Box>
        ))}
      </VStack>

      {/* User Profile Section */}
      {user && (
        <UserProfileSection
          user={user}
          isCollapsed={isCollapsed}
          onLogout={onLogout}
          borderColor={borderColor}
          hoverBg={hoverBg}
        />
      )}

      {/* Footer (only when no user) */}
      {!user && (
        <Box p={isCollapsed ? 2 : 4} borderTop="1px" borderColor={borderColor} flexShrink={0}>
          {!isCollapsed && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              © 2025 PLENRO-PRMS
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

/**
 * Main Sidebar component with responsive behavior
 * - Desktop: Fixed sidebar with collapsible mode
 * - Mobile: Drawer overlay
 */
export const Sidebar = ({
  isOpen = false,
  onClose,
  activePath = '/',
  onNavigate = () => {},
  isCollapsed = false,
  onToggleCollapse,
  user,
  onLogout,
}: SidebarProps) => {
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const handleNavigate = useCallback(
    (path: string) => {
      onNavigate(path);
      // Close drawer on mobile after navigation
      if (isMobile && onClose) {
        onClose();
      }
    },
    [onNavigate, isMobile, onClose]
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} placement="left" onClose={onClose || (() => {})} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton zIndex={10} />
          <DrawerBody p={0}>
            <SidebarContent
              activePath={activePath}
              onNavigate={handleNavigate}
              expandedMenuId={expandedMenuId}
              setExpandedMenuId={setExpandedMenuId}
              isCollapsed={false} // Never collapsed on mobile
              user={user}
              onLogout={onLogout}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <Box
      as="aside"
      w={isCollapsed ? '70px' : '280px'}
      h="100vh"
      position="fixed"
      left={0}
      top={0}
      zIndex="sticky"
      transition="width 0.2s ease"
    >
      <SidebarContent
        activePath={activePath}
        onNavigate={handleNavigate}
        expandedMenuId={expandedMenuId}
        setExpandedMenuId={setExpandedMenuId}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        user={user}
        onLogout={onLogout}
      />
    </Box>
  );
};

export default Sidebar;
