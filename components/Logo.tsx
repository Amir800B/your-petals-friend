
import React from 'react';
import { LOCATION } from '../constants';

interface LogoProps {
  onClick?: () => void;
  size?: string;
  imgSize?: string;
}

export const Logo = ({ onClick }: { onClick?: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer"
    >
      <img
        src="/logo.png"
        alt="YPF Logo"
        className="h-10 w-10 object-contain"
      />

      <div>
        <h1 className="text-xl font-extrabold text-slate-800">
          Your Petals Friend
        </h1>
        <p className="text-[7px] font-bold tracking-[0.25em] text-rose-500">
          JAKARTA, INDONESIA
        </p>
      </div>
    </div>
  );
};

export default Logo;