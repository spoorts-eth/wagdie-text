import Head from 'next/head'
import Generator from '../components/Generator'

export default function Home() {
  return (
    <div>
      <Head>
        <title>WAGDIE Text Generator</title>
        <meta name="description" content="Generate WAGDIE style text" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>

      <main>
        <h1>WAGDIE Text Generator</h1>
        <Generator />
      </main>
    </div>
  )
}
