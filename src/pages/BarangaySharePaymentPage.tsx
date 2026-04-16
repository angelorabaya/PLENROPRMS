import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Flex,
  Spinner,
  Text,
  useColorModeValue,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import React from 'react';
import { API_BASE_URL } from '../config/api';
import { getAuditHeaders } from '../utils/auditHeaders';

/**
 * Payment record interface
 */
interface PaymentRecord {
  bs_ctrlno: string;
  bs_chkdate: string | null;
  bs_chkno: string | null;
  bs_brgy: string;
  bs_mun: string;
  bs_natureofpayment: string | null;
  bs_year: number;
  bsamount: number;
  bs_claimedby: string | null;
  bs_claimeddate: string | null;
  bs_datereturned: string | null;
}

/**
 * Form data for creating/editing payment
 */
interface PaymentFormData {
  bs_natureofpayment: string;
  bsamount: string;
  bs_chkdate: string;
  bs_chkno: string;
  bs_claimedby: string;
  bs_claimeddate: string;
  bs_datereturned: string;
}

const emptyFormData: PaymentFormData = {
  bs_natureofpayment: '',
  bsamount: '',
  bs_chkdate: '',
  bs_chkno: '',
  bs_claimedby: '',
  bs_claimeddate: '',
  bs_datereturned: '',
};

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
 * Format date string for display
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
 * Format date for input field
 */
const formatDateForInput = (dateStr: string | null): string => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.length >= 10) {
    return dateStr.substring(0, 10);
  }
  return '';
};

/**
 * Barangay Share Payment Page
 * Filter controls: Year, Municipality, Barangay
 * CRUD functionality for payment records
 */
interface BarangaySharePaymentPageProps {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export const BarangaySharePaymentPage = ({
  canCreate,
  canUpdate,
  canDelete,
}: BarangaySharePaymentPageProps) => {
  // Filter state
  const [year, setYear] = useState<string>('');
  const [yearError, setYearError] = useState<string | null>(null);
  const [municipality, setMunicipality] = useState<string>('');
  const [barangay, setBarangay] = useState<string>('');

  // Data state
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // CRUD state
  const [formData, setFormData] = useState<PaymentFormData>(emptyFormData);
  const [editingRecord, setEditingRecord] = useState<PaymentRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<PaymentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal controls
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableBg = useColorModeValue('gray.50', 'gray.900');
  const hoverBg = useColorModeValue('blue.50', 'blue.900');
  const modalBg = useColorModeValue('white', 'gray.800');

  // Validate year
  const validateYear = (value: string): boolean => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setYearError('Please enter a valid year');
      return false;
    }
    if (numValue < 1900 || numValue > 2100) {
      setYearError('Year must be between 1900 and 2100');
      return false;
    }
    setYearError(null);
    return true;
  };

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Numbers only
    setYear(value);
    if (value.length === 4) {
      validateYear(value);
    } else if (value.length > 0) {
      setYearError(null);
    }
  };

  // Handle year blur for validation
  const handleYearBlur = () => {
    if (year) {
      validateYear(year);
    }
  };

  // Fetch payment records
  const fetchPaymentRecords = useCallback(async () => {
    if (!year || !municipality || !barangay || yearError) {
      setPaymentRecords([]);
      return;
    }

    setIsLoadingPayments(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/barangay-payment?year=${year}&municipality=${encodeURIComponent(municipality)}&barangay=${encodeURIComponent(barangay)}`
      );
      const result = await response.json();
      if (result.success && result.data) {
        setPaymentRecords(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment records:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [year, municipality, barangay, yearError]);

  // Fetch municipalities on mount
  useEffect(() => {
    const fetchMunicipalities = async () => {
      setIsLoadingMunicipalities(true);
      try {
        const response = await fetch(`${API_BASE_URL}/municipalities`);
        const result = await response.json();
        if (result.success && result.data) {
          setMunicipalities(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch municipalities:', err);
      } finally {
        setIsLoadingMunicipalities(false);
      }
    };

    const fetchSystemYear = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/system/year`);
        const result = await response.json();
        if (result.success && result.data?.year) {
          setYear((prev) => (prev === '' ? result.data.year.toString() : prev));
        }
      } catch (err) {
        console.error('Failed to fetch system year:', err);
      }
    };

    fetchMunicipalities();
    fetchSystemYear();
  }, []);

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (!municipality) {
      setBarangays([]);
      setBarangay('');
      return;
    }

    const fetchBarangays = async () => {
      setIsLoadingBarangays(true);
      setBarangay(''); // Reset barangay when municipality changes
      setPaymentRecords([]); // Clear payment records
      try {
        const response = await fetch(
          `${API_BASE_URL}/municipalities/${encodeURIComponent(municipality)}/barangays`
        );
        const result = await response.json();
        if (result.success && result.data) {
          setBarangays(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch barangays:', err);
      } finally {
        setIsLoadingBarangays(false);
      }
    };

    fetchBarangays();
  }, [municipality]);

  // Fetch payment records when filters change
  useEffect(() => {
    fetchPaymentRecords();
  }, [fetchPaymentRecords]);

  // Handle Add button click
  const handleAddClick = () => {
    if (!canCreate) return;
    setEditingRecord(null);
    setFormData(emptyFormData);
    onFormOpen();
  };

  // Handle Edit button click
  const handleEditClick = (record: PaymentRecord) => {
    if (!canUpdate) return;
    setEditingRecord(record);
    setFormData({
      bs_natureofpayment: record.bs_natureofpayment || '',
      bsamount: record.bsamount.toString(),
      bs_chkdate: formatDateForInput(record.bs_chkdate),
      bs_chkno: record.bs_chkno || '',
      bs_claimedby: record.bs_claimedby || '',
      bs_claimeddate: formatDateForInput(record.bs_claimeddate),
      bs_datereturned: formatDateForInput(record.bs_datereturned),
    });
    onFormOpen();
  };

  // Handle Delete button click
  const handleDeleteClick = (record: PaymentRecord) => {
    if (!canDelete) return;
    setDeletingRecord(record);
    onDeleteOpen();
  };

  // Handle form input change
  const handleFormChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submit (Create/Update)
  const handleFormSubmit = async () => {
    if ((editingRecord && !canUpdate) || (!editingRecord && !canCreate)) {
      return;
    }

    if (!formData.bsamount || parseFloat(formData.bsamount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Amount is required and must be greater than 0',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        bs_year: parseInt(year, 10),
        bs_mun: municipality,
        bs_brgy: barangay,
        bsamount: parseFloat(formData.bsamount),
        bs_natureofpayment: formData.bs_natureofpayment || null,
        bs_chkdate: formData.bs_chkdate || null,
        bs_chkno: formData.bs_chkno || null,
        bs_claimedby: formData.bs_claimedby || null,
        bs_claimeddate: formData.bs_claimeddate || null,
        bs_datereturned: formData.bs_datereturned || null,
      };

      let response;
      if (editingRecord) {
        // Update existing record
        response = await fetch(`${API_BASE_URL}/barangay-payment/${editingRecord.bs_ctrlno}`, {
          method: 'PUT',
          headers: getAuditHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        // Create new record
        response = await fetch(`${API_BASE_URL}/barangay-payment`, {
          method: 'POST',
          headers: getAuditHeaders(),
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: editingRecord ? 'Payment Updated' : 'Payment Created',
          description: result.message || 'Operation completed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onFormClose();
        fetchPaymentRecords();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Operation failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deletingRecord || !canDelete) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/barangay-payment/${deletingRecord.bs_ctrlno}`, {
        method: 'DELETE',
        headers: getAuditHeaders(false),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Payment Deleted',
          description: 'Payment record has been deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onDeleteClose();
        fetchPaymentRecords();
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Delete failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total amount
  const totalAmount = paymentRecords.reduce((sum, p) => sum + (p.bsamount || 0), 0);

  // Check if filters are complete for adding
  const canAddPayment = Boolean(year && !yearError && municipality && barangay && canCreate);
  const canEditPayment = canUpdate;
  const canDeletePayment = canDelete;
  const canManageCurrentForm = editingRecord ? canUpdate : canCreate;

  return (
    <Box>
      {/* Filter Card */}
      <Card bg={cardBg} mb={6} boxShadow="sm">
        <CardBody>
          <Flex gap={4} flexWrap="wrap" align="flex-start">
            {/* Year Input */}
            <FormControl maxW="120px" isInvalid={!!yearError}>
              <FormLabel fontSize="sm">Year</FormLabel>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={year}
                onChange={handleYearChange}
                onBlur={handleYearBlur}
                placeholder="YYYY"
                bg={cardBg}
                borderColor={borderColor}
              />
              {yearError && <FormErrorMessage fontSize="xs">{yearError}</FormErrorMessage>}
            </FormControl>

            {/* Municipality Select */}
            <FormControl maxW="250px">
              <FormLabel fontSize="sm">Municipality</FormLabel>
              <Select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                placeholder={isLoadingMunicipalities ? 'Loading...' : 'Select Municipality'}
                bg={cardBg}
                borderColor={borderColor}
                isDisabled={isLoadingMunicipalities}
              >
                {municipalities.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Barangay Select */}
            <FormControl maxW="250px">
              <FormLabel fontSize="sm">Barangay</FormLabel>
              <Select
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                placeholder={
                  !municipality
                    ? 'Select Municipality first'
                    : isLoadingBarangays
                      ? 'Loading...'
                      : 'Select Barangay'
                }
                bg={cardBg}
                borderColor={borderColor}
                isDisabled={!municipality || isLoadingBarangays}
              >
                {barangays.map((brgy) => (
                  <option key={brgy} value={brgy}>
                    {brgy}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Flex>
        </CardBody>
      </Card>

      {/* Selected Filters Summary */}
      {(year || municipality || barangay) && (
        <Card bg={cardBg} mb={6} boxShadow="sm">
          <CardBody py={3}>
            <HStack spacing={3} flexWrap="wrap">
              <Text fontSize="sm" color="gray.500">
                Selected Filters:
              </Text>
              {year && !yearError && (
                <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                  Year: {year}
                </Badge>
              )}
              {municipality && (
                <Badge colorScheme="green" fontSize="sm" px={2} py={1}>
                  Municipality: {municipality}
                </Badge>
              )}
              {barangay && (
                <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
                  Barangay: {barangay}
                </Badge>
              )}
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Payment Records Table */}
      <Card bg={cardBg} boxShadow="sm">
        <CardHeader pb={0}>
          <HStack justify="space-between">
            <HStack>
              <Heading size="md">Payment Records</Heading>
              {paymentRecords.length > 0 && (
                <HStack spacing={2} ml={4}>
                  <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                    {paymentRecords.length} record(s)
                  </Badge>
                  <Badge colorScheme="green" fontSize="sm" px={2} py={1}>
                    Total: {formatCurrency(totalAmount)}
                  </Badge>
                </HStack>
              )}
            </HStack>
            {canAddPayment && (
              <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={handleAddClick}>
                Add Payment
              </Button>
            )}
          </HStack>
        </CardHeader>
        <CardBody>
          {!municipality || !barangay ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500" fontSize="lg">
                Please select Municipality and Barangay to view payment records
              </Text>
            </Box>
          ) : isLoadingPayments ? (
            <Flex justify="center" align="center" py={10}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text ml={4} color="gray.500">
                Loading payment records...
              </Text>
            </Flex>
          ) : paymentRecords.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500" fontSize="lg">
                No payment records found for the selected filters
              </Text>
            </Box>
          ) : (
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead bg={tableBg}>
                  <Tr>
                    <Th>Payment</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Check Date</Th>
                    <Th>Check No.</Th>
                    <Th>Claimant</Th>
                    <Th>Claimed</Th>
                    <Th>Returned</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paymentRecords.map((payment, index) => (
                    <Tr key={payment.bs_ctrlno || index} _hover={{ bg: hoverBg }}>
                      <Td>{payment.bs_natureofpayment || '-'}</Td>
                      <Td isNumeric fontWeight="semibold" color="blue.600">
                        {formatCurrency(payment.bsamount)}
                      </Td>
                      <Td>{formatDate(payment.bs_chkdate)}</Td>
                      <Td>{payment.bs_chkno || '-'}</Td>
                      <Td>{payment.bs_claimedby || '-'}</Td>
                      <Td>{formatDate(payment.bs_claimeddate)}</Td>
                      <Td>{formatDate(payment.bs_datereturned)}</Td>
                      <Td>
                        <HStack spacing={1}>
                          {canEditPayment && (
                            <IconButton
                              aria-label="Edit payment"
                              icon={<FiEdit2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => handleEditClick(payment)}
                            />
                          )}
                          {canDeletePayment && (
                            <IconButton
                              aria-label="Delete payment"
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteClick(payment)}
                            />
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Payment Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>{editingRecord ? 'Edit Payment' : 'Add New Payment'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={4}>
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <NumberInput
                  value={formData.bsamount}
                  onChange={(value) => handleFormChange('bsamount', value)}
                  min={0}
                  precision={2}
                  isDisabled={!canManageCurrentForm}
                >
                  <NumberInputField placeholder="Enter amount" />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Nature of Payment</FormLabel>
                <Input
                  value={formData.bs_natureofpayment}
                  onChange={(e) => handleFormChange('bs_natureofpayment', e.target.value)}
                  placeholder="e.g., Partial Payment, Full Payment"
                  isDisabled={!canManageCurrentForm}
                  isReadOnly={!canManageCurrentForm}
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Check Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.bs_chkdate}
                    onChange={(e) => handleFormChange('bs_chkdate', e.target.value)}
                    isReadOnly={!canManageCurrentForm}
                    isDisabled={!canManageCurrentForm}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Check No.</FormLabel>
                  <Input
                    value={formData.bs_chkno}
                    onChange={(e) => handleFormChange('bs_chkno', e.target.value)}
                    placeholder="Check number"
                    isDisabled={!canManageCurrentForm}
                    isReadOnly={!canManageCurrentForm}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Claimant</FormLabel>
                <Input
                  value={formData.bs_claimedby}
                  onChange={(e) => handleFormChange('bs_claimedby', e.target.value)}
                  placeholder="Name of claimant"
                  isDisabled={!canManageCurrentForm}
                  isReadOnly={!canManageCurrentForm}
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Claimed Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.bs_claimeddate}
                    onChange={(e) => handleFormChange('bs_claimeddate', e.target.value)}
                    isReadOnly={!canManageCurrentForm}
                    isDisabled={!canManageCurrentForm}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Returned Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.bs_datereturned}
                    onChange={(e) => handleFormChange('bs_datereturned', e.target.value)}
                    isReadOnly={!canManageCurrentForm}
                    isDisabled={!canManageCurrentForm}
                  />
                </FormControl>
              </HStack>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFormClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleFormSubmit}
              isLoading={isSubmitting}
              isDisabled={!canManageCurrentForm}
            >
              {editingRecord ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent bg={modalBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Payment
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this payment record?
              {deletingRecord && (
                <Box mt={2} p={3} bg={tableBg} borderRadius="md">
                  <Text fontSize="sm">
                    <strong>Amount:</strong> {formatCurrency(deletingRecord.bsamount)}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Payment:</strong> {deletingRecord.bs_natureofpayment || '-'}
                  </Text>
                </Box>
              )}
              <Text mt={2} color="red.500" fontSize="sm">
                This action cannot be undone.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                ml={3}
                isLoading={isSubmitting}
                isDisabled={!canDeletePayment}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default BarangaySharePaymentPage;
