import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { usePrinter } from '../hooks/usePrinter';

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const { testPrint } = usePrinter();
  const [activeTab, setActiveTab] = useState('store');
  const [saved, setSaved] = useState(false);

  // Check if user has manager/admin access
  const hasAccess = user.role === 'manager' || user.role === 'admin';

  // Settings state
  const [taxRate, setTaxRate] = useState('8.5');
  const [printerType, setPrinterType] = useState('standard');
  const [printerName, setPrinterName] = useState('');
  const [paperWidth, setPaperWidth] = useState('80mm');
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [showLogo, setShowLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultReceiptAction, setDefaultReceiptAction] = useState('print');
  const [scannerType, setScannerType] = useState('usb');
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setTaxRate(localStorage.getItem('pos_tax_rate') || '8.5');

    const printerConfig = localStorage.getItem('pos_printer_config');
    if (printerConfig) {
      try {
        const config = JSON.parse(printerConfig);
        setPrinterType(config.type || 'standard');
        setPrinterName(config.name || '');
        setPaperWidth(config.paperWidth || '80mm');
      } catch (e) {
        console.error('Error loading printer config:', e);
      }
    }

    const receiptSettings = localStorage.getItem('pos_receipt_settings');
    if (receiptSettings) {
      try {
        const settings = JSON.parse(receiptSettings);
        setReceiptHeader(settings.headerText || '');
        setReceiptFooter(settings.footerText || '');
        setShowLogo(settings.showLogo || false);
        setLogoUrl(settings.logoUrl || '');
        setDefaultReceiptAction(settings.defaultAction || 'print');
      } catch (e) {
        console.error('Error loading receipt settings:', e);
      }
    }

    const hardwareConfig = localStorage.getItem('pos_hardware_config');
    if (hardwareConfig) {
      try {
        const config = JSON.parse(hardwareConfig);
        setScannerType(config.scannerType || 'usb');
      } catch (e) {
        console.error('Error loading hardware config:', e);
      }
    }

    const userPrefs = localStorage.getItem('pos_user_prefs');
    if (userPrefs) {
      try {
        const prefs = JSON.parse(userPrefs);
        setTheme(prefs.theme || 'light');
        setFontSize(prefs.fontSize || 'medium');
        setKeyboardShortcuts(prefs.keyboardShortcuts !== false);
        setSoundEffects(prefs.soundEffects || false);
      } catch (e) {
        console.error('Error loading user preferences:', e);
      }
    }
  }, []);

  // Save all settings
  const handleSaveAll = () => {
    // Tax settings
    localStorage.setItem('pos_tax_rate', taxRate);

    // Printer config
    localStorage.setItem('pos_printer_config', JSON.stringify({
      type: printerType,
      name: printerName,
      paperWidth: paperWidth,
    }));

    // Receipt settings
    localStorage.setItem('pos_receipt_settings', JSON.stringify({
      headerText: receiptHeader,
      footerText: receiptFooter,
      showLogo: showLogo,
      logoUrl: logoUrl,
      defaultAction: defaultReceiptAction,
    }));

    // Hardware config
    localStorage.setItem('pos_hardware_config', JSON.stringify({
      scannerType: scannerType,
    }));

    // User preferences
    localStorage.setItem('pos_user_prefs', JSON.stringify({
      theme: theme,
      fontSize: fontSize,
      keyboardShortcuts: keyboardShortcuts,
      soundEffects: soundEffects,
    }));

    // Also save individual items for backward compatibility
    localStorage.setItem('pos_receipt_header', receiptHeader);
    localStorage.setItem('pos_receipt_footer', receiptFooter);
    localStorage.setItem('pos_receipt_show_logo', showLogo.toString());
    localStorage.setItem('pos_receipt_logo_url', logoUrl);
    localStorage.setItem('pos_shortcuts_enabled', keyboardShortcuts.toString());

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Reset to defaults
  const handleReset = () => {
    if (!window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    localStorage.removeItem('pos_tax_rate');
    localStorage.removeItem('pos_printer_config');
    localStorage.removeItem('pos_receipt_settings');
    localStorage.removeItem('pos_hardware_config');
    localStorage.removeItem('pos_user_prefs');
    localStorage.removeItem('pos_receipt_header');
    localStorage.removeItem('pos_receipt_footer');
    localStorage.removeItem('pos_receipt_show_logo');
    localStorage.removeItem('pos_receipt_logo_url');
    localStorage.removeItem('pos_shortcuts_enabled');

    window.location.reload();
  };

  if (!hasAccess) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
        </div>
        <div style={styles.accessDenied}>
          <div style={styles.accessDeniedIcon}>🔒</div>
          <h2>Access Denied</h2>
          <p>Manager privileges required to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
      </div>

      <div style={styles.content}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <button
            onClick={() => setActiveTab('store')}
            style={{
              ...styles.sidebarButton,
              ...(activeTab === 'store' ? styles.sidebarButtonActive : {}),
            }}
          >
            Store Information
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            style={{
              ...styles.sidebarButton,
              ...(activeTab === 'tax' ? styles.sidebarButtonActive : {}),
            }}
          >
            Tax Settings
          </button>
          <button
            onClick={() => setActiveTab('printer')}
            style={{
              ...styles.sidebarButton,
              ...(activeTab === 'printer' ? styles.sidebarButtonActive : {}),
            }}
          >
            Printer Configuration
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            style={{
              ...styles.sidebarButton,
              ...(activeTab === 'receipt' ? styles.sidebarButtonActive : {}),
            }}
          >
            Receipt Settings
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            style={{
              ...styles.sidebarButton,
              ...(activeTab === 'hardware' ? styles.sidebarButtonActive : {}),
            }}
          >
            Hardware Setup
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              ...styles.sidebarButton,
              ...(activeTab === 'preferences' ? styles.sidebarButtonActive : {}),
            }}
          >
            User Preferences
          </button>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          {/* Store Information */}
          {activeTab === 'store' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Store Information</h2>
              <div style={styles.infoBox}>
                <div style={styles.infoItem}>
                  <strong>Store Name:</strong> SAP Store
                </div>
                <div style={styles.infoItem}>
                  <strong>Address:</strong> 123 Main Street
                </div>
                <div style={styles.infoItem}>
                  <strong>Phone:</strong> (555) 555-5555
                </div>
                <div style={styles.infoItem}>
                  <strong>Business Hours:</strong> Mon-Fri 9:00 AM - 6:00 PM
                </div>
              </div>
              <div style={styles.note}>
                To update store information, use the Admin Dashboard
              </div>
            </div>
          )}

          {/* Tax Settings */}
          {activeTab === 'tax' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Tax Settings</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  style={styles.input}
                />
                <div style={styles.helpText}>
                  Current tax rate: {taxRate}% (must be between 0 and 100)
                </div>
              </div>
            </div>
          )}

          {/* Printer Configuration */}
          {activeTab === 'printer' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Printer Configuration</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Printer Type</label>
                <select
                  value={printerType}
                  onChange={(e) => setPrinterType(e.target.value)}
                  style={styles.select}
                >
                  <option value="thermal">Thermal Printer</option>
                  <option value="standard">Standard Printer</option>
                  <option value="none">None (Print to PDF)</option>
                </select>
              </div>

              {printerType === 'thermal' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Printer Name/Path</label>
                    <input
                      type="text"
                      value={printerName}
                      onChange={(e) => setPrinterName(e.target.value)}
                      placeholder="e.g., EPSON TM-T20"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Paper Width</label>
                    <select
                      value={paperWidth}
                      onChange={(e) => setPaperWidth(e.target.value)}
                      style={styles.select}
                    >
                      <option value="80mm">80mm</option>
                      <option value="58mm">58mm</option>
                    </select>
                  </div>
                </>
              )}

              {printerType === 'standard' && (
                <div style={styles.infoBox}>
                  <p>Will use system default printer</p>
                </div>
              )}

              <button onClick={testPrint} style={styles.button}>
                Test Print
              </button>
            </div>
          )}

          {/* Receipt Settings */}
          {activeTab === 'receipt' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Receipt Settings</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Receipt Header Text</label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  placeholder="e.g., Thank you for shopping!"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Receipt Footer Text</label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="e.g., Returns within 60 days"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>Show logo on receipt</span>
                </label>
              </div>

              {showLogo && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Logo URL</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    style={styles.input}
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Default Receipt Action</label>
                <select
                  value={defaultReceiptAction}
                  onChange={(e) => setDefaultReceiptAction(e.target.value)}
                  style={styles.select}
                >
                  <option value="print">Always Print</option>
                  <option value="email">Always Email</option>
                  <option value="ask">Ask Customer</option>
                </select>
              </div>
            </div>
          )}

          {/* Hardware Setup */}
          {activeTab === 'hardware' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Hardware Setup</h2>

              <h3 style={styles.subsectionTitle}>Barcode Scanner</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Scanner Type</label>
                <select
                  value={scannerType}
                  onChange={(e) => setScannerType(e.target.value)}
                  style={styles.select}
                >
                  <option value="usb">USB Scanner</option>
                  <option value="camera">Camera</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {scannerType === 'camera' || scannerType === 'both' ? (
                <div style={styles.infoBox}>
                  <p>Camera scanning will be available in product search</p>
                </div>
              ) : null}

              <h3 style={styles.subsectionTitle}>Cash Drawer</h3>
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    style={styles.checkbox}
                  />
                  <span>Enable cash drawer</span>
                </label>
              </div>
            </div>
          )}

          {/* User Preferences */}
          {activeTab === 'preferences' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>User Preferences</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={styles.select}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <div style={styles.helpText}>
                  Theme changes will apply after restart
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  style={styles.select}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={keyboardShortcuts}
                    onChange={(e) => setKeyboardShortcuts(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>Enable keyboard shortcuts</span>
                </label>
                {keyboardShortcuts && (
                  <div style={styles.infoBox}>
                    <strong>Available shortcuts:</strong><br />
                    F2 - Apply Discount<br />
                    F3 - Customer Lookup<br />
                    F4 - Complete Sale<br />
                    Ctrl+D - Clear Cart
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>Enable sound effects</span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={styles.footer}>
            <button onClick={handleReset} style={styles.resetButton}>
              Reset to Defaults
            </button>
            <button onClick={handleSaveAll} style={styles.saveButton}>
              Save All Settings
            </button>
          </div>

          {saved && (
            <div style={styles.successMessage}>
              ✓ Settings saved successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: '24px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
  },
  sidebarButton: {
    padding: '16px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666666',
    transition: 'background-color 0.2s',
    borderLeft: '3px solid transparent',
  },
  sidebarButtonActive: {
    backgroundColor: '#f5f5f5',
    color: '#2196f3',
    fontWeight: 'bold',
    borderLeftColor: '#2196f3',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 0,
    marginBottom: '24px',
  },
  subsectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: '24px',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  },
  helpText: {
    fontSize: '12px',
    color: '#999999',
    marginTop: '4px',
  },
  infoBox: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#666666',
    marginTop: '8px',
  },
  note: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#1976d2',
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#2196f3',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '16px',
  },
  footer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-end',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e0e0e0',
  },
  resetButton: {
    padding: '14px 24px',
    border: '1px solid #f44336',
    backgroundColor: '#ffffff',
    color: '#f44336',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  saveButton: {
    padding: '14px 24px',
    border: 'none',
    backgroundColor: '#2196f3',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  successMessage: {
    padding: '16px',
    marginTop: '16px',
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  accessDenied: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '40px',
    textAlign: 'center',
  },
  accessDeniedIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
};
