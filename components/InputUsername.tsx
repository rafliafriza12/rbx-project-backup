export default function InputUsername() {
  return (
    <div className="bg-[#f8cfcf] rounded-xl p-6 w-full max-w-md flex flex-col items-center gap-4">
      <img src="/icons/coin.svg" alt="Coin" className="w-20 h-20" />

      <div className="text-left w-full">
        <h3 className="font-bold mb-1">1. MASUKAN USERNAME</h3>
        <p className="text-sm text-gray-700 mb-3">
          Masukkan Username Anda untuk memastikan Robux akan dikirim ke akun yang benar.
        </p>
        <input
          type="text"
          placeholder="MASUKAN USERNAME"
          className="w-full px-4 py-2 rounded-md outline-none bg-white border border-gray-300"
        />
        <p className="text-xs text-gray-600 mt-2">
          Ketik minimal 2 karakter untuk mencari username.<br />
          Kami hanya meminta username, bukan password.
        </p>
      </div>
    </div>
  );
}
