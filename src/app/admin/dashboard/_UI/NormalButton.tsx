type NormalButtonProps = {
  children: React.ReactNode;
  bgColor: string;
  textColor: string;
  onClick?: () => void; // ✅ optional click handler
  disabled?: boolean; // ✅ add this line
};

export default function NormalButton({
  children,
  bgColor,
  textColor,
  onClick,
  disabled,
}: NormalButtonProps) {
  return (
    <div className="mx-auto w-fit">
      <button
        onClick={onClick}
        style={{
          backgroundColor: bgColor,
          color: textColor || "#FFFFFF",
        }}
        className={`px-3 py-1 rounded-2xl flex gap-2 items-center text-[9px] cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
        }`}
      >
        {children}
      </button>
    </div>
  );
}
