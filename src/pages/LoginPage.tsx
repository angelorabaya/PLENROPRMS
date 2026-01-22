import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Text,
  VStack,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

interface LoginPageProps {
  onLogin: (username: string, name: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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

      if (result.success) {
        onLogin(result.data.username, result.data.name);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            {/* Header */}
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" bgGradient="linear(to-r, blue.500, green.500)" bgClip="text">
                PLENRO-PRMS
              </Heading>
              <Text color="gray.500" fontSize="sm">
                Permit & Revenue Management System
              </Text>
            </VStack>

            {/* Error Alert */}
            {error && (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {/* Login Form */}
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
                      onChange={(e) => setUsername(e.target.value)}
                      size="lg"
                      borderRadius="lg"
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

            {/* Footer */}
            <Text fontSize="xs" color="gray.500">
              © 2025 PLENRO-PRMS
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default LoginPage;
