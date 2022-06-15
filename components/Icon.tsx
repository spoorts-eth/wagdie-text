import styles from '../styles/Icon.module.css'

const Icon = ({ children }: React.PropsWithChildren) => {
  return <span className={styles.icon}>{children}</span>
}

export default Icon
