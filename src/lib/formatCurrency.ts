export function formatCurrency(amount: number | undefined) {
    return `₱${amount?.toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}