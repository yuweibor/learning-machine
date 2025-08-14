import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Tag, Layout, Space, Flex } from 'antd';
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  FireOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  StarTwoTone
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Header, Content } = Layout;

const LevelPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const levels = [
    {
      id: 1,
      title: '初出茅庐',
      difficulty: '入门',
      completed: true,
      description: '学习基础汉字，建立语言基础',
      icon: FireOutlined,
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
    },
    {
      id: 2,
      title: '小试牛刀',
      difficulty: '初级',
      completed: true,
      description: '掌握常用汉字，提升识字能力',
      icon: CrownOutlined,
      color: '#faad14',
      gradient: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)'
    },
    {
      id: 3,
      title: '渐进佳境',
      difficulty: '中级',
      completed: false,
      description: '学习复杂汉字，增强理解能力',
      icon: ThunderboltOutlined,
      color: '#fa8c16',
      gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)'
    },
    {
      id: 4,
      title: '成竹在胸',
      difficulty: '高级',
      completed: false,
      description: '挑战高难度汉字，达到熟练水平',
      icon: RocketOutlined,
      color: '#f5222d',
      gradient: 'linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%)'
    },
    {
      id: 5,
      title: '炉火纯青',
      difficulty: '专家',
      completed: false,
      description: '精通汉字运用，成为识字专家',
      icon: StarTwoTone,
      color: '#cf1322',
      gradient: 'linear-gradient(135deg, #cf1322 0%, #f5222d 100%)'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '入门': return 'green';
      case '初级': return 'blue';
      case '中级': return 'orange';
      case '高级': return 'magenta';
      case '专家': return 'purple';
      default: return 'default';
    }
  };



  const handleLevelClick = (level: any) => {
    // 导航到具体关卡的逻辑
    console.log('进入关卡:', level.title);
    if (level.id === 1) {
      // 初出茅庐关卡 - 打地鼠游戏
      navigate('/whack-a-mole');
    } else if (level.id === 2) {
      // 小试牛刀关卡 - 16宫格游戏
      navigate('/trial');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Header style={{ 
        height: '80px',
        background: 'transparent',
        padding: '0 20px',
        position: 'relative'
      }}>
        <Flex justify="center" align="center" style={{ height: '100%' }}>
          <div style={{ 
            position: 'absolute', 
            left: '20px'
          }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              type="text"
              size={isMobile ? "middle" : "large"}
              style={{ color: '#fff' }}
            >
              {isMobile ? "返回" : "返回主页"}
            </Button>
          </div>
          <Title level={isMobile ? 2 : 1} style={{ color: '#fff', margin: '0' }}>
            <TrophyOutlined style={{ marginRight: '12px', color: '#faad14' }} />
            关卡模式
          </Title>
        </Flex>
      </Header>

      <Content style={{ padding: '20px' }}>
        {isMobile ? (
          // 移动端布局
          <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 10 }}>
              {levels.map((level) => {
                const IconComponent = level.icon;
                return (
                  <Card
                    key={level.id}
                    hoverable
                    onClick={() => handleLevelClick(level)}
                    style={{
                      backgroundImage: level.gradient,
                      border: 'none',
                      borderRadius: '16px'
                    }}
                    styles={{
                      body: { padding: '20px', textAlign: 'center' }
                    }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Flex justify="center">
                        <div style={{
                          background: level.gradient,
                          borderRadius: '50%',
                          width: '80px',
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                        }}>
                          <IconComponent style={{ fontSize: '28px', color: '#fff' }} />
                        </div>
                      </Flex>
                      <Title level={4} style={{ color: '#fff', margin: 0 }}>
                        {level.title}
                      </Title>
                      <Tag color={getDifficultyColor(level.difficulty)} style={{ fontSize: '12px' }}>
                        {level.difficulty}
                      </Tag>
                      <Typography.Text style={{ color: '#fff', opacity: 0.9 }}>
                        {level.description}
                      </Typography.Text>
                    </Space>
                  </Card>
                );              })}          </Space>
        ) : (
          // 桌面端布局
          <Row gutter={[24, 24]} justify="center">
            {levels.map((level) => {
              const IconComponent = level.icon;
              return (
                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={level.id}>
                  <Card
                    hoverable
                    onClick={() => handleLevelClick(level)}
                    style={{
                      opacity: 1,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      transform: 'translateY(0)',
                    }}
                    bodyStyle={{ padding: '20px' }}
                    cover={
                      <div style={{
                        height: '140px',
                        background: level.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <IconComponent style={{ fontSize: '40px', color: '#fff' }} />
                      </div>
                    }
                  >
                    <Card.Meta
                      title={
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {level.title}
                          </div>
                          <Tag color={getDifficultyColor(level.difficulty)} style={{ fontSize: '12px' }}>
                            {level.difficulty}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: '12px 0', color: '#666', fontSize: '14px' }}>
                            {level.description}
                          </p>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default LevelPage;