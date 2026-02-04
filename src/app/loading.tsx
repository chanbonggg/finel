export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      <p className="text-gray-500 font-medium text-lg">잠시만 기다려주세요...</p>
    </div>
  );
}