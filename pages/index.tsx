import Head from 'next/head'
import Generator from '../components/Generator'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <>
      <Head>
        <title>WAGDIE Text Generator</title>
        <meta name="description" content="Generate WAGDIE style text" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>

      <main className={styles.container}>
        <h1>WAGDIE Text Generator</h1>
        <Generator />
      </main>
    </>
  )
}
