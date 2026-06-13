 
import "react-lazy-load-image-component/src/effects/blur.css";
import { LazyLoadImage } from "react-lazy-load-image-component";

const Img = ({ src, className, alt }) => {
  return (
    <LazyLoadImage
      className={`${className} `}
      alt={alt || "Image"}
      effect="blur"
      src={src}
    />
  );
};

export default Img;
