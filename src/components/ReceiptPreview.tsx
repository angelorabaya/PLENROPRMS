import React from 'react';
import { Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react';
import { FiPrinter } from 'react-icons/fi';

interface ReceiptPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
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
    };
}

const numberToWords = (amount: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion'];

    if (amount === 0) return 'Zero Pesos';

    const [integerPart, decimalPart] = amount.toFixed(2).split('.');

    let words = '';
    let num = parseInt(integerPart, 10);
    let scaleIndex = 0;

    if (num === 0) words = 'Zero';
    else {
        while (num > 0) {
            let chunk = num % 1000;
            if (chunk > 0) {
                let chunkStr = '';
                if (chunk >= 100) {
                    chunkStr += units[Math.floor(chunk / 100)] + ' Hundred ';
                    chunk %= 100;
                }
                if (chunk >= 10 && chunk < 20) {
                    chunkStr += teens[chunk - 10] + ' ';
                } else {
                    if (chunk >= 20) {
                        chunkStr += tens[Math.floor(chunk / 10)] + ' ';
                        chunk %= 10;
                    }
                    if (chunk > 0) {
                        chunkStr += units[chunk] + ' ';
                    }
                }
                words = chunkStr + thousands[scaleIndex] + ' ' + words;
            }
            num = Math.floor(num / 1000);
            scaleIndex++;
        }
    }

    words = words.trim() + ' Pesos';

    if (parseInt(decimalPart) > 0) {
        words += ` and ${decimalPart}/100`;
    }

    return words;
};

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ isOpen, onClose, data }) => {
    // Helper for currency formatting
    const formatAmount = (num: number) => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const [offsetX, setOffsetX] = React.useState(0);
    const [offsetY, setOffsetY] = React.useState(0);

    React.useEffect(() => {
        if (isOpen) {
            const savedX = parseFloat(localStorage.getItem('receipt_offsetX') || '0');
            const savedY = parseFloat(localStorage.getItem('receipt_offsetY') || '0');
            setOffsetX(savedX);
            setOffsetY(savedY);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent maxW="500px">
                <ModalHeader>Receipt Preview</ModalHeader>
                <ModalCloseButton />
                <ModalBody bg="gray.100" p={4} display="flex" justifyContent="center">
                    {/* Receipt Container */}
                    <style>
                        {`
              @media print {
                /* Hide everything and prevent extra pages */
                html, body {
                  visibility: hidden;
                  margin: 0 !important;
                  padding: 0 !important;
                  height: auto !important;
                  overflow: hidden !important;
                }
                
                /* Hide all body children */
                body * {
                  visibility: hidden;
                }
                
                /* Make the receipt visible */
                #printable-receipt,
                #printable-receipt * {
                  visibility: visible !important;
                }
                
                /* Position the receipt at top-left */
                #printable-receipt {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 380px !important;
                  height: 796px !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  box-shadow: none !important;
                  transform: translate(${offsetX}mm, ${offsetY}mm) !important;
                }
                
                @page {
                  size: 380px 796px;
                  margin: 0;
                }
              }
            `}
                    </style>

                    <Box
                        id="printable-receipt"
                        bg="white"
                        w="380px"
                        h="796px"
                        position="relative"
                        boxShadow="md"
                        fontFamily="'Lucida Console', Monaco, monospace"
                        fontSize="12px"
                        color="black"
                        overflow="hidden"
                    >
                        {/* PTO MIS. OR. */}
                        <Text position="absolute" left="131px" top="73px">
                            PTO MIS. OR.
                        </Text>

                        {/* Date */}
                        <Text position="absolute" left="63px" top="169px">
                            {data.date}
                        </Text>

                        {/* Payor */}
                        <Text position="absolute" left="32px" top="223px" fontWeight="bold">
                            {data.clientName}
                        </Text>

                        {/* Fund */}
                        <Text position="absolute" left="274px" top="230px">
                            General
                        </Text>

                        {/* Details */}
                        <Box position="absolute" left="26px" top="309px" w="330px">
                            {data.items.map((item, index) => {
                                return (
                                    <Box key={index} mb={1} position="relative" height="auto" minH="18px">
                                        <Text
                                            as="span"
                                            display="inline-block"
                                            w="230px"
                                            verticalAlign="top"
                                            lineHeight="1.2"
                                        >
                                            {item.description}
                                        </Text>
                                        <Text
                                            as="span"
                                            position="absolute"
                                            left="245px"
                                            top="0"
                                            textAlign="right"
                                            w="80px"
                                        >
                                            {formatAmount(item.amount)}
                                        </Text>
                                    </Box>
                                );
                            })}

                            {/* Total Amount after list */}
                            <Box mt={2} position="relative" h="20px">
                                <Text
                                    position="absolute"
                                    left="245px"
                                    fontWeight="bold"
                                    w="80px"
                                    textAlign="right"
                                >
                                    {formatAmount(data.totalAmount)}
                                </Text>
                            </Box>

                            {/* Payment Methods Breakdown */}
                            <Box mt={2}>
                                {data.payments.map((payment, index) => {
                                    // Condition 1: If single Cash payment, don't display anything
                                    if (data.payments.length === 1 && payment.mode === 'Cash') {
                                        return null;
                                    }

                                    // Condition 2: If single Check payment, display details but NO amount
                                    const hideAmount = data.payments.length === 1 && payment.mode === 'Check';

                                    return (
                                        <Box key={`pay-${index}`} position="relative" height="auto" minH="18px">
                                            <Text
                                                as="span"
                                                display="inline-block"
                                                w="230px"
                                                verticalAlign="top"
                                                lineHeight="1.2"
                                            >
                                                {payment.mode === 'Cash'
                                                    ? 'Cash'
                                                    : `${payment.description || '-'} ${payment.checkDate || '-'} ${payment.checkNo || '-'}`}
                                            </Text>
                                            {!hideAmount && (
                                                <Text
                                                    as="span"
                                                    position="absolute"
                                                    left="245px"
                                                    top="0"
                                                    textAlign="right"
                                                    w="80px"
                                                >
                                                    {formatAmount(payment.amount)}
                                                </Text>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>

                            {/* Amount in Words */}
                            <Box mt={4}>
                                <Text fontStyle="italic">
                                    {numberToWords(data.totalAmount)}
                                </Text>
                            </Box>

                            {/* Date/Time Printed */}
                            <Box mt={1}>
                                <Text fontSize="10px">
                                    Date/Time Printed: {new Date().toLocaleString('en-US', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: true
                                    })}
                                </Text>
                            </Box>
                        </Box>

                        {/* Cash Checkmark */}
                        {(data.payments.some(p => p.mode === 'Cash') || data.payments.length === 0) && (
                            <Text position="absolute" left="32px" top="598px" fontWeight="bold">X</Text>
                        )}

                        {/* Check Checkmark */}
                        {data.payments.some(p => p.mode === 'Check') && (
                            <Text position="absolute" left="32px" top="618px" fontWeight="bold">X</Text>
                        )}

                        {/* Teller */}
                        <Text position="absolute" left="220px" top="710px">
                            {import.meta.env.VITE_RECEIPT_SIGNATORY || data.teller || 'Admin'}
                        </Text>

                    </Box>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} leftIcon={<FiPrinter />} onClick={() => {
                        const receiptElement = document.getElementById('printable-receipt');
                        if (!receiptElement) return;

                        // Create a hidden iframe
                        const iframe = document.createElement('iframe');
                        iframe.style.position = 'absolute';
                        iframe.style.width = '0';
                        iframe.style.height = '0';
                        iframe.style.border = 'none';
                        document.body.appendChild(iframe);

                        const iframeDoc = iframe.contentWindow?.document;
                        if (!iframeDoc) {
                            document.body.removeChild(iframe);
                            return;
                        }

                        // Copy all stylesheets from the main document
                        const styles = Array.from(document.styleSheets)
                            .map(styleSheet => {
                                try {
                                    return Array.from(styleSheet.cssRules)
                                        .map(rule => rule.cssText)
                                        .join('\n');
                                } catch {
                                    // External stylesheets may throw security errors
                                    return '';
                                }
                            })
                            .join('\n');

                        iframeDoc.open();
                        iframeDoc.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Receipt</title>
                                <style>
                                    ${styles}
                                    html, body {
                                        margin: 0 !important;
                                        padding: 0 !important;
                                    }
                                    @page {
                                        size: auto;
                                        margin: 2mm;
                                    }
                                    @media print {
                                        html, body {
                                            margin: 0 !important;
                                            padding: 0 !important;
                                        }
                                        #printable-receipt {
                                            margin: 0 !important;
                                            box-shadow: none !important;
                                        }
                                    }
                                </style>
                            </head>
                            <body>
                                ${receiptElement.outerHTML}
                            </body>
                            </html>
                        `);
                        iframeDoc.close();

                        // Wait for content to load then print
                        setTimeout(() => {
                            iframe.contentWindow?.focus();
                            iframe.contentWindow?.print();
                            // Remove iframe after printing
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                            }, 1000);
                        }, 250);
                    }}>
                        Print
                    </Button>
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
