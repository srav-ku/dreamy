import React from "react";

interface AdBannerProps {
  id: string;
  width: number;
  height: number;
  className?: string;
}

export const AdBanner = ({ id, width, height, className = "" }: AdBannerProps) => {
  // We use srcDoc iframe to completely isolate document.write from destroying the React app
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }</style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${id}',
            'format' : 'iframe',
            'height' : ${height},
            'width' : ${width},
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://archaicmsflip.com/${id}/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className={`flex justify-center overflow-hidden ${className}`}>
      <iframe
        srcDoc={html}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        style={{ border: 'none', overflow: 'hidden', width: `${width}px`, height: `${height}px` }}
        title={`ad-${id}`}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      />
    </div>
  );
};

export const NativeBanner = ({ id, className = "" }: { id: string; className?: string }) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body { margin: 0; padding: 0; background: transparent; }</style>
      </head>
      <body>
        <div id="container-${id}"></div>
        <script async="async" data-cfasync="false" src="https://archaicmsflip.com/${id}/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className={`flex justify-center w-full ${className}`}>
      <iframe
        srcDoc={html}
        width="100%"
        height="350"
        frameBorder="0"
        scrolling="no"
        style={{ border: 'none', overflow: 'hidden' }}
        title="Native Banner"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      />
    </div>
  );
};
