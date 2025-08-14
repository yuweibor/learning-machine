import React from 'react';
import WhackAMoleGame from '../components/WhackAMoleGame';

const WhackAMolePage: React.FC = () => {
  const gameConfig = {
    gridSize: 3, // 3x3 = 9宫格
    enableMask: false, // 不启用遮挡功能
    gameTitle: '打地鼠'
  };

  return <WhackAMoleGame config={gameConfig} />;
};

export default WhackAMolePage;