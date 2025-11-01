type NavButtonProps = {
  children: React.ReactNode;
};

export default function NavButton({ children }: NavButtonProps) {
  return (
    <button className="text-white text-[1rem] bg-[#214E78] w-full rounded-4xl py-1 cursor-pointer shadow-2xl font-medium ">
      {children}
    </button>
  );
}
