import { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Flex,
  Text,
  Heading,
  useDisclosure,
  useColorMode,
  useColorModeValue,
  useToast,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
} from '@chakra-ui/react';
import { FiMenu, FiMoon, FiSun, FiFileText, FiBriefcase, FiUsers } from 'react-icons/fi';
import { Sidebar } from './components/Sidebar';
import { BarangaySharePage } from './pages/BarangaySharePage';
import { BarangaySharePaymentPage } from './pages/BarangaySharePaymentPage';
import { MunicipalSharePaymentPage } from './pages/MunicipalSharePaymentPage';
import { PaymentCollectionsPage } from './pages/PaymentCollectionsPage';
import { MunicipalSharePage } from './pages/MunicipalSharePage';
import { LoginPage } from './pages/LoginPage';
import type { UserProfile } from './components/Sidebar/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { API_BASE_URL } from './config/api';

/**
 * PLENRO-PRMS Main Application
 */
function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const [activePath, setActivePath] = useState('/');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canCancelPayment, setCanCancelPayment] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    name: '',
    email: '',
    role: 'User',
    avatarUrl: undefined,
  });
  const [activePermitsCount, setActivePermitsCount] = useState<number>(0);
  const [totalCollections, setTotalCollections] = useState<number>(0);
  const [barangayShare, setBarangayShare] = useState<number>(0);
  const [municipalShare, setMunicipalShare] = useState<number>(0);
  const [chartData, setChartData] = useState<{ month: string; [key: string]: string | number }[]>(
    []
  );
  const [chartYears, setChartYears] = useState<{ current: number; previous: number }>({
    current: 0,
    previous: 0,
  });
  const toast = useToast();

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchActivePermits = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/active-permits`);
        const result = await response.json();
        if (result.success && result.data) {
          setActivePermitsCount(result.data.totalActivePermits);
        }
      } catch (err) {
        console.error('Failed to fetch active permits:', err);
      }
    };

    const fetchTotalCollections = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/total-collections`);
        const result = await response.json();
        if (result.success && result.data) {
          setTotalCollections(result.data.totalCollections);
        }
      } catch (err) {
        console.error('Failed to fetch total collections:', err);
      }
    };

    const fetchBarangayShare = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/barangay-share`);
        const result = await response.json();
        if (result.success && result.data) {
          setBarangayShare(result.data.barangayShare);
        }
      } catch (err) {
        console.error('Failed to fetch barangay share:', err);
      }
    };

    const fetchMunicipalShare = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/municipal-share`);
        const result = await response.json();
        if (result.success && result.data) {
          setMunicipalShare(result.data.municipalShare);
        }
      } catch (err) {
        console.error('Failed to fetch municipal share:', err);
      }
    };

    const fetchGrossCollections = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/gross-collections`);
        const result = await response.json();
        if (result.success && result.data) {
          const { currentYear, previousYear, data } = result.data;
          setChartYears({ current: currentYear, previous: previousYear });

          // Transform data for the chart
          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];

          const transformed = months.map((month, index) => {
            const monthNum = index + 1; // 1-12
            const currentData = data.find(
              (d: { yr: number; mo: number }) => d.yr === currentYear && d.mo === monthNum
            );
            const previousData = data.find(
              (d: { yr: number; mo: number }) => d.yr === previousYear && d.mo === monthNum
            );
            return {
              month: month,
              [currentYear]: currentData?.total || 0,
              [previousYear]: previousData?.total || 0,
            };
          });

          setChartData(transformed);
        }
      } catch (err) {
        console.error('Failed to fetch gross collections:', err);
      }
    };

    fetchActivePermits();
    fetchTotalCollections();
    fetchBarangayShare();
    fetchMunicipalShare();
    fetchGrossCollections();
  }, []);

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  const handleNavigate = (path: string) => {
    setActivePath(path);
    console.log('Navigate to:', path);
    // With React Router: navigate(path);
  };

  const handleLogout = () => {
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    setIsAuthenticated(false);
    setCanCancelPayment(false);
    setCurrentUser({ name: '', email: '', role: 'User', avatarUrl: undefined });
    localStorage.removeItem('currentUser');
  };

  // Handle login success
  const handleLogin = (username: string, name: string, logAccess: number | boolean) => {
    setIsAuthenticated(true);
    setCanCancelPayment(Number(logAccess) === 1 || logAccess === true);
    setCurrentUser({
      name: name,
      email: `${username}@plenro.gov.ph`,
      role: 'User',
      avatarUrl: undefined,
    });
    localStorage.setItem('currentUser', JSON.stringify({ username, name }));
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Get page title based on active path
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/': 'Dashboard',
      '/permit-extraction/barangay-share': 'Barangay Share (Summary)',
      '/permit-extraction/municipal-share': 'Municipal Share (Summary)',
      '/payments/barangay-share-payment': 'Barangay Share Payment',
      '/payments/municipal-share-payment': 'Municipal Share Payment',
      '/collections/payment-collections': 'Payment Collections',
    };
    return titles[activePath] || 'Page';
  };

  // Calculate sidebar width for main content margin
  const sidebarWidth = isSidebarCollapsed ? '70px' : '280px';

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Sidebar Component */}
      <Sidebar
        isOpen={isOpen}
        onClose={onClose}
        activePath={activePath}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <Box ml={{ base: 0, lg: sidebarWidth }} transition="margin-left 0.2s ease">
        {/* Top Header Bar */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          h="16"
          px={6}
          bg={headerBg}
          borderBottom="1px"
          borderColor={borderColor}
          position="sticky"
          top={0}
          zIndex="banner"
        >
          {/* Mobile Menu Button */}
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="ghost"
            display={{ base: 'flex', lg: 'none' }}
            onClick={onOpen}
            size="lg"
          />

          {/* Page Title */}
          <Heading size="md" display={{ base: 'none', md: 'block' }}>
            {getPageTitle()}
          </Heading>

          {/* Mobile Title */}
          <Text fontWeight="bold" fontSize="lg" display={{ base: 'block', md: 'none' }}>
            PLENRO-PRMS
          </Text>

          {/* Theme Toggle */}
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            variant="ghost"
            onClick={toggleColorMode}
            size="lg"
          />
        </Flex>

        {/* Page Content */}
        <Box p={{ base: 4, md: 8 }}>
          {/* Render page based on active path */}
          {activePath === '/permit-extraction/barangay-share' ? (
            <BarangaySharePage />
          ) : activePath === '/permit-extraction/municipal-share' ? (
            <MunicipalSharePage />
          ) : activePath === '/payments/barangay-share-payment' ? (
            <BarangaySharePaymentPage />
          ) : activePath === '/payments/municipal-share-payment' ? (
            <MunicipalSharePaymentPage />
          ) : activePath === '/collections/payment-collections' ? (
            <PaymentCollectionsPage canCancelPayment={canCancelPayment} />
          ) : (
            <>
              {/* Dashboard Stats - Only show on home */}
              {activePath === '/' && (
                <>
                  <Box mb={8}>
                    <Heading size="lg" mb={2} color={colorMode === 'light' ? 'gray.700' : 'white'}>
                      PLENRO
                    </Heading>
                    <Text fontSize="xl" color="gray.500">
                      Payment and Revenue Management System
                    </Text>
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                    <Card bg={cardBg} boxShadow="sm">
                      <CardBody>
                        <Stat>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <StatLabel color="gray.500">Total Active Permits</StatLabel>
                              <StatNumber>{activePermitsCount.toLocaleString()}</StatNumber>
                            </Box>
                            <Icon as={FiFileText} boxSize={10} color="blue.400" opacity={0.8} />
                          </Flex>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} boxShadow="sm">
                      <CardBody>
                        <Stat>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <StatLabel color="gray.500">
                                Collections ({chartYears.current || '...'})
                              </StatLabel>
                              <StatNumber>
                                {new Intl.NumberFormat('en-PH', {
                                  style: 'currency',
                                  currency: 'PHP',
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(totalCollections)}
                              </StatNumber>
                            </Box>
                            <Icon as={FiBriefcase} boxSize={10} color="green.400" opacity={0.8} />
                          </Flex>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} boxShadow="sm">
                      <CardBody>
                        <Stat>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <StatLabel color="gray.500">
                                Barangay Share ({chartYears.current || '...'})
                              </StatLabel>
                              <StatNumber>
                                {new Intl.NumberFormat('en-PH', {
                                  style: 'currency',
                                  currency: 'PHP',
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(barangayShare)}
                              </StatNumber>
                            </Box>
                            <Icon as={FiUsers} boxSize={10} color="purple.400" opacity={0.8} />
                          </Flex>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} boxShadow="sm">
                      <CardBody>
                        <Stat>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <StatLabel color="gray.500">
                                Municipal Share ({chartYears.current || '...'})
                              </StatLabel>
                              <StatNumber>
                                {new Intl.NumberFormat('en-PH', {
                                  style: 'currency',
                                  currency: 'PHP',
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(municipalShare)}
                              </StatNumber>
                            </Box>
                            <Icon as={FiBriefcase} boxSize={10} color="orange.400" opacity={0.8} />
                          </Flex>
                        </Stat>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  {/* Monthly Collections Chart */}
                  {chartData.length > 0 && (
                    <Card
                      bg={cardBg}
                      boxShadow="md"
                      mt={6}
                      borderRadius="xl"
                      border="1px"
                      borderColor={borderColor}
                    >
                      <CardBody>
                        <Flex justify="space-between" align="center" mb={4}>
                          <Heading size="md" color={colorMode === 'light' ? 'gray.700' : 'white'}>
                            Monthly Collections Comparison
                          </Heading>
                          <Flex gap={4}>
                            <Flex align="center" gap={2}>
                              <Box w={3} h={3} borderRadius="full" bg="gray.500" />
                              <Text fontSize="sm" color="gray.500">
                                {chartYears.previous}
                              </Text>
                            </Flex>
                            <Flex align="center" gap={2}>
                              <Box w={3} h={3} borderRadius="full" bg="green.500" />
                              <Text fontSize="sm" color="gray.500">
                                {chartYears.current}
                              </Text>
                            </Flex>
                          </Flex>
                        </Flex>
                        <Box height="350px">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={chartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                              <YAxis
                                tickFormatter={(value) =>
                                  new Intl.NumberFormat('en-PH', {
                                    notation: 'compact',
                                    compactDisplay: 'short',
                                  }).format(value)
                                }
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip
                                formatter={(value: number) =>
                                  new Intl.NumberFormat('en-PH', {
                                    style: 'currency',
                                    currency: 'PHP',
                                  }).format(value)
                                }
                                contentStyle={{
                                  backgroundColor: cardBg,
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey={chartYears.previous.toString()}
                                name={chartYears.previous.toString()}
                                stroke="#718096"
                                strokeWidth={2}
                                dot={{ fill: '#718096', r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                              <Line
                                type="monotone"
                                dataKey={chartYears.current.toString()}
                                name={chartYears.current.toString()}
                                stroke="#38A169"
                                strokeWidth={2}
                                dot={{ fill: '#38A169', r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default App;
