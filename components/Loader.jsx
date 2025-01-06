export default function Loading() {
  return (
    <div className="flex justify-center items-center bg-background/50 backdrop-blur-sm w-full h-full ">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-800 "></div>
      <span className="ml-4 text-xl font-semibold text-green-700">Loading...</span>
    </div>
  );
}
