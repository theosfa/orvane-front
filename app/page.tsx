import Head from 'next/head';
import '../styles/landing.css';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Home3</title>
        <meta name="description" content="One app for a joined-up life." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="hero">
          <div className="eyebrow">One app for a joined-up life.</div>
          <h1 className="headline">You don't manage three apps. You run one life.</h1>
          <p className="subtext">Home3 keeps food, money, and plans in one place — so a decision in one shows up where it matters in another.</p>
          <div className="buttons">
            <button className="button">Get started</button>
            <button className="button">Sign in</button>
          </div>
        </div>

        <div className="modules">
          <div className="module">
            <h2 className="moduleTitle">Food</h2>
            <p className="moduleDescription">Plan meals, save recipes, and check off the grocery run without leaving the kitchen in your head.</p>
            <p className="moduleExample">Live example: Tue — Lentil soup</p>
          </div>
          <div className="module">
            <h2 className="moduleTitle">Finance</h2>
            <p className="moduleDescription">See what came in, what went out, and what's left — at a glance, not at month's end.</p>
            <p className="moduleExample">Live example: This month — $860 left</p>
          </div>
          <div className="module">
            <h2 className="moduleTitle">Future</h2>
            <p className="moduleDescription">Turn open evenings and long-term goals into a short, clear list of what's next.</p>
            <p className="moduleExample">Live example: Next — Renew passport</p>
          </div>
        </div>

        <div className="howItConnects">
          <h2 className="howItConnectsTitle">How It Connects</h2>
          <p className="howItConnectsText">Log a grocery run in Food, and it appears as a line in Finance. Save toward a goal in Finance, and it turns into a plan in Future. Free up an evening in Future, and Food turns it into a meal plan.</p>
        </div>

        <div className="closing">
          <h2 className="closingTitle">Ready to run one life instead of three apps?</h2>
          <div className="buttons">
            <button className="button">Get started</button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <nav className="navbar">
          <ul className="navbarList">
            <li className="navbarItem">Home</li>
            <li className="navbarItem">About</li>
            <li className="navbarItem">Contact</li>
          </ul>
        </nav>
      </footer>
    </div>
  );
}
