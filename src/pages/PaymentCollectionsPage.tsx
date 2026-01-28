import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Flex,
  Spinner,
  Text,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  HStack,
  Divider,
  Badge,
  InputGroup,
  InputLeftAddon,
  useToast,
  Grid,
  GridItem,
  Tooltip,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FiTrash2, FiPrinter, FiSave, FiDollarSign, FiCreditCard, FiXCircle, FiSettings } from 'react-icons/fi';

import { API_BASE_URL } from '../config/api';

/**
 * Fee item interface
 */
interface FeeItem {
  id: string;
  description: string;
  amount: number;
}

/**
 * Payment method interface
 */
interface PaymentMethod {
  id: string;
  mode: 'Cash' | 'Check';
  amount: number;
  description: string;
  checkDate: string;
  checkNo: string;
}

/**
 * Format number as Philippine Peso currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

import { ReceiptPreview } from '../components/ReceiptPreview';
import { PrinterCalibration } from '../components/PrinterCalibration';

/**
 * Payment Collections Page
 * Form for creating and managing payment collection records
 */
export const PaymentCollectionsPage = () => {
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('blue.600', 'blue.700');
  const tableBg = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const totalBg = useColorModeValue('green.50', 'green.900');
  const totalBorderColor = useColorModeValue('green.200', 'green.600');
  const toast = useToast();

  // Calibration Modal State
  const [showCalibration, setShowCalibration] = useState(false);

  // Receipt Preview State
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    clientName: string;
    date: string;
    items: Array<{ description: string; amount: number }>;
    totalAmount: number;
    payments: Array<{
      mode: string;
      amount: number;
      description?: string;
      checkDate?: string;
      checkNo?: string;
    }>;
    teller?: string;
  } | null>(null);

  // Form state
  const controlNoPrefix = 'AOP'; // Fixed prefix
  const [controlNoNumber, setControlNoNumber] = useState('');
  const controlNoInputRef = useRef<HTMLInputElement>(null);
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nature, setNature] = useState('');
  const [loading, setLoading] = useState(false);

  // Fee items state
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);

  // Payment methods state
  const [payments, setPayments] = useState<PaymentMethod[]>([]);

  // Banks state
  const [banks, setBanks] = useState<string[]>([]);

  // Fetch banks on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/collections/banks`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setBanks(result.data);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
      }
    };
    fetchBanks();
  }, []);

  // Official Receipt numbers
  const [orProvShare, setOrProvShare] = useState('');
  const [orMunShare, setOrMunShare] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  // Cancel confirmation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Calculated totals
  const feeTotal = feeItems.reduce((sum, item) => sum + item.amount, 0);
  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Reset form data when control number changes
  const resetFormData = () => {
    setClientName('');
    setNature('');
    setFeeItems([]);
    setPayments([]);
    setOrProvShare('');
    setOrMunShare('');
    setIsPaid(false);
  };

  // Handle control number change - reset form data
  const handleControlNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setControlNoNumber(newValue);
    // Reset all form data when control number is modified
    resetFormData();
  };

  // Add cash payment
  const handleAddCash = () => {
    const newPayment: PaymentMethod = {
      id: generateId(),
      mode: 'Cash',
      amount: 0,
      description: '',
      checkDate: '',
      checkNo: '',
    };
    setPayments([...payments, newPayment]);
  };

  // Add check payment
  const handleAddCheck = () => {
    const newPayment: PaymentMethod = {
      id: generateId(),
      mode: 'Check',
      amount: 0,
      description: '',
      checkDate: date,
      checkNo: '',
    };
    setPayments([...payments, newPayment]);
  };

  // Remove payment
  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  // Update payment
  const handleUpdatePayment = (id: string, field: keyof PaymentMethod, value: string | number) => {
    setPayments(payments.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  // Handle save and print
  const handleSaveAndPrint = async () => {
    if (!controlNoNumber || !clientName || !nature) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!orProvShare) {
      toast({
        title: 'Validation Error',
        description: 'Please enter the OR - Provincial Share number.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/collections/save/${controlNoNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orProvShare: orProvShare,
          date: date,
          payments: payments,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save payment');
      }

      // Save successful - increment OR number for next transaction
      const currentOrNo = parseInt(orProvShare, 10);
      const nextOrNo = (currentOrNo + 1).toString();

      toast({
        title: 'Saved Successfully',
        description: `Payment collection record has been saved. OR No. ${orProvShare}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Prepare receipt data before resetting
      setReceiptData({
        clientName,
        date,
        items: feeItems.map(f => ({ description: f.description, amount: f.amount })),
        totalAmount: feeTotal,
        payments: payments.map(p => ({
          mode: p.mode,
          amount: p.amount,
          description: p.description,
          checkDate: p.checkDate,
          checkNo: p.checkNo || ''
        })),
        teller: 'Admin', // Placeholder for now
      });
      setShowReceipt(true);

      // Reset form for next transaction, keeping the incremented OR number
      setControlNoNumber('');
      setClientName('');
      setNature('');
      setFeeItems([]);
      setPayments([]);
      setOrProvShare(nextOrNo);
      setOrMunShare('');
      setIsPaid(false);
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save payment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch assessment data based on control number
  const fetchAssessmentData = useCallback(async () => {
    if (!controlNoNumber || controlNoNumber.length < 5) {
      toast({
        title: 'Invalid Control Number',
        description: 'Please enter a valid control number (at least 5 characters)',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch assessment header data from API
      const headerResponse = await fetch(`${API_BASE_URL}/collections/lookup/${controlNoNumber}`);
      const headerResult = await headerResponse.json();

      if (!headerResponse.ok) {
        throw new Error(headerResult.message || 'Assessment record not found');
      }

      // Set client name and nature from API response
      setClientName(headerResult.data.clientName);
      setNature(headerResult.data.nature);

      let isRecordPaid = false;
      // Set OR numbers if available
      if (headerResult.data.orProvincialShare) {
        setOrProvShare(headerResult.data.orProvincialShare);
        isRecordPaid = true;
      }
      if (headerResult.data.orMunicipalShare) {
        setOrMunShare(headerResult.data.orMunicipalShare);
        isRecordPaid = true;
      }
      // Set date from orDate if record is paid
      if (headerResult.data.orDate) {
        setDate(headerResult.data.orDate);
      }
      setIsPaid(isRecordPaid);

      // Fetch fee breakdown data from API
      const feesResponse = await fetch(`${API_BASE_URL}/collections/fees/${controlNoNumber}`);
      const feesResult = await feesResponse.json();

      if (feesResponse.ok && feesResult.data?.fees) {
        // Set fee items from API response
        setFeeItems(feesResult.data.fees);

        // If paid, fetch payment details
        if (isRecordPaid) {
          const paymentsResponse = await fetch(
            `${API_BASE_URL}/collections/payments/${controlNoNumber}`
          );
          const paymentsResult = await paymentsResponse.json();
          if (paymentsResponse.ok && Array.isArray(paymentsResult.data)) {
            setPayments(paymentsResult.data);
          }
        } else {
          // Auto-add cash payment if no payments exist and not paid
          if (payments.length === 0) {
            const totalAmount =
              feesResult.data.total ||
              feesResult.data.fees.reduce((sum: number, f: FeeItem) => sum + f.amount, 0);
            setPayments([
              {
                id: generateId(),
                mode: 'Cash',
                amount: totalAmount,
                description: '',
                checkDate: '',
                checkNo: '',
              },
            ]);
          }
        }
      } else {
        // No fees found, clear fee items
        setFeeItems([]);
      }

      toast({
        title: 'Data Loaded',
        description: `Found record for ${headerResult.data.clientName}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error fetching assessment data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch assessment data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      // Clear fields on error
      setClientName('');
      setNature('');
      setFeeItems([]);
    } finally {
      setLoading(false);
    }
  }, [controlNoNumber, payments.length, toast]);

  // Handle Enter key press on control number input
  const handleControlNoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchAssessmentData();
    }
  };

  return (
    <Box maxW="1400px" mx="auto">
      {receiptData && (
        <ReceiptPreview
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          data={receiptData}
        />

      )}
      {showCalibration && (
        <PrinterCalibration
          isOpen={showCalibration}
          onClose={() => setShowCalibration(false)}
        />
      )}
      <Card
        bg={cardBg}
        borderRadius="xl"
        boxShadow="xl"
        overflow="hidden"
        border="1px"
        borderColor={borderColor}
      >
        {/* Header */}
        <CardHeader bg={headerBg} py={3} px={5}>
          <Flex justify="space-between" align="center">
            <Heading size="md" color="white" fontWeight="semibold">
              Payment Collection Form
            </Heading>
            <Button
              leftIcon={<FiSettings />}
              size="sm"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.300' }}
              onClick={() => setShowCalibration(true)}
            >
              Printer Settings
            </Button>
          </Flex>
        </CardHeader>


        <CardBody p={4}>
          {/* Form Fields Section */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={4}
            mb={4}
          >
            {/* Control Number */}
            <GridItem>
              <FormControl>
                <FormLabel color={labelColor} fontWeight="medium" mb={1} fontSize="sm">
                  Control No.
                </FormLabel>
                <InputGroup size="md">
                  <InputLeftAddon bg={tableBg} borderColor={borderColor} px={3}>
                    <Text fontWeight="bold" fontSize="sm">
                      {controlNoPrefix}
                    </Text>
                  </InputLeftAddon>
                  <Input
                    ref={controlNoInputRef}
                    value={controlNoNumber}
                    onChange={handleControlNoChange}
                    onKeyDown={handleControlNoKeyDown}
                    placeholder="Enter number, press Enter"
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                    }}
                    fontWeight="semibold"
                    letterSpacing="wider"
                  />
                </InputGroup>
              </FormControl>
            </GridItem>

            {/* Client Name */}
            <GridItem colSpan={{ base: 1, lg: 2 }}>
              <FormControl>
                <FormLabel color={labelColor} fontWeight="medium" mb={1} fontSize="sm">
                  Name
                </FormLabel>
                <Input
                  size="md"
                  value={clientName}
                  isReadOnly
                  bg={inputBg}
                  borderColor={borderColor}
                  fontWeight="medium"
                  _readOnly={{ cursor: 'default' }}
                />
              </FormControl>
            </GridItem>

            {/* Date */}
            <GridItem>
              <FormControl>
                <FormLabel color={labelColor} fontWeight="medium" mb={1} fontSize="sm">
                  Date
                </FormLabel>
                <Input
                  size="md"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: 'blue.400' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                  }}
                  isDisabled={isPaid}
                />
              </FormControl>
            </GridItem>

            {/* Nature of Payment */}
            <GridItem colSpan={{ base: 1, lg: 2 }}>
              <FormControl>
                <FormLabel color={labelColor} fontWeight="medium" mb={1} fontSize="sm">
                  Nature
                </FormLabel>
                <Input
                  size="md"
                  value={nature}
                  isReadOnly
                  bg={inputBg}
                  borderColor={borderColor}
                  fontWeight="medium"
                  _readOnly={{ cursor: 'default' }}
                />
              </FormControl>
            </GridItem>
          </Grid>

          {/* Total Display */}
          <Box
            bg={totalBg}
            p={3}
            borderRadius="lg"
            border="2px"
            borderColor={totalBorderColor}
            mb={4}
          >
            <Flex justify="space-between" align="center">
              <Text fontSize="md" fontWeight="medium" color={labelColor}>
                Total Amount
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                ₱ {formatCurrency(feeTotal)}
              </Text>
            </Flex>
          </Box>

          <Divider mb={4} />

          {/* Fee Items Table */}
          <Box mb={4}>
            <Heading size="sm" mb={2} color={labelColor}>
              Fee Breakdown
            </Heading>

            {loading ? (
              <Flex justify="center" py={8}>
                <Spinner size="lg" color="blue.500" />
              </Flex>
            ) : feeItems.length === 0 ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                Enter a control number to load fee items
              </Alert>
            ) : (
              <Box borderRadius="lg" overflow="hidden" border="1px" borderColor={borderColor}>
                <Table variant="simple">
                  <Thead bg={headerBg}>
                    <Tr>
                      <Th color="white" py={4} fontSize="sm" fontWeight="semibold">
                        ITEM
                      </Th>
                      <Th
                        color="white"
                        py={4}
                        fontSize="sm"
                        fontWeight="semibold"
                        isNumeric
                        w="180px"
                      >
                        AMOUNT
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {feeItems.map((item) => (
                      <Tr key={item.id} _hover={{ bg: tableBg }}>
                        <Td py={4} fontWeight="medium">
                          {item.description}
                        </Td>
                        <Td py={4} isNumeric fontWeight="semibold" color="blue.500">
                          {formatCurrency(item.amount)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </Box>

          <Divider mb={6} />

          {/* Payment Methods Section */}
          <Box mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md" color={labelColor}>
                Payment Details
              </Heading>
              <HStack spacing={3}>
                <Button
                  leftIcon={<FiDollarSign />}
                  colorScheme="green"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCash}
                  isDisabled={isPaid}
                >
                  Add Cash
                </Button>
                <Button
                  leftIcon={<FiCreditCard />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCheck}
                  isDisabled={isPaid}
                >
                  Add Check
                </Button>
              </HStack>
            </Flex>

            <Box borderRadius="lg" overflow="hidden" border="1px" borderColor={borderColor}>
              <Table variant="simple" size="sm">
                <Thead bg={tableBg}>
                  <Tr>
                    <Th py={3} w="100px">
                      MODE
                    </Th>
                    <Th py={3} w="150px">
                      AMOUNT
                    </Th>
                    <Th py={3}>BANK</Th>
                    <Th py={3} w="140px">
                      CHECK DATE
                    </Th>
                    <Th py={3} w="120px">
                      CHECK NO.
                    </Th>
                    <Th py={3} w="60px"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {payments.map((payment) => (
                    <Tr key={payment.id}>
                      <Td py={3}>
                        <Badge
                          colorScheme={payment.mode === 'Cash' ? 'green' : 'blue'}
                          variant="solid"
                          px={3}
                          py={1}
                          borderRadius="md"
                        >
                          {payment.mode}
                        </Badge>
                      </Td>
                      <Td py={3}>
                        <Input
                          size="sm"
                          type="number"
                          value={payment.amount || ''}
                          onChange={(e) =>
                            handleUpdatePayment(
                              payment.id,
                              'amount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          bg={inputBg}
                          borderColor={borderColor}
                          textAlign="right"
                          fontWeight="semibold"
                        />
                      </Td>
                      <Td py={3}>
                        <Input
                          size="sm"
                          value={payment.description}
                          onChange={(e) =>
                            handleUpdatePayment(payment.id, 'description', e.target.value)
                          }
                          placeholder="Bank"
                          bg={inputBg}
                          borderColor={borderColor}
                          isDisabled={payment.mode === 'Cash'}
                          list="bank-options"
                        />
                        <datalist id="bank-options">
                          {banks.map((bank, index) => (
                            <option key={index} value={bank} />
                          ))}
                        </datalist>
                      </Td>
                      <Td py={3}>
                        <Input
                          size="sm"
                          type="date"
                          value={payment.checkDate}
                          onChange={(e) =>
                            handleUpdatePayment(payment.id, 'checkDate', e.target.value)
                          }
                          bg={inputBg}
                          borderColor={borderColor}
                          isDisabled={payment.mode === 'Cash'}
                        />
                      </Td>
                      <Td py={3}>
                        <Input
                          size="sm"
                          value={payment.checkNo}
                          onChange={(e) =>
                            handleUpdatePayment(payment.id, 'checkNo', e.target.value)
                          }
                          placeholder="Check #"
                          bg={inputBg}
                          borderColor={borderColor}
                          isDisabled={payment.mode === 'Cash'}
                        />
                      </Td>
                      <Td py={3}>
                        <Tooltip label="Remove" placement="top">
                          <IconButton
                            aria-label="Remove payment"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRemovePayment(payment.id)}
                          />
                        </Tooltip>
                      </Td>
                    </Tr>
                  ))}
                  {payments.length === 0 && (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={8} color="gray.500">
                        No payment methods added. Click "Add Cash" or "Add Check" to add a payment.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>

            {/* Payment Total */}
            <Flex justify="flex-end" mt={4}>
              <Box
                bg={tableBg}
                px={6}
                py={3}
                borderRadius="lg"
                border="1px"
                borderColor={borderColor}
              >
                <HStack spacing={6}>
                  <Text fontWeight="medium" color={labelColor}>
                    Payment Total:
                  </Text>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color={paymentTotal === feeTotal ? 'green.500' : 'red.500'}
                  >
                    ₱ {formatCurrency(paymentTotal)}
                  </Text>
                </HStack>
              </Box>
            </Flex>
          </Box>

          <Divider mb={6} />

          {/* Official Receipt Section */}
          <Box mb={8}>
            <Heading size="md" mb={4} color={labelColor}>
              Official Receipt Numbers
            </Heading>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <FormControl>
                <FormLabel color={labelColor} fontSize="sm">
                  OR - Provincial Share
                </FormLabel>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={orProvShare}
                  onChange={(e) => setOrProvShare(e.target.value)}
                  placeholder="Enter OR number"
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: 'blue.400' }}
                  isDisabled={isPaid}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={labelColor} fontSize="sm">
                  OR - Municipal Share
                </FormLabel>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={orMunShare}
                  onChange={(e) => setOrMunShare(e.target.value)}
                  placeholder="Enter OR number"
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: 'blue.400' }}
                  isDisabled={isPaid || !nature.includes('Government Share')}
                />
              </FormControl>
            </Grid>
          </Box>

          {/* Action Buttons */}
          {/* Action Buttons */}
          <Flex justify="flex-end" gap={3} pt={3} borderTop="1px" borderColor={borderColor}>
            <Button
              leftIcon={<FiXCircle />}
              colorScheme="red"
              size="md"
              isDisabled={!isPaid || loading}
              onClick={() => {
                if (!controlNoNumber) {
                  toast({
                    title: 'Error',
                    description: 'No control number specified.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
                setShowCancelModal(true);
              }}
              boxShadow="md"
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              Cancel Payment
            </Button>

            {/* Cancel Payment Confirmation Modal */}
            <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} isCentered>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Confirm Cancellation</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text>Are you sure you want to cancel this payment?</Text>
                  <Text fontWeight="bold" mt={2}>This action cannot be undone.</Text>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={() => setShowCancelModal(false)}>
                    No, Keep Payment
                  </Button>
                  <Button
                    colorScheme="red"
                    isLoading={loading}
                    onClick={async () => {
                      setShowCancelModal(false);
                      setLoading(true);
                      try {
                        const response = await fetch(`${API_BASE_URL}/collections/cancel/${controlNoNumber}`, {
                          method: 'DELETE',
                        });

                        const result = await response.json();

                        if (!response.ok) {
                          throw new Error(result.message || 'Failed to cancel payment');
                        }

                        toast({
                          title: 'Payment Cancelled',
                          description: 'The payment has been cancelled successfully.',
                          status: 'success',
                          duration: 3000,
                          isClosable: true,
                        });

                        // Reset the form
                        setControlNoNumber('');
                        setClientName('');
                        setNature('');
                        setFeeItems([]);
                        setPayments([]);
                        setOrProvShare('');
                        setOrMunShare('');
                        setIsPaid(false);
                        setDate(new Date().toISOString().split('T')[0]);

                        // Focus the control number input
                        setTimeout(() => {
                          controlNoInputRef.current?.focus();
                        }, 100);
                      } catch (error) {
                        console.error('Error cancelling payment:', error);
                        toast({
                          title: 'Error',
                          description: error instanceof Error ? error.message : 'Failed to cancel payment',
                          status: 'error',
                          duration: 3000,
                          isClosable: true,
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Yes, Cancel Payment
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            <Button
              leftIcon={<FiSave />}
              colorScheme="green"
              size="md"
              onClick={handleSaveAndPrint}
              boxShadow="md"
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
              transition="all 0.2s"
              isDisabled={isPaid || !clientName || feeTotal !== paymentTotal || !orProvShare}
            >
              Save and Print
            </Button>

            <Button
              leftIcon={<FiPrinter />}
              colorScheme="orange"
              size="md"
              isDisabled={isPaid || !nature.includes('Government Share')}
              onClick={() => {
                toast({
                  title: 'Print',
                  description: 'Printing Municipal and Barangay reports...',
                  status: 'info',
                  duration: 2000,
                  isClosable: true,
                });
              }}
              boxShadow="md"
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              Print (Mun & Brgy)
            </Button>
          </Flex>
        </CardBody>
      </Card>
    </Box>
  );
};

export default PaymentCollectionsPage;
