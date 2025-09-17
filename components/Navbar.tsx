// components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
      <div className="text-red-600 font-bold text-2xl">Rid</div>
      <div className="flex gap-6 text-sm">
        <Link href="/">Home</Link>
        <Link href="/robux-5-hari">Robux 5 Hari</Link>
        <Link href="/robux-instan">Robux Instan</Link>
        <Link href="/gamepass" className="text-red-500 font-semibold">Gamepass</Link>
        <Link href="/jasa-joki">Jasa Joki</Link>
      </div>
      <div className="flex gap-3">
        <button className="bg-red-500 text-white px-4 py-1 rounded-md">Sign up</button>
        <button className="border border-gray-400 px-4 py-1 rounded-md text-sm">Login</button>
      </div>
    </nav>
  );
}
