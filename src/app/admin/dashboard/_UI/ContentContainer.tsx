
type ContentContainerProps = {
  children: React.ReactNode;
  color: string;
  title: string;
};

export default function ContentContainer({
  children,
  color,
  title,
}: ContentContainerProps) {
  return (
    <div
      style={{ backgroundColor: color }}
      className={`mb-5 mx-6 rounded-xl h-[82dvh] overflow-hidden relative`}
    >
      <section className="mx-6 px-6 py-4 text-xl font-bold  text-white"> 
        <h1>{title}</h1>
      </section>
      <section className="mx-6 px-6">{children}</section>
    </div>
  );
}
