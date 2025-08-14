import React from 'react';
import WhackAMoleGame from '../components/WhackAMoleGame';

const TrialPage: React.FC = () => {
  const gameConfig = {
    gridSize: 4, // 4x4 = 16宫格
    enableMask: true, // 启用遮挡功能
    gameTitle: '小试牛刀'
  };

  return <WhackAMoleGame config={gameConfig} />;
};

export default TrialPage;