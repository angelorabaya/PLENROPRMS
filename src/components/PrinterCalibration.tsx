import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Text,
    HStack,
    useToast,
    Box
} from '@chakra-ui/react';
import { FiPrinter, FiSave } from 'react-icons/fi';

interface PrinterCalibrationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrinterCalibration: React.FC<PrinterCalibrationProps> = ({ isOpen, onClose }) => {
    const [offsetX, setOffsetX] = useState<string>('0');
    const [offsetY, setOffsetY] = useState<string>('0');
    const toast = useToast();

    // Load saved settings on open
    useEffect(() => {
        if (isOpen) {
            const savedX = localStorage.getItem('receipt_offsetX') || '0';
            const savedY = localStorage.getItem('receipt_offsetY') || '0';
            setOffsetX(savedX);
            setOffsetY(savedY);
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('receipt_offsetX', offsetX);
        localStorage.setItem('receipt_offsetY', offsetY);
        toast({
            title: 'Settings Saved',
            description: 'Printer calibration settings have been updated.',
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
        onClose();
    };

    const handleTestPrint = () => {
        const x = parseFloat(offsetX) || 0;
        const y = parseFloat(offsetY) || 0;

        // Create a hidden iframe for test printing
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

        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Calibration Test</title>
                <style>
                    @page {
                        size: auto;
                        margin: 0;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Lucida Console', Monaco, monospace;
                        font-size: 12px;
                    }
                    .calibration-box {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 380px;
                        height: 200px;
                        border: 1px dashed black;
                        transform: translate(${x}mm, ${y}mm);
                    }
                    .info {
                        position: absolute;
                        top: 10mm;
                        left: 10mm;
                    }
                </style>
            </head>
            <body>
                <div class="calibration-box">
                    <div class="info">
                        <strong>CALIBRATION TEST</strong><br/>
                        X Offset: ${x}mm<br/>
                        Y Offset: ${y}mm<br/>
                        <br/>
                        If this box aligns with your intended<br/>
                        print area, the settings are correct.
                    </div>
                    <!-- Crosshair at estimated generic start points -->
                    <div style="position:absolute; top:50px; left:50px; width:20px; border-top:1px solid black;"></div>
                    <div style="position:absolute; top:40px; left:60px; height:20px; border-left:1px solid black;"></div>
                </div>
            </body>
            </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Printer Calibration (Epson LQ-310)</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text fontSize="sm" color="gray.600">
                            Adjust the offsets below to align the text with your pre-printed receipt.
                            Positive values move Right/Down. Negative values move Left/Up.
                        </Text>

                        <HStack spacing={4}>
                            <FormControl>
                                <FormLabel>Horizontal Offset (X) mm</FormLabel>
                                <Input
                                    type="number"
                                    value={offsetX}
                                    onChange={(e) => setOffsetX(e.target.value)}
                                    placeholder="0"
                                />
                                <Text fontSize="xs" color="gray.500">Positive: Move Right</Text>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Vertical Offset (Y) mm</FormLabel>
                                <Input
                                    type="number"
                                    value={offsetY}
                                    onChange={(e) => setOffsetY(e.target.value)}
                                    placeholder="0"
                                />
                                <Text fontSize="xs" color="gray.500">Positive: Move Down</Text>
                            </FormControl>
                        </HStack>

                        <Box bg="blue.50" p={3} borderRadius="md">
                            <Text fontSize="xs" color="blue.600">
                                <strong>Tip:</strong> 1 inch = 25.4 mm. Measure the misalignment on your printed receipt and enter the correction here.
                            </Text>
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="outline" mr={3} leftIcon={<FiPrinter />} onClick={handleTestPrint}>
                        Test Print
                    </Button>
                    <Button colorScheme="blue" leftIcon={<FiSave />} onClick={handleSave}>
                        Save Settings
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
