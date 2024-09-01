"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">App Title</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Log in with Google
        </button>
      </div>
    </div>
  );
}
