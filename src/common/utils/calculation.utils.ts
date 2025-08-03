export class CalculationUtils {
    /**
     * Calculate percentage contribution based on amount and goal target amount
     * @param amount Current contribution amount
     * @param targetAmount Goal's target amount
     * @returns Percentage contribution with 2 decimal places
     */
    static calculatePercentageContribution(amount: number, targetAmount: number): number {
        if (!targetAmount || targetAmount <= 0) return 0;
        return Number(((amount / targetAmount) * 100).toFixed(2));
    }

    /**
     * Format amount to currency string with Tsh prefix
     * @param amount Amount to format
     * @returns Formatted amount string (e.g., "Tsh 1,000,000")
     */
    static formatAmount(amount: number): string {
        return `Tsh ${amount.toLocaleString('en-US')}`;
    }

    /**
     * Calculate median value from an array of numbers
     * @param numbers Array of numbers
     * @returns Median value
     */
    static calculateMedian(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        
        return sorted[middle];
    }

    /**
     * Calculate success rate percentage
     * @param successfulCount Number of successful operations
     * @param totalCount Total number of operations
     * @returns Success rate percentage with 2 decimal places
     */
    static calculateSuccessRate(successfulCount: number, totalCount: number): number {
        if (totalCount === 0) return 0;
        return Number(((successfulCount / totalCount) * 100).toFixed(2));
    }

    /**
     * Calculate average processing time in hours
     * @param startTimes Array of start timestamps
     * @param endTimes Array of end timestamps
     * @returns Average processing time in hours
     */
    static calculateAverageProcessingTime(startTimes: Date[], endTimes: Date[]): number {
        if (startTimes.length === 0 || endTimes.length === 0) return 0;
        
        const processingTimes = startTimes.map((start, index) => {
            const end = endTimes[index];
            if (!start || !end) return 0;
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert to hours
        }).filter(time => time > 0);
        
        if (processingTimes.length === 0) return 0;
        
        const total = processingTimes.reduce((sum, time) => sum + time, 0);
        return Number((total / processingTimes.length).toFixed(2));
    }
} 