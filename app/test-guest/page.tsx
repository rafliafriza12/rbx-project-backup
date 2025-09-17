"use client";
import { useRouter } from "next/navigation";

export default function TestGuestCheckoutPage() {
  const router = useRouter();

  const startGuestCheckout = () => {
    const testData = {
      serviceType: "joki",
      serviceId: "test-guest-123",
      serviceName: "Test Guest Joki Service",
      serviceImage: "/test.png",
      quantity: 1,
      unitPrice: 25000,
    };

    console.log("=== GUEST CHECKOUT TEST ===");
    console.log("Creating guest checkout with data:", testData);

    // Store in sessionStorage
    sessionStorage.setItem("checkoutData", JSON.stringify(testData));

    // Navigate to checkout
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Test Guest Checkout
        </h1>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Test Guest Checkout
            </h3>
            <p className="text-sm text-blue-700">
              Checkout tanpa login dengan mengisi data customer info manual.
            </p>
          </div>

          <button
            onClick={startGuestCheckout}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🛒 Start Guest Checkout
          </button>

          <button
            onClick={() => router.push("/login")}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            🔐 Login First (Recommended)
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            🏠 Back to Home
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Note:</strong>
            <br />
            • Guest checkout memerlukan nama, email, dan nomor HP
            <br />
            • User yang sudah login akan terisi otomatis
            <br />• Buka console untuk melihat debug log
          </p>
        </div>
      </div>
    </div>
  );
}
