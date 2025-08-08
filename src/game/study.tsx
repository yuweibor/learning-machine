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
    newWords: 0,
    masteredWords: 0
  });
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
  const [unknownWords, setUnknownWords] = useState<Set<string>>(new Set());
  const [currentStartIndex, setCurrentStartIndex] = useState(0); // 当前学习起始位置
  const [filterType, setFilterType] = useState<'all' | 'known' | 'unknown'>('all'); // 筛选类型
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

  // 从localStorage加载数据
  useEffect(() => {
    const savedKnownWords = localStorage.getItem('knownWords');
    const savedUnknownWords = localStorage.getItem('unknownWords');
    
    if (savedKnownWords) {
      const knownSet = new Set(JSON.parse(savedKnownWords) as string[]);
      setKnownWords(knownSet);
      setStudyStats(prev => ({ ...prev, masteredWords: knownSet.size }));
    }
    
    if (savedUnknownWords) {
      const unknownSet = new Set(JSON.parse(savedUnknownWords) as string[]);
      setUnknownWords(unknownSet);
      setStudyStats(prev => ({ ...prev, newWords: unknownSet.size }));
    }
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

  const loadMoreCharacters = () => {
    const newStartIndex = (currentStartIndex + 12) % totalCharacters;
    const newCharacters = getSequentialCharacters(newStartIndex, 12);
    setStudyCharacters(prev => [...prev, ...newCharacters]);
    setCurrentStartIndex(newStartIndex);
    message.success(`已为您加载了12个新汉字（第${newStartIndex + 1}-${newStartIndex + 12}个）！`);
  };

  const handleCardFlip = (characterId: string) => {
    if (!flippedCards.has(characterId)) {
      setFlippedCards(prev => new Set(Array.from(prev).concat(characterId)));
      setStudyStats(prev => ({
        ...prev,
        todayStudied: prev.todayStudied + 1
      }));
    }
  };

  // 处理标记汉字为已知/未知
  const handleMarkKnown = (characterId: string, known: boolean) => {
    if (known) {
      // 标记为已知（熟词）
      const newKnownWords = new Set(knownWords);
      newKnownWords.add(characterId);
      setKnownWords(newKnownWords);
      localStorage.setItem('knownWords', JSON.stringify(Array.from(newKnownWords)));
      
      // 从生词本中移除
      const newUnknownWords = new Set(unknownWords);
      newUnknownWords.delete(characterId);
      setUnknownWords(newUnknownWords);
      localStorage.setItem('unknownWords', JSON.stringify(Array.from(newUnknownWords)));
      
      setStudyStats(prev => ({
        ...prev,
        masteredWords: newKnownWords.size,
        newWords: newUnknownWords.size
      }));
      
      message.success('已添加到熟词本！');
    } else {
      // 标记为未知（生词）
      const newUnknownWords = new Set(unknownWords);
      newUnknownWords.add(characterId);
      setUnknownWords(newUnknownWords);
      localStorage.setItem('unknownWords', JSON.stringify(Array.from(newUnknownWords)));
      
      // 从熟词本中移除
      const newKnownWords = new Set(knownWords);
      newKnownWords.delete(characterId);
      setKnownWords(newKnownWords);
      localStorage.setItem('knownWords', JSON.stringify(Array.from(newKnownWords)));
      
      setStudyStats(prev => ({
        ...prev,
        masteredWords: newKnownWords.size,
        newWords: newUnknownWords.size
      }));
      
      message.success('已添加到生词本！');
    }
  };

  // 处理移除汉字
  const handleRemove = (characterId: string) => {
    // 从熟词本中移除
    const newKnownWords = new Set(knownWords);
    newKnownWords.delete(characterId);
    setKnownWords(newKnownWords);
    localStorage.setItem('knownWords', JSON.stringify(Array.from(newKnownWords)));
    
    // 从生词本中移除
    const newUnknownWords = new Set(unknownWords);
    newUnknownWords.delete(characterId);
    setUnknownWords(newUnknownWords);
    localStorage.setItem('unknownWords', JSON.stringify(Array.from(newUnknownWords)));
    
    // 更新统计
    setStudyStats(prev => ({
      ...prev,
      masteredWords: newKnownWords.size,
      newWords: newUnknownWords.size
    }));
    
    message.success('已移除该汉字的学习状态！');
   };

  // 获取汉字的已知状态
  const getKnownStatus = (characterId: string): 'known' | 'unknown' | null => {
    if (knownWords.has(characterId)) return 'known';
    if (unknownWords.has(characterId)) return 'unknown';
    return null;
  };

  // 根据筛选类型获取显示的汉字列表
  const getFilteredCharacters = () => {
    if (filterType === 'known') {
      return studyCharacters.filter(char => knownWords.has(char.id.toString()));
    } else if (filterType === 'unknown') {
      return studyCharacters.filter(char => unknownWords.has(char.id.toString()));
    }
    return studyCharacters;
  };

  // 处理统计卡片点击
  const handleStatsClick = (type: 'known' | 'unknown') => {
    if (filterType === type) {
      setFilterType('all'); // 如果当前已是该类型，则切换回全部
    } else {
      setFilterType(type); // 否则切换到该类型
    }
  };

  const renderStatsCard = () => (
    <Card title="学习统计" bordered={false}>
      <Row gutter={16}>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1890ff' }}>{studyStats.todayStudied}</div>
            <div>今日学习</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#52c41a' }}>{getFilteredCharacters().length}</div>
            <div>当前汉字</div>
          </div>
        </Col>
        <Col span={6}>
          <div 
            style={{ 
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: filterType === 'unknown' ? 'rgba(255, 77, 79, 0.1)' : 'transparent',
              transition: 'background-color 0.3s'
            }}
            onClick={() => handleStatsClick('unknown')}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff4d4f' }}>{studyStats.newWords}</div>
            <div>生词统计</div>
          </div>
        </Col>
        <Col span={6}>
          <div 
            style={{ 
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: filterType === 'known' ? 'rgba(250, 173, 20, 0.1)' : 'transparent',
              transition: 'background-color 0.3s'
            }}
            onClick={() => handleStatsClick('known')}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#faad14' }}>{studyStats.masteredWords}</div>
            <div>熟词统计</div>
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
            {getFilteredCharacters().length > 0 && (
              <div className="character-cards-section">
                <Row gutter={[12, 12]}>
                  {getFilteredCharacters().map((character) => (
                    <Col
                      key={character.id}
                      xs={24}
                      sm={12}
                      md={8}
                      lg={6}
                      xl={6}
                      xxl={6}
                    >
                      <CharacterCard 
                         character={character} 
                         onFlip={() => handleCardFlip(character.id.toString())}
                         onMarkKnown={handleMarkKnown}
                         onRemove={handleRemove}
                         knownStatus={getKnownStatus(character.id.toString())}
                       />
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
                <div style={{ marginTop: 24, marginBottom: 16 }}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      loadMoreCharacters();
                      setDrawerVisible(false);
                    }}
                    type="primary"
                    size="large"
                    block
                  >
                    加载更多汉字
                  </Button>
                </div>
                {renderStatsCard()}
              </div>
            </Drawer>
          </>
        ) : (
          // 桌面端布局
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: '#fff' }}>汉字学习卡片</h2>
            </div>
            
            {getFilteredCharacters().length > 0 && (
            <div className="character-cards-section">
              <Row gutter={[24, 24]}>
                {getFilteredCharacters().map((character) => (
                <Col
                  key={character.id}
                  xs={24}
                  sm={12}
                  md={8}
                  lg={6}
                  xl={6}
                  xxl={6}
                >
                  <CharacterCard 
                     character={character} 
                     onFlip={() => handleCardFlip(character.id.toString())}
                     onMarkKnown={handleMarkKnown}
                     onRemove={handleRemove}
                     knownStatus={getKnownStatus(character.id.toString())}
                   />
                </Col>
                ))}
              </Row>
            </div>
          )}

          {filterType === 'all' && (
            <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 24 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadMoreCharacters}
                type="primary"
                size="large"
              >
                加载更多汉字
              </Button>
            </div>
          )}

          <div className="other-content" style={{ marginTop: 32 }}>
            {renderStatsCard()}
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudyPage;