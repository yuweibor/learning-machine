import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Steps, Typography, Row, Col, message } from 'antd';
import { ArrowLeftOutlined, BookOutlined, CheckCircleOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRandomCharacters, getSequentialCharacters, getTotalCharacterCount, Character } from '../data/characters';
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
  const [currentStartIndex, setCurrentStartIndex] = useState(0); // 当前学习起始位置
  const hasInitialized = useRef(false);
  const totalCharacters = getTotalCharacterCount();

  // 初始化学习汉字
  useEffect(() => {
    // 如果还没有汉字数据，则加载新的汉字
    if (studyCharacters.length === 0 && !hasInitialized.current) {
      const characters = getSequentialCharacters(currentStartIndex, 12);
      setStudyCharacters(characters);
      setCurrentStep(1); // 进入学习发音阶段
      message.success(`已为您准备了12个汉字（第${currentStartIndex + 1}-${currentStartIndex + 12}个），点击卡片开始学习！`);
      hasInitialized.current = true;
    }
  }, [studyCharacters.length, currentStartIndex]);

  const handleBack = () => {
    navigate('/');
  };

  const loadNewCharacters = () => {
    const newStartIndex = (currentStartIndex + 12) % totalCharacters;
    const characters = getSequentialCharacters(newStartIndex, 12);
    setStudyCharacters(characters);
    setCurrentStartIndex(newStartIndex);
    setCurrentStep(1); // 进入学习发音阶段
    message.success(`已为您更换了12个新汉字（第${newStartIndex + 1}-${newStartIndex + 12}个）！`);
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