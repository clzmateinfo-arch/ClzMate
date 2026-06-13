
const Loading = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-4 min-h-[200px]">
      <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-violet-500 border-r-fuchsia-500 animate-spin"></div>
      <p className="text-sm font-medium bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent animate-pulse">
        Loading
      </p>
    </div>
  );
};

export default Loading;
