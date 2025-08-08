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
    // 检测页面刷新并处理重定向
    const handlePageRefresh = () => {
      const currentUrl = window.location.href;
      const currentPath = window.location.pathname;
      
      // 如果URL以localhost开头，不进行重定向
      if (currentUrl.startsWith('http://localhost') || currentUrl.startsWith('https://localhost')) {
        return;
      }
      
      // 检查是否是页面刷新（通过performance API）
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const isPageRefresh = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';
      
      // 如果是页面刷新且不在首页，则重定向到首页
      if (isPageRefresh && currentPath !== '/') {
        console.log('检测到页面刷新，重定向到首页');
        navigate('/', { replace: true });
      }
    };
    
    // 页面加载时执行检查
    handlePageRefresh();
    
    // 监听页面刷新事件
    window.addEventListener('beforeunload', () => {
      // 在页面卸载前标记即将刷新
      sessionStorage.setItem('isRefreshing', 'true');
    });
    
    // 检查是否从刷新恢复
    if (sessionStorage.getItem('isRefreshing') === 'true') {
      sessionStorage.removeItem('isRefreshing');
      const currentUrl = window.location.href;
      const currentPath = window.location.pathname;
      
      // 如果不是localhost且不在首页，重定向到首页
      if (!currentUrl.startsWith('http://localhost') && !currentUrl.startsWith('https://localhost') && currentPath !== '/') {
        console.log('从页面刷新恢复，重定向到首页');
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div className="game-container">
     <div>
      {/* 横纵比超过1就横着显示三个卡片否则竖着显示三个卡片 */}
      <div className="game-card-container">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
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
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
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
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
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