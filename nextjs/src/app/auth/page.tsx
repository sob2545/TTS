"use client";

import { signIn } from "next-auth/react";
import styles from "@/styles/AuthPage.module.css";

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>App Title</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className={styles.loginButton}
        >
          Log in with Google
        </button>
      </div>
    </div>
  );
}
