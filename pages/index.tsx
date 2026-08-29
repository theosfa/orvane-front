import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Orvane</title>
        <meta name="description" content="Welcome to Orvane" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://orvane.com">Orvane</a>
        </h1>

        <p className={styles.description}>
          Get ready to experience the future with Orvane.
        </p>

        <div className={styles.grid}>
          <a href="/signup" className={styles.card}>
            <h2>Sign Up &rarr;</h2>
            <p>Create an account to get started.</p>
          </a>

          <a href="/login" className={styles.card}>
            <h2>Login &rarr;</h2>
            <p>Access your account.</p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
          </span>
        </a>
      </footer>
    </div>
  );
}
