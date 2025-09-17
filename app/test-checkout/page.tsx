"use client";
import { useRouter } from "next/navigation";

export default function TestCheckoutPage() {
  const router = useRouter();

  const testSessionStorage = () => {
    const testData = {
      serviceType: "joki",
      serviceId: "test-123",
      serviceName: "Test Service",
      serviceImage: "/test.png",
      quantity: 1,
      unitPrice: 50000,
      robloxUsername: "testuser",
      robloxPassword: "testpass",
    };

    console.log("=== TEST: Storing data to sessionStorage ===");
    console.log("Data to store:", testData);

    try {
      sessionStorage.setItem("checkoutData", JSON.stringify(testData));
      console.log("✅ Data stored successfully");

      // Verify immediately
      const stored = sessionStorage.getItem("checkoutData");
      console.log("✅ Verified stored data:", stored);

      // Navigate to checkout
      setTimeout(() => {
        console.log("📍 Navigating to checkout...");
        router.push("/checkout");
      }, 500);
    } catch (error) {
      console.error("❌ Error storing data:", error);
    }
  };

  const testUrlParams = () => {
    const params = new URLSearchParams({
      serviceType: "joki",
      serviceId: "test-123",
      serviceName: "Test Service URL",
      serviceImage: "/test.png",
      quantity: "1",
      unitPrice: "50000",
    });

    console.log("=== TEST: Using URL params ===");
    console.log("URL params:", params.toString());

    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Test Checkout Data Transfer
        </h1>

        <div className="space-y-4">
          <button
            onClick={testSessionStorage}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🧪 Test SessionStorage Method
          </button>

          <button
            onClick={testUrlParams}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            🔗 Test URL Params Method
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
            💡 <strong>Instruksi:</strong>
            <br />
            1. Buka console browser (F12)
            <br />
            2. Klik salah satu tombol test
            <br />
            3. Lihat log di console untuk debugging
          </p>
        </div>
      </div>
    </div>
  );
}
