/**
 * Progressive image.
 *
 * @module
 */
import React from 'react';
import imageSprite from '@liga/frontend/assets/sprite.png';
import { cx } from '@liga/frontend/lib';

/** @interface */
interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  blur?: 'blur-xs' | 'blur-sm' | 'blur-md' | 'blur-lg' | 'blur-xl' | 'blur-2xl' | 'blur-3xl';
  sprite?: string;
}

/**
 * Exports this module.
 *
 * @param props Root props.
 * @function
 * @exports
 */
export default function (props: Props) {
  const { src, sprite, className, blur, ...rest } = props;
  const [uri, setUri] = React.useState(props.sprite || imageSprite);
  const [loading, setLoading] = React.useState(true);

  // set up the image object
  const image = React.useMemo(() => new Image(), [src]);
  const onImageLoad = React.useMemo(
    () => () => {
      setUri(src);
      setLoading(false);
    },
    [src],
  );

  // update the image src when it loads
  React.useEffect(() => {
    image.src = src;
    image.onload = onImageLoad;
  }, [image, src, sprite]);

  // render the component
  return <img {...rest} src={uri} className={cx(className, loading && (blur || 'blur-xl'))} />;
}
