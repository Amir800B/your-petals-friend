
import React from 'react';
import { LOCATION } from '../constants';

interface LogoProps {
  onClick?: () => void;
  size?: string;
  imgSize?: string;
}

export const Logo: React.FC<LogoProps> = ({ onClick, size = "h-14 w-14", imgSize = "h-10 w-10" }) => (
  <div className="flex items-center gap-4 group cursor-pointer" onClick={onClick}>
    <div className="relative">
      <div className={`${size} bg-white rounded-[20px] rotate-[-8deg] flex items-center justify-center shadow-lg transition-all duration-500 group-hover:rotate-0 overflow-hidden border border-gray-100`}>
        <img 
          src="./logo.jpg" 
          alt="YPF Logo" 
          className={`${imgSize} object-contain rotate-[8deg] group-hover:rotate-0 transition-transform duration-500`} 
        />
      </div>
      <span className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-full border-[3px] border-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center">
        <i className="fa-solid fa-leaf text-[8px] text-[#ff4d6d]"></i>
      </span>
    </div>
    <div className="flex flex-col text-left">
      <h1 className="text-2xl font-extrabold text-[#1e293b] leading-none tracking-tight">Your Petals Friend</h1>
      <p className="text-[10px] font-bold text-rose-500 tracking-[0.25em] uppercase mt-1">{LOCATION}</p>
    </div>
  </div>
);
