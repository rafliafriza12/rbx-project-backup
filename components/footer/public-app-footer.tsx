import Link from "next/link";
import Image from "next/image";
const PublicAppFooter: React.FC = () => {
  return (
    <footer className="bg-[#1E0E38] text-white px-6 md:px-16 py-10 mt-10 border-t border-[#7C4DFF]/30">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <Image
            src="/logo.png"
            alt="RID Logo"
            width={80}
            height={80}
            className="mb-2"
          />
          <p className="text-sm text-gray-400 pl-[4px]">
            RobuxID, kami mengutamakan kecepatan, keamanan, dan harga yang
            bersahabat. Beli Robux tanpa khawatir, nikmati pengiriman kilat, dan
            pilih metode pembayaran favorit Anda. Pengalaman bermain Roblox
            terbaik, dimulai dari sini!
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-2">Menu</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/rbx5">Robux 5 Hari</Link>
            </li>
            <li>
              <Link href="#">Robux Instant</Link>
            </li>
            <li>
              <Link href="/gamepass">Gamepass</Link>
            </li>
            <li>
              <Link href="/joki">Jasa Joki</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-2">Dukungan</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>
              <Link href="#">FAQ</Link>
            </li>
            <li>
              <Link href="#">Kontak</Link>
            </li>
            <li>
              <Link href="#">Cara Beli</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-2">Legalitas</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>
              <Link href="#">Kebijakan Privasi</Link>
            </li>
            <li>
              <Link href="#">Syarat & Ketentuan</Link>
            </li>
            <li>
              <Link href="#">Affiliate</Link>
            </li>
          </ul>
          <div className="flex space-x-4 mt-4">
            <Image src="/wa.png" alt="wa" width={24} height={24} />
            <Image src="/ig.png" alt="ig" width={24} height={24} />
            <Image src="/discord.png" alt="discord" width={24} height={24} />
          </div>
        </div>
      </div>
      <p className="text-center text-gray-500 text-sm mt-10">© 2025 RobuxID</p>
    </footer>
  );
};

export default PublicAppFooter;
