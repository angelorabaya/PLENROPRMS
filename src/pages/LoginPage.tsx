import { useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';
import { normalizeUserRole, type UserRole } from '../types/auth';

interface LoginPageProps {
  onLogin: (username: string, name: string, role: UserRole) => void;
}

interface LoginResponseData {
  username: string;
  name: string;
  role: UserRole;
  requiresPasswordChange?: boolean;
}

interface PendingMigration {
  username: string;
  currentPassword: string;
  name: string;
  role: UserRole;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingMigration, setPendingMigration] = useState<PendingMigration | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [migrationError, setMigrationError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');

  const resetMigrationState = () => {
    setPendingMigration(null);
    setNewPassword('');
    setConfirmPassword('');
    setMigrationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Login failed');
        return;
      }

      const data = result.data as LoginResponseData;
      const role = normalizeUserRole(data.role);

      if (data.requiresPasswordChange) {
        setPendingMigration({
          username: data.username,
          currentPassword: password,
          name: data.name,
          role,
        });
        setNewPassword('');
        setConfirmPassword('');
        setMigrationError('');
        return;
      }

      onLogin(data.username, data.name, role);
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pendingMigration) return;

    setMigrationError('');

    if (newPassword.length < 8) {
      setMigrationError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMigrationError('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: pendingMigration.username,
          currentPassword: pendingMigration.currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMigrationError(result.message || 'Unable to update password');
        return;
      }

      const data = result.data as LoginResponseData;
      const role = normalizeUserRole(data.role || pendingMigration.role);
      resetMigrationState();
      setPassword('');
      onLogin(data.username, data.name, role);
    } catch (err) {
      console.error('Password migration error:', err);
      setMigrationError('Unable to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <Flex minH="100vh" align="center" justify="center" bg={bgColor} p={4}>
        <Card
          bg={cardBg}
          boxShadow="xl"
          borderRadius="2xl"
          border="1px"
          borderColor={borderColor}
          w="full"
          maxW="420px"
        >
          <CardBody p={8}>
            <VStack spacing={6}>
              <VStack spacing={2} textAlign="center">
                <Heading size="lg" bgGradient="linear(to-r, blue.500, green.500)" bgClip="text">
                  PLENRO-PRMS
                </Heading>
                <Text color="gray.500" fontSize="sm">
                  Permit & Revenue Management System
                </Text>
              </VStack>

              {error && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <Box as="form" w="full" onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Username</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiUser color="gray" />
                      </InputLeftElement>
                      <Input
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toUpperCase())}
                        size="lg"
                        borderRadius="lg"
                        textTransform="uppercase"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Password</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiLock color="gray" />
                      </InputLeftElement>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="lg"
                        borderRadius="lg"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={showPassword ? <FiEyeOff /> : <FiEye />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    borderRadius="lg"
                    isLoading={isLoading}
                    loadingText="Logging in..."
                    mt={2}
                  >
                    Login
                  </Button>
                </VStack>
              </Box>

              <Text fontSize="xs" color="gray.500">
                © 2025 PLENRO-PRMS
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Flex>

      <Modal isOpen={!!pendingMigration} onClose={() => {}} closeOnOverlayClick={false} isCentered>
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>Change Password</ModalHeader>
          <ModalCloseButton isDisabled />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.500">
                Your account is still using the legacy password field. Set a new password with at
                least 8 characters to migrate it to `log_passhash`.
              </Text>

              {migrationError && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {migrationError}
                </Alert>
              )}

              <FormControl isRequired>
                <FormLabel fontSize="sm">New Password</FormLabel>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Confirm Password</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={handleChangePassword}
              isLoading={isUpdatingPassword}
              loadingText="Updating..."
            >
              Update Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LoginPage;
