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
        <div className={styles.header}>
          <div className={styles.logo}>
            <Image src="/wagdie.png" alt="WAGDIE" width={256} height={256} />
          </div>
          <h1 className={styles.title}>WAGDIE Text Generator</h1>
        </div>

        <Generator />
      </main>
    </>
  )
}
