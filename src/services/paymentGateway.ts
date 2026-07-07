/**
 * Simulates a payment creation request to a payment gateway API (e.g. Midtrans Snap / Xendit Invoice).
 * 
 * @param totalAmount The total payment amount.
 * @returns A promise containing a success indicator and a mock checkout payment URL.
 */
export async function processPayment(totalAmount: number): Promise<{ success: boolean; paymentUrl: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate unique transaction ID
      const transactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Simulate Sandbox checkout URL
      const mockCheckoutUrl = `https://checkout.sandbox.paymentgateway.com/pay?invoice=${transactionId}&amount=${totalAmount}`;

      resolve({
        success: true,
        paymentUrl: mockCheckoutUrl,
      });
    }, 1500); // Simulate 1.5-second API POST request latency
  });
}
