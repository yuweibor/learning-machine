import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Steps, Typography, Row, Col, message, Drawer, Layout, Space, Flex } from 'antd';
import { ArrowLeftOutlined, BookOutlined, CheckCircleOutlined, PlayCircleOutlined, ReloadOutlined, MenuOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { throttle } from 'lodash';
import { getRandomCharacters, getSequentialCharacters, getTotalCharacterCount, Character } from '../data/characters';
import CharacterCard from '../components/CharacterCard';

const { Title, Paragraph } = Typography;
const { Step } = Steps;
const { Header, Content } = Layout;

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
  const [nextLoadIndex, setNextLoadIndex] = useState(0); // 下一次加载的起始位置
  const [filterType, setFilterType] = useState<'all' | 'known' | 'unknown'>('all'); // 筛选类型
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true); // 添加状态来跟踪是否还有更多数据
  const hasInitialized = useRef(false);
  const isLoadingMoreRef = useRef(false); // 用于滚动事件中获取最新的加载状态
  const hasMoreDataRef = useRef(true); // 用于滚动事件中获取最新的数据状态
  const nextLoadIndexRef = useRef(0); // 用于获取最新的nextLoadIndex值
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

  // 同步ref值与state值
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    hasMoreDataRef.current = hasMoreData;
  }, [hasMoreData]);

  useEffect(() => {
    nextLoadIndexRef.current = nextLoadIndex;
  }, [nextLoadIndex]);

  /**
   * 移动端滚动自动加载功能
   * 当用户滚动到页面底部附近时自动触发加载
   */
  useEffect(() => {
    // 只在移动端启用滚动加载
    if (!isMobile) {
      return;
    }

    // 使用节流优化滚动事件性能
    const handleScroll = throttle(() => {
      // 使用ref获取最新状态，避免闭包问题
      if (isLoadingMoreRef.current || !hasMoreDataRef.current) {
        return;
      }
      
      // 获取滚动相关的尺寸信息
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 计算距离页面底部的距离
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
      
      // 当距离底部100px时触发加载（提前加载提升用户体验）
      if (distanceFromBottom < 100) {
        // 调用统一的加载方法，不显示消息提示
        loadMoreCharacters(false, 'scroll').then(hasMore => {
          // 根据返回结果更新是否还有更多数据的状态
          setHasMoreData(hasMore);
        });
      }
    }, 200); // 200ms节流间隔

    // 添加滚动事件监听器
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 清理函数：组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]); // 只依赖isMobile，避免重复绑定事件监听器

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

  /**
   * 初始化学习汉字
   * 只在组件首次加载且没有汉字数据时执行
   */
  useEffect(() => {
    // 如果还没有汉字数据，则加载新的汉字
    if (studyCharacters.length === 0) {
      if (!hasInitialized.current) {
        const characters = getSequentialCharacters(nextLoadIndex, 12);
        setStudyCharacters(characters);
        setNextLoadIndex(nextLoadIndex + characters.length); // 更新下一次加载的索引
        setCurrentStep(1); // 进入学习发音阶段
        message.success(`已为您准备了12个汉字（第${nextLoadIndex + 1}-${nextLoadIndex + characters.length}个），点击卡片开始学习！`);
        // 检查是否还有更多数据
        setHasMoreData(nextLoadIndex + characters.length < totalCharacters);
        hasInitialized.current = true;
      }
    }
  }, [studyCharacters.length, totalCharacters]); // 移除nextLoadIndex依赖，避免循环触发

  const handleBack = () => {
    navigate('/');
  };

  /**
   * 统一的加载更多汉字方法
   * 适用于移动端滚动加载和PC端按钮加载
   * @param showMessage 是否显示加载成功的消息提示
   * @param triggerSource 触发来源：'scroll' | 'button'
   * @returns Promise<boolean> 返回是否还有更多数据可加载
   */
  const loadMoreCharacters = async (showMessage: boolean = false, triggerSource: 'scroll' | 'button' = 'scroll'): Promise<boolean> => {
    // 防止重复加载
    if (isLoadingMore) {
      return false;
    }
    
    // 检查是否还有更多数据
    if (!hasMoreData) {
      if (showMessage) {
        message.info('已经加载了所有汉字！');
      }
      return false;
    }
    
    setIsLoadingMore(true);
    
    try {
      // 使用ref获取最新的nextLoadIndex值
      const currentNextLoadIndex = nextLoadIndexRef.current;
      
      // 检查是否已经加载了所有汉字
      if (currentNextLoadIndex >= totalCharacters) {
        if (showMessage) {
          message.info('已经加载了所有汉字！');
        }
        setHasMoreData(false);
        return false;
      }
      
      // 计算本次需要加载的汉字数量（每次最多12个）
      const remainingCharacters = totalCharacters - currentNextLoadIndex;
      const loadCount = Math.min(12, remainingCharacters);
      
      // 保存当前起始索引用于消息显示
      const currentStartIndex = currentNextLoadIndex;
      
      // 从数据源获取新的汉字
      const newCharacters = getSequentialCharacters(currentNextLoadIndex, loadCount);
      
      // 更新学习汉字列表（追加到现有列表）
      setStudyCharacters(prev => [...prev, ...newCharacters]);
      
      // 更新下一次加载的起始索引
      const newNextLoadIndex = currentNextLoadIndex + loadCount;
      setNextLoadIndex(newNextLoadIndex);
      
      // 检查是否还有更多数据可加载
      const stillHasMore = newNextLoadIndex < totalCharacters;
      setHasMoreData(stillHasMore);
      
      // 显示加载成功消息（仅在按钮触发时显示）
      if (showMessage) {
        message.success(`已加载第${currentStartIndex + 1}-${currentStartIndex + loadCount}个汉字`);
      }
      
      return stillHasMore;
    } catch (error) {
      console.error('加载汉字时出错:', error);
      message.error('加载汉字失败，请重试');
      return false;
    } finally {
      setIsLoadingMore(false);
    }
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
    <Card title="学习统计" variant="borderless" style={{ margin: '16px 0' }}>
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
          {isMobile && (
            <div style={{ 
              position: 'absolute', 
              right: '20px'
            }}>
              <Button
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
                type="text"
                size="middle"
                style={{ color: '#fff' }}
              >
                菜单
              </Button>
            </div>
          )}
          <Title level={isMobile ? 2 : 1} style={{ color: '#fff', margin: '0' }}>
            <BookOutlined style={{ marginRight: '12px', color: '#52c41a' }} />
            学习模式
          </Title>
        </Flex>
      </Header>

      <Content style={{ padding: '20px' }}>
        {isMobile ? (
          // 移动端布局
          <>
            {getFilteredCharacters().length > 0 && (
              <div className="character-cards-section">
                <Row gutter={[12, 12]}>
                  {getFilteredCharacters().map((character, index) => (
                    <Col
                      key={`mobile-${index}-${character.id}`}
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
                {getFilteredCharacters().map((character, index) => (
                <Col
                  key={`desktop-${index}-${character.id}`}
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

          {filterType === 'all' && hasMoreData && (
            <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 24 }}>
              <Button
                icon={<ReloadOutlined />}
                loading={isLoadingMore}
                onClick={() => {
                  // 调用统一的加载方法，显示成功消息
                  loadMoreCharacters(true, 'button').then(hasMore => {
                    // 根据返回结果更新是否还有更多数据的状态
                    setHasMoreData(hasMore);
                  });
                }}
                type="primary"
                size="large"
              >
                {isLoadingMore ? '加载中...' : '加载更多汉字'}
              </Button>
            </div>
          )}

          <div className="other-content" style={{ marginTop: 32 }}>
            {renderStatsCard()}
          </div>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default StudyPage;