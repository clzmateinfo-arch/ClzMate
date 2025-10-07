import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <section className="p-[40px] bg-white pt-[100px] ">
      <div>
        <div>
          <div>
            <div className="text-center">
              <div className="h-screen bg-center bg-cover bg-[url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')] flex items-center justify-center">
                <h1 className="text-6xl font-extrabold text-black bg-white/70 px-6 py-3 rounded-2xl">
                  404
                </h1>
              </div>
              <div className="-mt-12 ">
                <h3 className="text-4xl mb-1 ">Look like you are lost</h3>

                <p>The page you are looking for not available!</p>

                <Link
                  to="/"
                  className=" py-[13px] px-10 text-lg bg-caribbeangreen-200 hover:bg-caribbeangreen-400 my-5 inline-block rounded-full font-semibold duration-300"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageNotFound;
