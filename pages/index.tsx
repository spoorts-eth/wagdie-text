import Head from 'next/head'
import Image from 'next/image'
import Generator from '../components/Generator'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <>
      <Head>
        <title>WAGDIE Text Generator</title>
        <meta name="description" content="Generate WAGDIE style text" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.container}>
        <div className={styles.containerInner}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <Image src="/wagdie.png" alt="WAGDIE" width={256} height={256} />
            </div>
            <h1 className={styles.title}>WAGDIE Text Generator</h1>
          </div>

          <Generator />
          <div className={styles.footer}>
            <a
              href="https://github.com/spoorts-eth/wagdie-text"
              target="_blank"
              rel="noreferrer"
            >
              <Image
                src="/github.svg"
                alt="GitHub"
                width={32}
                height={32}
                color="white"
              />
            </a>
          </div>
          <a
            href="https://twitter.com/spaawts"
            target="_blank"
            rel="noreferrer"
          >
            <div className={styles.credits}>
              <Image
                src="/spoorts.png"
                alt="spoorts.eth"
                width={64}
                height={64}
              />
              <span>Created by Spoorts.eth</span>
            </div>
          </a>
        </div>
      </main>
    </>
  )
}
