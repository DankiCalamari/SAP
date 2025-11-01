import { useState, useEffect } from 'react';
import api from '../api';

/**
 * usePrinter - Handle receipt printing configuration and execution
 * @returns {object} { printerConfig, print, emailReceipt, testPrint }
 */
export function usePrinter() {
  const [printerConfig, setPrinterConfig] = useState({
    type: 'standard',
    name: 'default',
    paperWidth: '80mm',
  });

  // Load printer config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('pos_printer_config');
    if (savedConfig) {
      try {
        setPrinterConfig(JSON.parse(savedConfig));
      } catch (err) {
        console.error('Error loading printer config:', err);
      }
    }
  }, []);

  /**
   * print - Print receipt
   * @param {HTMLElement} receiptElement - Receipt element to print
   */
  const print = (receiptElement) => {
    if (!receiptElement) {
      console.error('No receipt element provided');
      return;
    }

    if (printerConfig.type === 'thermal') {
      // Use Electron IPC to send to thermal printer
      if (window.electron && window.electron.print) {
        window.electron.print({
          printer: printerConfig.name,
          html: receiptElement.innerHTML,
        });
      } else {
        console.warn('Electron print API not available, falling back to window.print');
        window.print();
      }
    } else if (printerConfig.type === 'standard') {
      // Use browser print dialog
      window.print();
    } else if (printerConfig.type === 'none') {
      // Generate PDF and download
      // For now, use print dialog (PDF generation would require additional library)
      window.print();
    }
  };

  /**
   * emailReceipt - Send receipt via email
   * @param {number} transactionId - Transaction ID
   * @param {string} email - Customer email address
   * @returns {Promise} Promise that resolves on success
   */
  const emailReceipt = async (transactionId, email) => {
    try {
      await api.emailReceipt(transactionId, email);
      return { success: true };
    } catch (err) {
      console.error('Error emailing receipt:', err);
      throw err;
    }
  };

  /**
   * testPrint - Print a test receipt
   */
  const testPrint = () => {
    const now = new Date();
    const testHTML = `
      <div style="width: 300px; font-family: monospace; padding: 20px;">
        <h2 style="text-align: center;">TEST PRINT</h2>
        <p style="text-align: center;">SAP POS System</p>
        <hr />
        <p>Date: ${now.toLocaleDateString()}</p>
        <p>Time: ${now.toLocaleTimeString()}</p>
        <hr />
        <p style="text-align: center;">If you can read this,<br/>your printer is working!</p>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = testHTML;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    print(tempDiv);

    // Clean up
    setTimeout(() => {
      document.body.removeChild(tempDiv);
    }, 1000);
  };

  return {
    printerConfig,
    print,
    emailReceipt,
    testPrint,
  };
}
