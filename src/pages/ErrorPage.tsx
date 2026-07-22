
const ErrorPage = () => {
  return (
  <div className="flex flex-col justify-center items-center p-4 min-h-screen text-center bg-gray-900 sm:p-6 lg:p-8">
    <p className="mb-4 text-6xl font-extrabold text-indigo-500 animate-pulse sm:text-7xl md:text-8xl lg:text-9xl sm:mb-6">{"404"}</p>
    <h1 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl sm:mb-6">{"Page Not Found"}</h1>
    <p className="mx-auto mb-8 max-w-xl text-base text-gray-300 sm:text-lg md:text-xl sm:mb-10">{"Oops! The page you're looking for doesn't exist or has been moved. It might be a broken link or a typo."}</p>
    <div className="flex flex-col gap-4 sm:flex-row">
      <a className="px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-indigo-700 sm:text-xl" href="/dashboard">{"Go to Homepage"}</a>
      <a className="px-6 py-3 text-lg font-semibold text-gray-200 bg-gray-700 rounded-lg border border-gray-600 shadow-md transition-all duration-300 ease-in-out hover:bg-gray-600 sm:text-xl" href="/contact">{"Contact Support"}</a>
    </div>
  </div>
  );
};

export default ErrorPage;
