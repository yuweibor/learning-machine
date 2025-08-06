import React from 'react';
import { Card, Button, Progress, Typography, Row, Col, Tag } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined, StarOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const LevelPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const levels = [
    {
      id: 1,
      title: '新手村',
      difficulty: '简单',
      stars: 3,
      completed: true,
      locked: false,
      description: '适合初学者的简单关卡'
    },
    {
      id: 2,
      title: '森林试炼',
      difficulty: '普通',
      stars: 2,
      completed: true,
      locked: false,
      description: '需要一定策略的中等难度关卡'
    },
    {
      id: 3,
      title: '山峰挑战',
      difficulty: '困难',
      stars: 0,
      completed: false,
      locked: false,
      description: '考验高级技巧的困难关卡'
    },
    {
      id: 4,
      title: '终极试炼',
      difficulty: '专家',
      stars: 0,
      completed: false,
      locked: true,
      description: '只有真正的高手才能通过'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '简单': return 'green';
      case '普通': return 'blue';
      case '困难': return 'orange';
      case '专家': return 'red';
      default: return 'default';
    }
  };

  const renderStars = (stars: number) => {
    return Array.from({ length: 3 }, (_, index) => (
      <StarOutlined 
        key={index}
        style={{ 
          color: index < stars ? '#faad14' : '#d9d9d9',
          fontSize: '16px',
          marginRight: '4px'
        }} 
      />
    ));
  };

  return (
    <div className="level-page">
      <div className="level-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          type="text"
          size="large"
        >
          返回主页
        </Button>
        <Title level={2} style={{ textAlign: 'center', margin: '20px 0' }}>
          <TrophyOutlined style={{ marginRight: '8px', color: '#faad14' }} />
          关卡模式
        </Title>
      </div>

      <div className="level-content">
        <Card title="游戏进度" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span>总体进度：</span>
            <Progress percent={50} status="active" style={{ marginLeft: '16px' }} />
          </div>
          <div>
            <span>已获得星星：</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14', marginLeft: '8px' }}>
              5/12 ⭐
            </span>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          {levels.map((level) => (
            <Col xs={24} sm={12} md={8} lg={6} key={level.id}>
              <Card
                hoverable={!level.locked}
                style={{ 
                  opacity: level.locked ? 0.6 : 1,
                  position: 'relative'
                }}
                cover={
                  <div style={{ 
                    height: '120px', 
                    background: `linear-gradient(135deg, ${getDifficultyColor(level.difficulty)} 0%, #f0f0f0 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {level.locked ? (
                      <LockOutlined style={{ fontSize: '32px', color: '#999' }} />
                    ) : (
                      <TrophyOutlined style={{ fontSize: '32px', color: '#fff' }} />
                    )}
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      {renderStars(level.stars)}
                    </div>
                  </div>
                }
                actions={[
                  level.locked ? (
                    <Button disabled>🔒 已锁定</Button>
                  ) : level.completed ? (
                    <Button type="default">重新挑战</Button>
                  ) : (
                    <Button type="primary">开始挑战</Button>
                  )
                ]}
              >
                <Card.Meta
                  title={
                    <div>
                      {level.title}
                      <Tag color={getDifficultyColor(level.difficulty)} style={{ marginLeft: '8px' }}>
                        {level.difficulty}
                      </Tag>
                    </div>
                  }
                  description={level.description}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default LevelPage;