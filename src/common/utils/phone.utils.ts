export enum PaymentProvider {
    TIGO = 'Tigo',
    MPESA = 'Mpesa',
    AIRTEL = 'Airtel',
    HALOPESA = 'Halopesa',
    AZAMPESA = 'Azampesa'
}

export class PhoneUtils {
    private static readonly TIGO_PREFIXES = ['25571', '25565', '25567'];
    private static readonly MPESA_PREFIXES = ['25574', '25575', '25576'];
    private static readonly AIRTEL_PREFIXES = ['25578', '25568', '25569'];
    private static readonly HALOPESA_PREFIXES = ['25561', '25562'];

    /**
     * Converts a phone number to standard format (255XXXXXXXXX)
     */
    static convertToStandardFormat(phoneNumber: string): string {
        // Remove any non-digit characters
        const cleanedNumber = phoneNumber.replace(/\D/g, '');

        // Check if the number starts with '0', and prepend '255' if necessary
        if (cleanedNumber.startsWith('0')) {
            return '255' + cleanedNumber.substring(1);
        }
        else if (cleanedNumber.startsWith('255')) {
            return cleanedNumber;
        }
        else if (cleanedNumber.startsWith('7')) {
            return '255' + cleanedNumber;
        }
        else if (cleanedNumber.startsWith('+')) {
            return cleanedNumber.substring(1);
        } else {
            return cleanedNumber;
        }
    }

    /**
     * Determines the payment provider based on the phone number prefix
     */
    static determineProvider(phoneNumber: string): PaymentProvider {
        const cleanedPhoneNumber = this.convertToStandardFormat(phoneNumber);
        const prefix = cleanedPhoneNumber.substring(0, 5);

        if (this.TIGO_PREFIXES.includes(prefix)) {
            return PaymentProvider.TIGO;
        } else if (this.MPESA_PREFIXES.includes(prefix)) {
            return PaymentProvider.MPESA;
        } else if (this.AIRTEL_PREFIXES.includes(prefix)) {
            return PaymentProvider.AIRTEL;
        } else if (this.HALOPESA_PREFIXES.includes(prefix)) {
            return PaymentProvider.HALOPESA;
        }

        return PaymentProvider.AZAMPESA;
    }

    /**
     * Validates if the phone number is in the correct format
     */
    static isValidPhoneNumber(phoneNumber: string): boolean {
        return phoneNumber.startsWith('255') && phoneNumber.length === 12;
    }

    /**
     * Filters and validates a phone number
     * @returns The standardized phone number if valid, null otherwise
     */
    static filterPhoneNumber(phoneNumber: string): string | null {
        const convertedPhoneNumber = this.convertToStandardFormat(phoneNumber);
        return this.isValidPhoneNumber(convertedPhoneNumber) ? convertedPhoneNumber : null;
    }
} 