const methods = [
  { label: 'QRIS' },
  { label: 'E-WALLET', children: ['DANA', 'GOPAY', 'SHOPEE'] },
  { label: 'VIRTUAL ACCOUNT' },
  { label: 'MINIMARKET' },
];

export default function PaymentMethod() {
  return (
    <div className="w-full max-w-md">
      <h3 className="font-bold mb-4">2. PILIH METODE PEMBAYARAN</h3>
      <div className="space-y-3">
        {methods.map((method, i) => (
          <details key={i} className="bg-[#f8cfcf] p-3 rounded-lg">
            <summary className="font-semibold cursor-pointer">{method.label}</summary>
            {method.children && (
              <ul className="mt-2 pl-4 text-sm list-disc">
                {method.children.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
