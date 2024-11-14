import * as React from "react";

const MovementsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={25} height={24} fill="currentColor" {...props}>
    <g fill="currentColor">
      <path d="M20.5 12a8 8 0 0 0-8-8 7.846 7.846 0 0 0-6.182 2.993l1.68-.005a1 1 0 1 1 .005 2l-3.443.01a.996.996 0 0 1-.116 0L4.003 9A1 1 0 0 1 3 8V4a1 1 0 1 1 2 0v1.45A9.83 9.83 0 0 1 12.5 2c5.523 0 10 4.477 10 10s-4.477 10-10 10c-3.936 0-7.264-2.272-8.896-5.555a1 1 0 1 1 1.792-.89C6.71 18.199 9.369 20 12.5 20a8 8 0 0 0 8-8Z" />
      <path
        fillRule="evenodd"
        d="M12.5 7a1 1 0 0 1 1 1v3.586l1.707 1.707a1 1 0 0 1-1.414 1.414L12.086 13a2 2 0 0 1-.586-1.414V8a1 1 0 0 1 1-1Z"
        clipRule="evenodd"
      />
    </g>
  </svg>
);

export default MovementsIcon;
