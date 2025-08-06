import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Steps, Typography, Row, Col, message } from 'antd';
import { ArrowLeftOutlined, BookOutlined, CheckCircleOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRandomCharacters, Character } from '../data/characters';
import CharacterCard from '../components/CharacterCard';

const { Title, Paragraph } = Typography;
const { Step } = Steps;

const StudyPage: React.FC = () => {
  const navigate = useNavigate();
  const [studyCharacters, setStudyCharacters] = useState<Character[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [studyStats, setStudyStats] = useState({
    todayStudied: 0,
    masteredChars: 0,
    studyDays: 1
  });
  const hasInitialized = useRef(false);

  // 初始化学习汉字
  useEffect(() => {
    // 如果还没有汉字数据，则加载新的汉字
    if (studyCharacters.length === 0 && !hasInitialized.current) {
      const characters = getRandomCharacters(12);
      setStudyCharacters(characters);
      setCurrentStep(1); // 进入学习发音阶段
      message.success('已为您准备了12个汉字，点击卡片开始学习！');
      hasInitialized.current = true;
    }
  }, [studyCharacters.length]);

  const handleBack = () => {
    navigate('/');
  };

  const loadNewCharacters = () => {
    const characters = getRandomCharacters(12);
    setStudyCharacters(characters);
    setCurrentStep(1); // 进入学习发音阶段
    message.success('已为您更换了12个新汉字！');
  };

  const handleNewRound = () => {
    loadNewCharacters();
    setStudyStats(prev => ({
      ...prev,
      todayStudied: prev.todayStudied + 12
    }));
  };

  return (
    <div className="study-page">
      <div className="study-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          type="text"
          size="large"
        >
          返回主页
        </Button>
        <Title level={2}>学习模式</Title>
      </div>
      
      <div className="study-content">
        <Row gutter={[24, 16]}>
          <Col span={24}>
            <Card title="学习进度" bordered={false}>
              <Steps current={currentStep} size="small">
                <Step title="选择汉字" description="从字库中选择要学习的汉字" icon={<BookOutlined />} />
                <Step title="学习发音" description="学习汉字的正确发音" icon={<PlayCircleOutlined />} />
                <Step title="记忆测试" description="测试汉字记忆效果" icon={<CheckCircleOutlined />} />
              </Steps>
            </Card>
          </Col>
          
          {studyCharacters.length > 0 && (
            <Col span={24}>
              <Card 
                title="汉字学习卡片" 
                bordered={false}
                extra={
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleNewRound}
                    type="primary"
                  >
                    换一批
                  </Button>
                }
              >
                <Paragraph style={{ marginBottom: '20px', textAlign: 'center' }}>
                  点击卡片查看图片和听取发音，再次点击翻回正面并重复播放发音
                </Paragraph>
                <div className="character-cards-container">
                  {studyCharacters.map((character) => (
                    <CharacterCard 
                      key={character.id} 
                      character={character} 
                    />
                  ))}
                </div>
              </Card>
            </Col>
          )}
          
          <Col span={24}>
            <Card title="学习说明" bordered={false}>
              <Paragraph>
                欢迎来到汉字学习模式！学习方式：
              </Paragraph>
              <ul>
                <li><strong>第一次点击卡片</strong>：翻转到背面，显示相关图片并播放发音</li>
                <li><strong>再次点击卡片</strong>：翻转回正面并重复播放发音</li>
                <li><strong>图片加载</strong>：根据汉字含义自动加载相关图片</li>
                <li><strong>语音播放</strong>：自动播放标准汉字发音</li>
                <li><strong>换一批</strong>：随机选择新的12个汉字进行学习</li>
              </ul>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="学习统计" bordered={false}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1890ff' }}>{studyStats.todayStudied}</div>
                    <div>今日学习</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#52c41a' }}>{studyCharacters.length}</div>
                    <div>当前汉字</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#faad14' }}>{studyStats.studyDays}</div>
                    <div>学习天数</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default StudyPage;