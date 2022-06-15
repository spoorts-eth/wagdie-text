import Head from 'next/head'
import Image from 'next/image'
import { useCallback, useRef } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Generator from '../components/Generator'
import Icon from '../components/Icon'
import styles from '../styles/Home.module.css'

export default function Home() {
  const logoJaw = useRef<HTMLDivElement>(null)
  const animate = useCallback(() => {
    if (!logoJaw.current) return
    logoJaw.current.animate(
      [
        { transform: 'translateY(0px)', easing: 'ease-out' },
        { transform: 'translateY(5px)', easing: 'ease-out' },
        { transform: 'translateY(0px)', easing: 'ease-out' },
      ],
      250
    )
  }, [])
  return (
    <>
      <Head>
        <title>WAGDIE Chat</title>
        <meta name="description" content="Generate WAGDIE style text" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.container}>
        <div className={styles.containerInner}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <div className={styles.logoBg}>
                <Image
                  src="/wagdie.png"
                  alt="WAGDIE"
                  width={256}
                  height={256}
                  quality={100}
                />
              </div>
              <div className={styles.logoJaw} ref={logoJaw}>
                <Image
                  src="/wagdie-jaw.png"
                  alt="WAGDIE jaw"
                  width={256}
                  height={256}
                  quality={100}
                />
              </div>
              <div className={styles.logoHead}>
                <Image
                  src="/wagdie-head.png"
                  alt="WAGDIE head"
                  width={256}
                  height={256}
                  quality={100}
                />
              </div>
            </div>
            <h1 className={styles.title}>WAGDIE Chat</h1>
          </div>

          <Generator onChange={animate} />
          <div className={styles.footer}>
            <a
              href="https://github.com/spoorts-eth/wagdie-text"
              target="_blank"
              rel="noreferrer"
            >
              <Icon>github</Icon>
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
                quality={100}
              />
              <span>Created by Spoorts.eth</span>
            </div>
          </a>
        </div>
        <ToastContainer
          position="bottom-center"
          autoClose={1000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='dark'
        />
      </main>
    </>
  )
}
