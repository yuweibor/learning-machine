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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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

  // 手机模式下的滚动自动加载
  useEffect(() => {
    if (!isMobile) return;

    let isLoading = false;

    const handleScroll = () => {
      // 防止重复加载
      if (isLoading) return;
      
      // 检查是否滚动到底部
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
      
      // 当距离底部还有100px时开始加载
      if (distanceFromBottom <= 100) {
        isLoading = true;
        setIsLoadingMore(true);
        
        // 立即加载，不需要延迟
        const hasMoreData = loadMoreCharacters(false); // 自动加载时不显示消息
        
        // 加载完成后重置状态
        setTimeout(() => {
          setIsLoadingMore(false);
          isLoading = false;
        }, hasMoreData ? 1000 : 0); // 如果没有更多数据，立即隐藏加载指示器
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

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

  const loadMoreCharacters = (showMessage: boolean = true): boolean => {
    // 检查是否已经加载了所有汉字
    if (studyCharacters.length >= totalCharacters) {
      if (showMessage) {
        message.info('已经加载了所有汉字！');
      }
      return false;
    }
    
    const nextStartIndex = studyCharacters.length;
    const remainingCount = totalCharacters - nextStartIndex;
    const loadCount = Math.min(12, remainingCount);
    
    const newCharacters = getSequentialCharacters(nextStartIndex, loadCount);
    setStudyCharacters(prev => [...prev, ...newCharacters]); // 追加到列表
    if (showMessage) {
      message.success(`已为您加载了${loadCount}个新汉字（第${nextStartIndex + 1}-${nextStartIndex + loadCount}个）！`);
    }
    return true;
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
    <Card title="学习统计" bordered={false} style={{ margin: '16px 0' }}>
      <Row gutter={[16, 24]}>
        <Col span={12}>
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>{studyStats.todayStudied}</div>
            <div style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>今日学习</div>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>{getFilteredCharacters().length}</div>
            <div style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>当前汉字</div>
          </div>
        </Col>
        <Col span={12}>
          <div 
            style={{ 
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: filterType === 'unknown' ? 'rgba(255, 77, 79, 0.1)' : 'transparent',
              transition: 'background-color 0.3s'
            }}
            onClick={() => handleStatsClick('unknown')}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ff4d4f', marginBottom: '8px' }}>{studyStats.newWords}</div>
            <div style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>生词统计</div>
          </div>
        </Col>
        <Col span={12}>
          <div 
            style={{ 
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: filterType === 'known' ? 'rgba(250, 173, 20, 0.1)' : 'transparent',
              transition: 'background-color 0.3s'
            }}
            onClick={() => handleStatsClick('known')}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#faad14', marginBottom: '8px' }}>{studyStats.masteredWords}</div>
            <div style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>熟词统计</div>
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
            
            {/* 手机模式下的加载更多指示器 */}
            {isMobile && isLoadingMore && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#fff' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '10px' 
                }}>
                  <div className="loading-spinner" style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>正在加载更多汉字...</span>
                </div>
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

          {filterType === 'all' && studyCharacters.length < totalCharacters && (
            <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 24 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadMoreCharacters(true)}
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