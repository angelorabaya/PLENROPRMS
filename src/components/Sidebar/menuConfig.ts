import { FiHome, FiFileText, FiBriefcase, FiMapPin, FiCreditCard } from 'react-icons/fi';
import { FaPesoSign } from 'react-icons/fa6';
import type { MenuItem } from './types';

/**
 * Sidebar menu configuration
 * Easy to extend - just add new items to this array
 */
export const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: FiHome,
  },
  {
    id: 'permit-extraction',
    label: 'Permit Extraction',
    icon: FiFileText,
    children: [
      {
        id: 'barangay-share',
        label: 'Barangay Share (Summary)',
        path: '/permit-extraction/barangay-share',
        icon: FiMapPin,
      },
      {
        id: 'municipal-share',
        label: 'Municipal Share (Summary)',
        path: '/permit-extraction/municipal-share',
        icon: FiMapPin,
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: FaPesoSign,
    children: [
      {
        id: 'barangay-share-payment',
        label: 'Barangay Share Payment',
        path: '/payments/barangay-share-payment',
        icon: FiCreditCard,
      },
      {
        id: 'municipal-share-payment',
        label: 'Municipal Share Payment',
        path: '/payments/municipal-share-payment',
        icon: FiCreditCard,
      },
    ],
  },
  {
    id: 'collections',
    label: 'Collections',
    icon: FiBriefcase,
    children: [
      {
        id: 'payment-collections',
        label: 'Payment Collections',
        path: '/collections/payment-collections',
        icon: FiCreditCard,
      },
    ],
  },
];
