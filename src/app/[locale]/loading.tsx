export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-[9999]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#214E78] border-t-transparent" />
    </div>
  );
}
