// Este arquivo é o app/(logged)/layout.tsx
import Header from '@/components/Header/Header';
// import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './LoggedLayout.module.css'; // <-- Este import agora vai funcionar

export default function LoggedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.appContainer}>
      {/* <Sidebar /> */}
      <Header /> {/* <-- O HEADER VAI AQUI */}
      <main className={styles.mainContent}>
        {children} {/* <-- O 'children' será o app/(logged)/home/page.tsx */}
      </main>
    </div>
  );
}