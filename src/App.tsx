import React, { useEffect, useRef } from 'react';
import { Card, Col, Row, Button } from 'antd';
import { BookOutlined, TrophyOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './styles.scss';

const App: React.FC = () => {
  const navigate = useNavigate();

  const handleStudyClick = () => {
    navigate('/game/study');
  };

  const handleLevelClick = () => {
    navigate('/game/level');
  };

  const handleInteractiveClick = () => {
    // 暂时显示提示，后续可以添加互动模式页面
    alert('互动模式即将上线，敬请期待！');
  };

  useEffect(() => {
  
  }, []);

  return (
    <div className="game-container">
     <div>
      {/* 横纵比超过1就横着显示三个卡片否则竖着显示三个卡片 */}
      <div className="game-card-container">
        <Row gutter={16} >
          <Col span={8}>
            <Card 
               title="学习模式" 
               bordered={false}
               className="game-mode-card learning"
               actions={[
                 <Button type="primary" icon={<BookOutlined />} onClick={handleStudyClick}>开始学习</Button>
               ]}
             >
              <BookOutlined className="game-mode-icon" />
              <p className="game-mode-description">通过基础教程和练习来学习游戏规则和技巧</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
               title="关卡模式" 
               bordered={false}
               className="game-mode-card challenge"
               actions={[
                 <Button type="primary" icon={<TrophyOutlined />} onClick={handleLevelClick}>挑战关卡</Button>
               ]}
             >
              <TrophyOutlined className="game-mode-icon" />
              <p className="game-mode-description">挑战不同难度的关卡，提升你的游戏水平</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
               title="互动模式" 
               bordered={false}
               className="game-mode-card interactive"
               actions={[
                 <Button type="primary" icon={<TeamOutlined />} onClick={handleInteractiveClick}>开始互动</Button>
               ]}
             >
              <TeamOutlined className="game-mode-icon" />
              <p className="game-mode-description">与其他玩家进行实时对战和互动游戏</p>
            </Card>
          </Col>
        </Row>
      </div>
     </div>
    </div>
  );
};

export default App;