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
 * Form data for creating/editing payment
 */
interface PaymentFormData {
  ms_natureofpayment: string;
  msamount: string;
  ms_chkdate: string;
  ms_chkno: string;
  ms_claimedby: string;
  ms_claimeddate: string;
  ms_datereturned: string;
}

const emptyFormData: PaymentFormData = {
  ms_natureofpayment: '',
  msamount: '',
  ms_chkdate: '',
  ms_chkno: '',
  ms_claimedby: '',
  ms_claimeddate: '',
  ms_datereturned: '',
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
 * Municipal Share Payment Page
 * Filter controls: Year, Municipality
 * CRUD functionality for payment records
 */
export const MunicipalSharePaymentPage = () => {
  // Filter state
  const [year, setYear] = useState<string>('');
  const [yearError, setYearError] = useState<string | null>(null);
  const [municipality, setMunicipality] = useState<string>('');

  // Data state
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
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
    if (!year || !municipality || yearError) {
      setPaymentRecords([]);
      return;
    }

    setIsLoadingPayments(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/municipal-payment?year=${year}&municipality=${encodeURIComponent(municipality)}`
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
  }, [year, municipality, yearError]);

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

  // Fetch payment records when filters change
  useEffect(() => {
    fetchPaymentRecords();
  }, [fetchPaymentRecords]);

  // Handle Add button click
  const handleAddClick = () => {
    setEditingRecord(null);
    setFormData(emptyFormData);
    onFormOpen();
  };

  // Handle Edit button click
  const handleEditClick = (record: PaymentRecord) => {
    setEditingRecord(record);
    setFormData({
      ms_natureofpayment: record.ms_natureofpayment || '',
      msamount: record.msamount.toString(),
      ms_chkdate: formatDateForInput(record.ms_chkdate),
      ms_chkno: record.ms_chkno || '',
      ms_claimedby: record.ms_claimedby || '',
      ms_claimeddate: formatDateForInput(record.ms_claimeddate),
      ms_datereturned: formatDateForInput(record.ms_datereturned),
    });
    onFormOpen();
  };

  // Handle Delete button click
  const handleDeleteClick = (record: PaymentRecord) => {
    setDeletingRecord(record);
    onDeleteOpen();
  };

  // Handle form input change
  const handleFormChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submit (Create/Update)
  const handleFormSubmit = async () => {
    if (!formData.msamount || parseFloat(formData.msamount) <= 0) {
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
        ms_year: parseInt(year, 10),
        ms_mun: municipality,
        msamount: parseFloat(formData.msamount),
        ms_natureofpayment: formData.ms_natureofpayment || null,
        ms_chkdate: formData.ms_chkdate || null,
        ms_chkno: formData.ms_chkno || null,
        ms_claimedby: formData.ms_claimedby || null,
        ms_claimeddate: formData.ms_claimeddate || null,
        ms_datereturned: formData.ms_datereturned || null,
      };

      let response;
      if (editingRecord) {
        // Update existing record
        response = await fetch(`${API_BASE_URL}/municipal-payment/${editingRecord.ms_ctrlno}`, {
          method: 'PUT',
          headers: getAuditHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        // Create new record
        response = await fetch(`${API_BASE_URL}/municipal-payment`, {
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
    if (!deletingRecord) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/municipal-payment/${deletingRecord.ms_ctrlno}`,
        {
          method: 'DELETE',
          headers: getAuditHeaders(false),
        }
      );

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
  const totalAmount = paymentRecords.reduce((sum, p) => sum + (p.msamount || 0), 0);

  // Check if filters are complete for adding
  const canAddPayment = year && !yearError && municipality;

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
          </Flex>
        </CardBody>
      </Card>

      {/* Selected Filters Summary */}
      {(year || municipality) && (
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
          {!municipality ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500" fontSize="lg">
                Please select Municipality to view payment records
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
                      <Td>
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Edit payment"
                            icon={<FiEdit2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => handleEditClick(payment)}
                          />
                          <IconButton
                            aria-label="Delete payment"
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteClick(payment)}
                          />
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
                  value={formData.msamount}
                  onChange={(value) => handleFormChange('msamount', value)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField placeholder="Enter amount" />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Nature of Payment</FormLabel>
                <Input
                  value={formData.ms_natureofpayment}
                  onChange={(e) => handleFormChange('ms_natureofpayment', e.target.value)}
                  placeholder="e.g., Partial Payment, Full Payment"
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Check Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.ms_chkdate}
                    onChange={(e) => handleFormChange('ms_chkdate', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Check No.</FormLabel>
                  <Input
                    value={formData.ms_chkno}
                    onChange={(e) => handleFormChange('ms_chkno', e.target.value)}
                    placeholder="Check number"
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Claimant</FormLabel>
                <Input
                  value={formData.ms_claimedby}
                  onChange={(e) => handleFormChange('ms_claimedby', e.target.value)}
                  placeholder="Name of claimant"
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Claimed Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.ms_claimeddate}
                    onChange={(e) => handleFormChange('ms_claimeddate', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Returned Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.ms_datereturned}
                    onChange={(e) => handleFormChange('ms_datereturned', e.target.value)}
                  />
                </FormControl>
              </HStack>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFormClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleFormSubmit} isLoading={isSubmitting}>
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
                    <strong>Amount:</strong> {formatCurrency(deletingRecord.msamount)}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Payment:</strong> {deletingRecord.ms_natureofpayment || '-'}
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

export default MunicipalSharePaymentPage;
