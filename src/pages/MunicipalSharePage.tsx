import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  useColorModeValue,
  Badge,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  Button,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Heading,
  Icon,
} from '@chakra-ui/react';
import { FiPrinter } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

/**
 * Municipal Share record interface
 */
interface MunicipalShareRecord {
  RptYear: number;
  aop_mun: string;
  total_share: number;
  paid_amount: number;
  balance: number;
}

/**
 * Municipal Payment record interface
 */
interface MunicipalPaymentRecord {
  ms_ctrlno: string;
  ms_chkdate: string | null;
  ms_chkno: string | null;
  ms_mun: string;
  ms_natureofpayment: string | null;
  ms_year: number;
  msamount: number;
  ms_claimedby: string | null;
  ms_claimeddate: string | null;
  ms_datereturned: string | null;
}

/**
 * Format number as Philippine Peso currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date string
 */
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
};

/**
 * Municipal Share Summary Page
 */

/**
 * Monthly Share record interface
 */
interface MonthlyShareRecord {
  mo: string;
  share: number;
}

export const MunicipalSharePage = () => {
  const [data, setData] = useState<MunicipalShareRecord[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment Modal state
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();
  const [paymentDetails, setPaymentDetails] = useState<MunicipalPaymentRecord[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalShareRecord | null>(
    null
  );
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Monthly Modal state
  const { isOpen: isMonthlyOpen, onOpen: onMonthlyOpen, onClose: onMonthlyClose } = useDisclosure();
  const [monthlyDetails, setMonthlyDetails] = useState<MonthlyShareRecord[]>([]);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  // Print Preview Modal state
  const { isOpen: isPrintOpen, onOpen: onPrintOpen, onClose: onPrintClose } = useDisclosure();
  const printRef = useRef<HTMLDivElement>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableBg = useColorModeValue('gray.50', 'gray.900');
  const hoverBg = useColorModeValue('blue.50', 'blue.900');
  const modalBg = useColorModeValue('white', 'gray.800');

  // Fetch available years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/municipal-share/years`);
        const result = await response.json();

        if (result.success && result.data) {
          // Filter to only show years > 2023
          const filteredYears = result.data.filter((year: number) => year > 2023);
          setYears(filteredYears);
          // Set default to current year if available, otherwise first year
          const currentYear = new Date().getFullYear();
          if (filteredYears.includes(currentYear)) {
            setSelectedYear(currentYear);
          } else if (filteredYears.length > 0) {
            setSelectedYear(filteredYears[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch years:', err);
      }
    };

    fetchYears();
  }, []);

  // Fetch data when year changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/municipal-share?year=${selectedYear}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data || []);
        } else {
          setError(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Failed to connect to server. Please check if the backend is running.');
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedYear) {
      fetchData();
    }
  }, [selectedYear]);

  // Fetch payment details for modal
  const handlePaidClick = async (item: MunicipalShareRecord) => {
    setSelectedMunicipality(item);
    setIsLoadingPayments(true);
    setPaymentDetails([]);
    onPaymentOpen();

    try {
      const response = await fetch(
        `${API_BASE_URL}/municipal-payment?year=${item.RptYear}&municipality=${encodeURIComponent(item.aop_mun)}`
      );
      const result = await response.json();

      if (result.success) {
        setPaymentDetails(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Fetch monthly share details for modal
  const handleMonthlyClick = async (item: MunicipalShareRecord) => {
    setSelectedMunicipality(item);
    setIsLoadingMonthly(true);
    setMonthlyDetails([]);
    onMonthlyOpen();

    try {
      const response = await fetch(
        `${API_BASE_URL}/municipal-share/monthly?year=${item.RptYear}&municipality=${encodeURIComponent(item.aop_mun)}`
      );
      const result = await response.json();

      if (result.success) {
        setMonthlyDetails(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch monthly share details:', err);
    } finally {
      setIsLoadingMonthly(false);
    }
  };

  // Handle print preview
  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=600');

    if (printWindow) {
      printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Municipal Share Report - ${selectedYear}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px; 
                            color: #000;
                            font-size: 11px;
                        }
                        .print-header {
                            text-align: center;
                            margin-bottom: 20px;
                            padding-bottom: 10px;
                            border-bottom: 2px solid #000;
                        }
                        .print-header h1 { 
                            font-size: 18px; 
                            font-weight: bold; 
                            margin-bottom: 5px;
                        }
                        .print-header h2 { 
                            font-size: 14px; 
                            font-weight: normal;
                            color: #333;
                        }
                        .summary-section {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 20px;
                            padding: 10px;
                            background: #f5f5f5;
                            border: 1px solid #ddd;
                        }
                        .summary-item {
                            text-align: center;
                        }
                        .summary-label {
                            font-size: 10px;
                            color: #666;
                            text-transform: uppercase;
                        }
                        .summary-value {
                            font-size: 14px;
                            font-weight: bold;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-bottom: 20px;
                        }
                        th, td { 
                            border: 1px solid #333; 
                            padding: 6px 8px; 
                            text-align: left; 
                        }
                        th { 
                            background: #e0e0e0; 
                            font-weight: bold;
                            font-size: 10px;
                            text-transform: uppercase;
                        }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .total-row { 
                            background: #f0f0f0; 
                            font-weight: bold;
                        }
                        .print-footer {
                            margin-top: 30px;
                            padding-top: 10px;
                            border-top: 1px solid #ddd;
                            font-size: 10px;
                            color: #666;
                            text-align: center;
                        }
                        @media print {
                            body { padding: 0; }
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <div class="print-footer">
                        Printed on: ${new Date().toLocaleString('en-PH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </div>
                </body>
                </html>
            `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Calculate totals
  const totalShare = data.reduce((sum, item) => sum + (item.total_share || 0), 0);
  const totalPaid = data.reduce((sum, item) => sum + (item.paid_amount || 0), 0);
  const totalBalance = data.reduce((sum, item) => sum + (item.balance || 0), 0);

  return (
    <Box>
      {/* Summary Stats with Year Filter */}
      <Card bg={cardBg} mb={6} boxShadow="sm">
        <CardBody>
          <Flex align="center" gap={6} flexWrap="wrap">
            {/* Year Filter */}
            <FormControl maxW="120px" minW="100px">
              <FormLabel fontSize="xs" mb={1} color="gray.500">
                Year
              </FormLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                bg={cardBg}
                borderColor={borderColor}
                size="sm"
                fontWeight="bold"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </FormControl>

            <StatGroup flex={1}>
              <Stat>
                <StatLabel color="gray.500">Total Municipalities</StatLabel>
                <StatNumber>{data.length}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.500">Total Share</StatLabel>
                <StatNumber fontSize="xl" color="green.500">
                  {formatCurrency(totalShare)}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.500">Total Paid</StatLabel>
                <StatNumber fontSize="xl" color="blue.500">
                  {formatCurrency(totalPaid)}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.500">Total Balance</StatLabel>
                <StatNumber fontSize="xl" color={totalBalance > 0 ? 'orange.500' : 'green.500'}>
                  {formatCurrency(totalBalance)}
                </StatNumber>
              </Stat>
            </StatGroup>
          </Flex>
        </CardBody>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6} borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Data Table */}
      <Card bg={cardBg} boxShadow="sm">
        <CardHeader pb={0}>
          <HStack justify="space-between">
            <Heading size="md">Municipal Share Details</Heading>
            <HStack spacing={3}>
              <Button
                leftIcon={<Icon as={FiPrinter} />}
                colorScheme="teal"
                size="sm"
                onClick={onPrintOpen}
                isDisabled={isLoading || data.length === 0}
              >
                Print Preview
              </Button>
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                Year: {selectedYear}
              </Badge>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Flex justify="center" align="center" py={10}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text ml={4} color="gray.500">
                Loading data...
              </Text>
            </Flex>
          ) : data.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500" fontSize="lg">
                No data available for {selectedYear}
              </Text>
            </Box>
          ) : (
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead bg={tableBg}>
                  <Tr>
                    <Th>Municipality</Th>
                    <Th isNumeric>Share</Th>
                    <Th isNumeric>Paid Amount</Th>
                    <Th isNumeric>Balance</Th>
                    <Th>References</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.map((item, index) => {
                    const hasBalance = item.balance > 0;

                    return (
                      <Tr
                        key={`${item.aop_mun}-${index}`}
                        _hover={{ bg: hoverBg }}
                        transition="background 0.2s"
                      >
                        <Td fontWeight="semibold">{item.aop_mun}</Td>
                        <Td isNumeric fontWeight="semibold" color="green.600">
                          {formatCurrency(item.total_share)}
                        </Td>
                        <Td isNumeric fontWeight="medium" color="blue.600">
                          {formatCurrency(item.paid_amount)}
                        </Td>
                        <Td
                          isNumeric
                          fontWeight="semibold"
                          color={hasBalance ? 'orange.500' : 'green.500'}
                        >
                          {formatCurrency(item.balance)}
                        </Td>
                        <Td>
                          <ButtonGroup size="xs" spacing={2}>
                            <Button
                              colorScheme="purple"
                              variant="outline"
                              onClick={() => handleMonthlyClick(item)}
                            >
                              Monthly
                            </Button>
                            <Button
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => handlePaidClick(item)}
                            >
                              Paid
                            </Button>
                          </ButtonGroup>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Payment Details Modal */}
      <Modal isOpen={isPaymentOpen} onClose={onPaymentClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>
            <Heading size="md">Payment Details</Heading>
            {selectedMunicipality && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {selectedMunicipality.aop_mun} ({selectedMunicipality.RptYear})
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingPayments ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text ml={4} color="gray.500">
                  Loading payment details...
                </Text>
              </Flex>
            ) : paymentDetails.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.500" fontSize="lg">
                  No payment records found
                </Text>
              </Box>
            ) : (
              <>
                <HStack mb={4} spacing={4}>
                  <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                    {paymentDetails.length} payment(s)
                  </Badge>
                  <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                    Total:{' '}
                    {formatCurrency(paymentDetails.reduce((sum, p) => sum + (p.msamount || 0), 0))}
                  </Badge>
                </HStack>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg={tableBg}>
                      <Tr>
                        <Th>Payment</Th>
                        <Th isNumeric>Amount</Th>
                        <Th>Check Date</Th>
                        <Th>Check No.</Th>
                        <Th>Claimant</Th>
                        <Th>Claimed</Th>
                        <Th>Returned</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paymentDetails.map((payment, index) => (
                        <Tr key={payment.ms_ctrlno || index} _hover={{ bg: hoverBg }}>
                          <Td>{payment.ms_natureofpayment || '-'}</Td>
                          <Td isNumeric fontWeight="semibold" color="blue.600">
                            {formatCurrency(payment.msamount)}
                          </Td>
                          <Td>{formatDate(payment.ms_chkdate)}</Td>
                          <Td>{payment.ms_chkno || '-'}</Td>
                          <Td>{payment.ms_claimedby || '-'}</Td>
                          <Td>{formatDate(payment.ms_claimeddate)}</Td>
                          <Td>{formatDate(payment.ms_datereturned)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onPaymentClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Monthly Share Modal */}
      <Modal isOpen={isMonthlyOpen} onClose={onMonthlyClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>
            <Heading size="md">Monthly Share Breakdown</Heading>
            {selectedMunicipality && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {selectedMunicipality.aop_mun} ({selectedMunicipality.RptYear})
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingMonthly ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="xl" color="purple.500" thickness="4px" />
                <Text ml={4} color="gray.500">
                  Loading monthly data...
                </Text>
              </Flex>
            ) : monthlyDetails.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.500" fontSize="lg">
                  No monthly records found
                </Text>
              </Box>
            ) : (
              <>
                <HStack mb={4} spacing={4}>
                  <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                    {monthlyDetails.length} month(s)
                  </Badge>
                  <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                    Total:{' '}
                    {formatCurrency(monthlyDetails.reduce((sum, m) => sum + (m.share || 0), 0))}
                  </Badge>
                </HStack>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg={tableBg}>
                      <Tr>
                        <Th>Month</Th>
                        <Th isNumeric>Share</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {monthlyDetails.map((month, index) => (
                        <Tr key={month.mo || index} _hover={{ bg: hoverBg }}>
                          <Td fontWeight="medium">{month.mo}</Td>
                          <Td isNumeric fontWeight="semibold" color="green.600">
                            {formatCurrency(month.share)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onMonthlyClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Print Preview Modal */}
      <Modal isOpen={isPrintOpen} onClose={onPrintClose} size="full" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg="white" maxW="900px" mx="auto" my={4}>
          <ModalHeader>
            <HStack justify="space-between" w="100%">
              <Heading size="md" color="gray.800">
                Print Preview
              </Heading>
              <HStack spacing={3}>
                <Button leftIcon={<Icon as={FiPrinter} />} colorScheme="teal" onClick={handlePrint}>
                  Print
                </Button>
                <Button onClick={onPrintClose}>Close</Button>
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Printable Content Container */}
            <Box ref={printRef} color="black" bg="white">
              {/* Print Header */}
              <Box
                className="print-header"
                textAlign="center"
                mb={6}
                pb={4}
                borderBottom="2px solid black"
              >
                <Heading as="h1" size="lg" color="black" mb={2}>
                  Municipal Share Report
                </Heading>
                <Text as="h2" fontSize="md" color="gray.700">
                  Year {selectedYear}
                </Text>
              </Box>

              {/* Summary Section */}
              <Box
                className="summary-section"
                display="flex"
                justifyContent="space-around"
                mb={6}
                p={4}
                bg="gray.50"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
              >
                <VStack className="summary-item" spacing={1}>
                  <Text
                    className="summary-label"
                    fontSize="xs"
                    color="gray.600"
                    textTransform="uppercase"
                  >
                    Total Municipalities
                  </Text>
                  <Text className="summary-value" fontSize="lg" fontWeight="bold" color="black">
                    {data.length}
                  </Text>
                </VStack>
                <VStack className="summary-item" spacing={1}>
                  <Text
                    className="summary-label"
                    fontSize="xs"
                    color="gray.600"
                    textTransform="uppercase"
                  >
                    Total Share
                  </Text>
                  <Text className="summary-value" fontSize="lg" fontWeight="bold" color="green.600">
                    {formatCurrency(totalShare)}
                  </Text>
                </VStack>
                <VStack className="summary-item" spacing={1}>
                  <Text
                    className="summary-label"
                    fontSize="xs"
                    color="gray.600"
                    textTransform="uppercase"
                  >
                    Total Paid
                  </Text>
                  <Text className="summary-value" fontSize="lg" fontWeight="bold" color="blue.600">
                    {formatCurrency(totalPaid)}
                  </Text>
                </VStack>
                <VStack className="summary-item" spacing={1}>
                  <Text
                    className="summary-label"
                    fontSize="xs"
                    color="gray.600"
                    textTransform="uppercase"
                  >
                    Total Balance
                  </Text>
                  <Text
                    className="summary-value"
                    fontSize="lg"
                    fontWeight="bold"
                    color={totalBalance > 0 ? 'orange.500' : 'green.500'}
                  >
                    {formatCurrency(totalBalance)}
                  </Text>
                </VStack>
              </Box>

              {/* Data Table */}
              <Table
                size="sm"
                variant="simple"
                sx={{
                  '& th, & td': {
                    border: '1px solid',
                    borderColor: 'gray.400',
                    color: 'black',
                  },
                  '& th': {
                    bg: 'gray.200',
                    fontWeight: 'bold',
                    fontSize: 'xs',
                    textTransform: 'uppercase',
                    color: 'black',
                  },
                }}
              >
                <Thead>
                  <Tr>
                    <Th>Municipality</Th>
                    <Th className="text-right">Share</Th>
                    <Th className="text-right">Paid Amount</Th>
                    <Th className="text-right">Balance</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.map((item, index) => (
                    <Tr key={`print-${item.aop_mun}-${index}`}>
                      <Td fontWeight="semibold">{item.aop_mun}</Td>
                      <Td className="text-right font-bold" textAlign="right" fontWeight="semibold">
                        {formatCurrency(item.total_share)}
                      </Td>
                      <Td className="text-right" textAlign="right">
                        {formatCurrency(item.paid_amount)}
                      </Td>
                      <Td className="text-right font-bold" textAlign="right" fontWeight="semibold">
                        {formatCurrency(item.balance)}
                      </Td>
                    </Tr>
                  ))}
                  {/* Totals Row */}
                  <Tr className="total-row" bg="gray.100" fontWeight="bold">
                    <Td fontWeight="bold">TOTAL</Td>
                    <Td
                      className="text-right font-bold"
                      textAlign="right"
                      fontWeight="bold"
                      color="green.700"
                    >
                      {formatCurrency(totalShare)}
                    </Td>
                    <Td
                      className="text-right font-bold"
                      textAlign="right"
                      fontWeight="bold"
                      color="blue.700"
                    >
                      {formatCurrency(totalPaid)}
                    </Td>
                    <Td
                      className="text-right font-bold"
                      textAlign="right"
                      fontWeight="bold"
                      color={totalBalance > 0 ? 'orange.600' : 'green.700'}
                    >
                      {formatCurrency(totalBalance)}
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MunicipalSharePage;
