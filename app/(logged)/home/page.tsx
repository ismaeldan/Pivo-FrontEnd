import BoardArea from '@/components/BoardArea/BoardArea';
export default function HomePage() {
  return (
    <>
      {/* O Header já está no layout (app/(logged)/layout.tsx), 
        então só precisamos renderizar o Board aqui.
      */}
      <BoardArea />
    </>
  );
}