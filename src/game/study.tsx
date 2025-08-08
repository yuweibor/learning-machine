import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Steps, Typography, Row, Col, message, Drawer } from 'antd';
import { ArrowLeftOutlined, BookOutlined, CheckCircleOutlined, PlayCircleOutlined, ReloadOutlined, MenuOutlined, BarChartOutlined } from '@ant-design/icons';
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasInitialized = useRef(false);
  const totalCharacters = getTotalCharacterCount();

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化学习汉字
  useEffect(() => {
    // 如果还没有汉字数据，则加载新的汉字
    if (studyCharacters.length === 0) {
      if (!hasInitialized.current) {
        const characters = getSequentialCharacters(currentStartIndex, 12);
        setStudyCharacters(characters);
        setCurrentStep(1); // 进入学习发音阶段
        message.success(`已为您准备了12个汉字（第${currentStartIndex + 1}-${currentStartIndex + 12}个），点击卡片开始学习！`);
        hasInitialized.current = true;
      }
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

  const renderStatsCard = () => (
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
  );

  return (
    <div className="study-page">
      <div className="study-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          type="text"
          size={isMobile ? "middle" : "large"}
        >
          {isMobile ? "返回" : "返回主页"}
        </Button>
        <Title level={2}>学习模式</Title>
        {isMobile && (
          <Button
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            type="text"
            size="middle"
          >
            菜单
          </Button>
        )}
      </div>

      <div className="study-content">
        {isMobile ? (
          // 移动端布局
          <>
            {studyCharacters.length > 0 && (
              <div className="character-cards-section">
                <Row gutter={[12, 12]}>
                  {studyCharacters.map((character) => (
                    <Col
                      key={character.id}
                      xs={24}
                      sm={12}
                      md={8}
                      lg={6}
                      xl={4}
                      xxl={3}
                    >
                      <CharacterCard character={character} />
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            <Drawer
              title="学习工具"
              placement="right"
              onClose={() => setDrawerVisible(false)}
              open={drawerVisible}
              className="mobile-drawer"
              width={320}
            >
              <div className="drawer-content">
                <div style={{ marginBottom: 16 }}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      handleNewRound();
                      setDrawerVisible(false);
                    }}
                    type="primary"
                    block
                    size="large"
                  >
                    换一批汉字
                  </Button>
                </div>
                {renderStatsCard()}
              </div>
            </Drawer>
          </>
        ) : (
          // 桌面端布局
          <>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#fff' }}>汉字学习卡片</h2>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleNewRound}
                type="primary"
                size="large"
              >
                换一批
              </Button>
            </div>

            {studyCharacters.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {studyCharacters.map((character) => (
                  <Col
                    key={character.id}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    xl={4}
                    xxl={3}
                  >
                    <CharacterCard character={character} />
                  </Col>
                ))}
              </Row>
            )}

            <div className="other-content">
              {renderStatsCard()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudyPage;