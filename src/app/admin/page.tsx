'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (!expected) {
      alert('Missing NEXT_PUBLIC_ADMIN_PASSWORD env var');
      return;
    }

    if (password === expected) {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin/registrations');
    } else {
      alert('Incorrect password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm relative h-50 flex flex-col gap-4 justify-between"
      >
        <h2 className="text-xl font-bold text-center text-[#920d25]">Admin Login</h2>
        <div className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Enter password"
            className="border p-2 w-full rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-[#920d25] text-white p-2 rounded w-full cursor-pointer">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
