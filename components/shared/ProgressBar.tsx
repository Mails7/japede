import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { ProgressBar as ProgressBarType } from '../../types';

interface ProgressBarProps {
  percent: number;
  barColor?: string;
  bgColor?: string;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  barColor = 'bg-primary',
  bgColor = 'bg-gray-200',
  height = 8
}) => {
  // Garantir que o percentual esteja entre 0 e 100
  const safePercent = Math.min(Math.max(0, percent), 100);
  
  return (
    <div className={`w-full ${bgColor} rounded-full overflow-hidden`} style={{ height: `${height}px` }}>
      <div 
        className={`${barColor} transition-all duration-500 ease-in-out`} 
        style={{ width: `${safePercent}%`, height: '100%' }}
      />
    </div>
  );
};

export default ProgressBar;
