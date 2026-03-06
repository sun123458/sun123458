/**
 * Storage Module
 * Handles localStorage operations for the Medical Management System
 */

const Storage = {
    // Storage keys
    KEYS: {
        PATIENTS: 'clinic_patients',
        APPOINTMENTS: 'clinic_appointments',
        MEDICATIONS: 'clinic_medications',
        SETTINGS: 'clinic_settings',
        VITALS: 'clinic_vitals'
    },

    /**
     * Save patients to localStorage
     */
    savePatients(patients) {
        try {
            localStorage.setItem(this.KEYS.PATIENTS, JSON.stringify(patients));
            return true;
        } catch (error) {
            console.error('Error saving patients:', error);
            return false;
        }
    },

    /**
     * Get patients from localStorage
     */
    getPatients() {
        try {
            const data = localStorage.getItem(this.KEYS.PATIENTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading patients:', error);
            return [];
        }
    },

    /**
     * Save appointments to localStorage
     */
    saveAppointments(appointments) {
        try {
            localStorage.setItem(this.KEYS.APPOINTMENTS, JSON.stringify(appointments));
            return true;
        } catch (error) {
            console.error('Error saving appointments:', error);
            return false;
        }
    },

    /**
     * Get appointments from localStorage
     */
    getAppointments() {
        try {
            const data = localStorage.getItem(this.KEYS.APPOINTMENTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading appointments:', error);
            return [];
        }
    },

    /**
     * Save medications to localStorage
     */
    saveMedications(medications) {
        try {
            localStorage.setItem(this.KEYS.MEDICATIONS, JSON.stringify(medications));
            return true;
        } catch (error) {
            console.error('Error saving medications:', error);
            return false;
        }
    },

    /**
     * Get medications from localStorage
     */
    getMedications() {
        try {
            const data = localStorage.getItem(this.KEYS.MEDICATIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading medications:', error);
            return [];
        }
    },

    /**
     * Save vital signs to localStorage
     */
    saveVitals(vitals) {
        try {
            localStorage.setItem(this.KEYS.VITALS, JSON.stringify(vitals));
            return true;
        } catch (error) {
            console.error('Error saving vitals:', error);
            return false;
        }
    },

    /**
     * Get vital signs from localStorage
     */
    getVitals() {
        try {
            const data = localStorage.getItem(this.KEYS.VITALS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading vitals:', error);
            return [];
        }
    },

    /**
     * Save settings to localStorage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    },

    /**
     * Get settings from localStorage
     */
    getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    },

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            fontSize: 'normal',
            highContrast: false,
            theme: 'light'
        };
    },

    /**
     * Export all data as JSON file
     */
    exportAllData() {
        try {
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                patients: this.getPatients(),
                appointments: this.getAppointments(),
                medications: this.getMedications(),
                vitals: this.getVitals(),
                settings: this.getSettings()
            };

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `clinic-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    },

    /**
     * Import data from JSON file
     */
    async importAllData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Validate data structure
                    if (!data.version || !data.patients) {
                        throw new Error('Invalid data format');
                    }

                    // Import all data
                    if (data.patients) this.savePatients(data.patients);
                    if (data.appointments) this.saveAppointments(data.appointments);
                    if (data.medications) this.saveMedications(data.medications);
                    if (data.vitals) this.saveVitals(data.vitals);
                    if (data.settings) this.saveSettings(data.settings);

                    resolve({
                        success: true,
                        patients: data.patients?.length || 0,
                        appointments: data.appointments?.length || 0,
                        medications: data.medications?.length || 0
                    });
                } catch (error) {
                    console.error('Error importing data:', error);
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    },

    /**
     * Clear all application data
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.KEYS.PATIENTS);
            localStorage.removeItem(this.KEYS.APPOINTMENTS);
            localStorage.removeItem(this.KEYS.MEDICATIONS);
            localStorage.removeItem(this.KEYS.VITALS);
            localStorage.removeItem(this.KEYS.SETTINGS);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    },

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('clinic_')) {
                    total += localStorage[key].length + key.length;
                }
            }
            return {
                usedBytes: total,
                usedKB: (total / 1024).toFixed(2),
                remainingBytes: 5 * 1024 * 1024 - total, // ~5MB limit
                remainingKB: ((5 * 1024 * 1024 - total) / 1024).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
