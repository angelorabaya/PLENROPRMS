import React from 'react';
import {
    Box,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from '@chakra-ui/react';
import { FiPrinter } from 'react-icons/fi';

export interface RMunReceiptData {
    clientName: string;
    date: string;
    nature?: string;
    municipality?: string;
    barangay?: string;
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
}

interface RMunPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    data: RMunReceiptData;
}

const numberToWords = (amount: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = [
        'Ten',
        'Eleven',
        'Twelve',
        'Thirteen',
        'Fourteen',
        'Fifteen',
        'Sixteen',
        'Seventeen',
        'Eighteen',
        'Nineteen',
    ];
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

const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const roundToTwo = (value: number) => Number(value.toFixed(2));

const printElement = (elementId: string) => {
    const receiptElement = document.getElementById(elementId);
    if (!receiptElement) return;

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

    const styles = Array.from(document.styleSheets)
        .map((styleSheet) => {
            try {
                return Array.from(styleSheet.cssRules)
                    .map((rule) => rule.cssText)
                    .join('\n');
            } catch {
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
                    #${elementId} {
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

    const doPrint = async () => {
        try {
            // Fetch server datetime right before printing
            const dtResponse = await fetch('/api/system/datetime');
            const dtResult = await dtResponse.json();
            if (dtResult.success && dtResult.data?.datetime) {
                const elements = iframeDoc.getElementsByClassName('print-datetime-placeholder');
                const dt = new Date(dtResult.data.datetime);
                const formatDt = dt.toLocaleString('en-US', {
                    timeZone: 'Asia/Manila',
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                });
                for (let i = 0; i < elements.length; i++) {
                    elements[i].textContent = formatDt;
                }
            }
        } catch (e) {
            // fallback to client time if server fails
        }

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 250);
    };

    doPrint();
};

export const RMunPrintable: React.FC<{ data: RMunReceiptData; printableId?: string }> = ({
    data,
    printableId = 'rmun-printable',
}) => {
    const formatAmount = (num: number) => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const [offsetX] = React.useState(() => {
        if (typeof window === 'undefined') return 0;
        const savedX = parseFloat(localStorage.getItem('receipt_offsetX') || '0');
        return Number.isNaN(savedX) ? 0 : savedX;
    });
    const [offsetY] = React.useState(() => {
        if (typeof window === 'undefined') return 0;
        const savedY = parseFloat(localStorage.getItem('receipt_offsetY') || '0');
        return Number.isNaN(savedY) ? 0 : savedY;
    });

    const municipalityAmount = roundToTwo(data.totalAmount * 0.3);
    const barangayParts = (data.barangay || '')
        .split('/')
        .map((part) => part.trim())
        .filter(Boolean);
    const hasTwoBarangays = barangayParts.length >= 2;
    const barangayAmount = roundToTwo(data.totalAmount * (hasTwoBarangays ? 0.2 : 0.4));
    const barangayLines = hasTwoBarangays
        ? barangayParts.slice(0, 2).map((name) => ({
              label: `Barangay of ${name} (20%)`,
              amount: barangayAmount,
          }))
        : [
              {
                  label: `Barangay of ${data.barangay || '-'} (40%)`,
                  amount: barangayAmount,
              },
          ];
    const sharesTotal = roundToTwo(
        municipalityAmount + barangayLines.reduce((sum, line) => sum + line.amount, 0)
    );

    return (
        <>
            <style>
                {`
          @media print {
            html, body {
              visibility: hidden;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: hidden !important;
            }

            body * {
              visibility: hidden;
            }

            #${printableId},
            #${printableId} * {
              visibility: visible !important;
            }

            #${printableId} {
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
                id={printableId}
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
                <Text position="absolute" left="131px" top="73px">
                    PTO MIS. OR.
                </Text>

                <Text position="absolute" left="63px" top="169px">
                    {formatDate(data.date)}
                </Text>

                <Text position="absolute" left="32px" top="223px" fontWeight="bold">
                    {data.clientName}
                </Text>

                <Text position="absolute" left="274px" top="230px">
                    Trust
                </Text>

                <Box position="absolute" left="26px" top="309px" w="330px">
                    {data.nature && (
                        <Box mb={1} position="relative" height="auto" minH="18px">
                            <Text
                                as="span"
                                display="inline-block"
                                w="230px"
                                verticalAlign="top"
                                lineHeight="1.2"
                                fontWeight="bold"
                            >
                                {data.nature}
                            </Text>
                        </Box>
                    )}
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
                            </Box>
                        );
                    })}

                    <Box mt={2}>
                        <Box key="municipality-line" position="relative" height="auto" minH="18px">
                            <Text
                                as="span"
                                display="inline-block"
                                w="230px"
                                verticalAlign="top"
                                lineHeight="1.2"
                            >
                                Municipality of {data.municipality || '-'} (30%)
                            </Text>
                            <Text as="span" position="absolute" left="245px" top="0" textAlign="right" w="80px">
                                {formatAmount(municipalityAmount)}
                            </Text>
                        </Box>
                        {barangayLines.map((line, index) => (
                            <Box key={`barangay-${index}`} position="relative" height="auto" minH="18px">
                                <Text
                                    as="span"
                                    display="inline-block"
                                    w="230px"
                                    verticalAlign="top"
                                    lineHeight="1.2"
                                >
                                    {line.label}
                                </Text>
                                <Text as="span" position="absolute" left="245px" top="0" textAlign="right" w="80px">
                                    {formatAmount(line.amount)}
                                </Text>
                            </Box>
                        ))}
                    </Box>

                    <Box mt={2} display="flex" alignItems="center" h="20px">
                        <Text w="230px" lineHeight="1.2" fontWeight="bold">
                            Total Share
                        </Text>
                        <Text w="80px" ml="15px" lineHeight="1.2" fontWeight="bold" textAlign="right">
                            {formatAmount(sharesTotal)}
                        </Text>
                    </Box>

                    <Box mt={2}>
                        {data.payments.map((payment, index) => {
                            if (data.payments.length === 1 && payment.mode === 'Cash') {
                                return null;
                            }

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
                                            : `${payment.description || '-'} ${payment.checkDate || '-'} ${
                                                  payment.checkNo || '-'
                                              }`}
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

                    <Box mt={4}>
                        <Text fontStyle="italic">{numberToWords(sharesTotal)}</Text>
                    </Box>

                    <Box mt={1}>
                        <Text fontSize="10px">
                            Date/Time Printed:{' '}
                            <span className="print-datetime-placeholder">
                                {new Date().toLocaleString('en-US', {
                                    timeZone: 'Asia/Manila',
                                    month: '2-digit',
                                    day: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true,
                                })}
                            </span>
                        </Text>
                    </Box>
                </Box>

                {(data.payments.some((p) => p.mode === 'Cash') || data.payments.length === 0) && (
                    <Text position="absolute" left="32px" top="598px" fontWeight="bold">
                        X
                    </Text>
                )}

                {data.payments.some((p) => p.mode === 'Check') && (
                    <Text position="absolute" left="32px" top="618px" fontWeight="bold">
                        X
                    </Text>
                )}

                <Text position="absolute" left="220px" top="710px">
                    {''}
                </Text>
            </Box>
        </>
    );
};

export const RMunPreview: React.FC<RMunPreviewProps> = ({ isOpen, onClose, data }) => {
    const printableId = 'rmun-preview';

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent maxW="500px">
                <ModalHeader>Receipt Preview</ModalHeader>
                <ModalCloseButton />
                <ModalBody bg="gray.100" p={4} display="flex" justifyContent="center">
                    <RMunPrintable data={data} printableId={printableId} />
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} leftIcon={<FiPrinter />} onClick={() => printElement(printableId)}>
                        Print
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
