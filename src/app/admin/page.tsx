'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === 'admin123') {
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
        <Image
          src="/pocketConcertsLogo.jpg"
          alt="pc logo"
          width={30}
          height={200}
          className="absolute"
        />
        <h2 className="text-xl font-bold text-center">Admin Login</h2>
        <div className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Enter password"
            className="border p-2 w-full rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-black text-white p-2 rounded w-full cursor-pointer">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
