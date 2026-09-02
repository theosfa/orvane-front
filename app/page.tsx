import Head from 'next/head';
import styles from '../../styles/landing.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Home3</title>
        <meta name="description" content="One app for a joined-up life." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.eyebrow}>One app for a joined-up life.</div>
          <h1 className={styles.headline}>You don't manage three apps. You run one life.</h1>
          <p className={styles.subtext}>Home3 keeps food, money, and plans in one place — so a decision in one shows up where it matters in another.</p>
          <div className={styles.buttons}>
            <button className={styles.button}>Get started</button>
            <button className={styles.button}>Sign in</button>
          </div>
        </div>

        <div className={styles.modules}>
          <div className={styles.module}>
            <h2 className={styles.moduleTitle}>Food</h2>
            <p className={styles.moduleDescription}>Plan meals, save recipes, and check off the grocery run without leaving the kitchen in your head.</p>
            <p className={styles.moduleExample}>Live example: Tue — Lentil soup</p>
          </div>
          <div className={styles.module}>
            <h2 className={styles.moduleTitle}>Finance</h2>
            <p className={styles.moduleDescription}>See what came in, what went out, and what's left — at a glance, not at month's end.</p>
            <p className={styles.moduleExample}>Live example: This month — $860 left</p>
          </div>
          <div className={styles.module}>
            <h2 className={styles.moduleTitle}>Future</h2>
            <p className={styles.moduleDescription}>Turn open evenings and long-term goals into a short, clear list of what's next.</p>
            <p className={styles.moduleExample}>Live example: Next — Renew passport</p>
          </div>
        </div>

        <div className={styles.howItConnects}>
          <h2 className={styles.howItConnectsTitle}>How It Connects</h2>
          <p className={styles.howItConnectsText}>Log a grocery run in Food, and it appears as a line in Finance. Save toward a goal in Finance, and it turns into a plan in Future. Free up an evening in Future, and Food turns it into a meal plan.</p>
        </div>

        <div className={styles.closing}>
          <h2 className={styles.closingTitle}>Ready to run one life instead of three apps?</h2>
          <div className={styles.buttons}>
            <button className={styles.button}>Get started</button>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <nav className={styles.navbar}>
          <ul className={styles.navbarList}>
            <li className={styles.navbarItem}>Home</li>
            <li className={styles.navbarItem}>About</li>
            <li className={styles.navbarItem}>Contact</li>
          </ul>
        </nav>
      </footer>
    </div>
  );
}
