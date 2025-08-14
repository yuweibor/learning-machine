import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Typography, Layout, Space, Row, Col } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Character, chineseCharacters } from '../data/characters';
import { playRandomVoicePrompt, getMp3, preloadVoicePrompts, preloadCharacterAudios, playCharacterAudio, isAudioCached } from '../services';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

interface GameConfig {
  gridSize: number; // 网格边长，如3表示3x3=9宫格，4表示4x4=16宫格
  enableMask: boolean; // 是否启用遮挡功能
  gameTitle: string; // 游戏标题
}

interface GameState {
  targetCharacters: Character[];
  currentTarget: Character | null;
  gridCards: (Character | null)[];
  flippedIndex: number | null;
  lastFlippedIndex: number | null;
  score: number;
  gameStatus: 'waiting' | 'playing' | 'finished' | 'loading';
  correctCount: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  loadingProgress: number;
  loadingText: string;
  totalTargets: number;
  maskVisible: boolean;
}

interface WhackAMoleGameProps {
  config: GameConfig;
}

const WhackAMoleGame: React.FC<WhackAMoleGameProps> = ({ config }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const totalGridCells = config.gridSize * config.gridSize;
  
  const [gameState, setGameState] = useState<GameState>({
    targetCharacters: [],
    currentTarget: null,
    gridCards: Array(totalGridCells).fill(null),
    flippedIndex: null,
    lastFlippedIndex: null,
    score: 0,
    gameStatus: 'loading',
    correctCount: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    loadingProgress: 0,
    loadingText: '',
    totalTargets: 10,
    maskVisible: config.enableMask
  });
  
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [shakeWindow, setShakeWindow] = useState(false);
  const [animatingCard, setAnimatingCard] = useState<number | null>(null);
  const flipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 清理所有定时器
  const clearAllTimers = useCallback(() => {
    if (flipTimerRef.current) {
      clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }
    if (gameTimerRef.current) {
      clearTimeout(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  }, []);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // 预加载音频
  const preloadAudios = useCallback(async (targetChars: Character[]) => {
    const characters = targetChars.map(char => char.character);
    
    if (isAudioCached(characters)) {
      console.log('音效已缓存，跳过加载过程');
      return;
    }
    
    setGameState(prev => ({ ...prev, gameStatus: 'loading', loadingProgress: 0, loadingText: '正在加载音效...' }));
    
    const voiceResult = await preloadVoicePrompts();
    setGameState(prev => ({ ...prev, loadingProgress: 30, loadingText: `音效加载: ${voiceResult.successCount}/${voiceResult.totalCount}` }));
    
    const characterResult = await preloadCharacterAudios(characters);
    setGameState(prev => ({ ...prev, loadingProgress: 80, loadingText: `汉字读音加载: ${characterResult.successCount}/${characterResult.totalCount}` }));
    
    setGameState(prev => ({ ...prev, loadingProgress: 100, loadingText: '加载完成！' }));
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  // 初始化游戏
  const initializeGame = useCallback(async () => {
    clearAllTimers();
    
    const unknownWords = JSON.parse(localStorage.getItem('unknownWords') || '[]');
    
    let targetChars: Character[] = [];
    const targetCount = 10;
    
    if (unknownWords.length > 0) {
      const unknownCharacters = chineseCharacters.filter(char => 
        unknownWords.includes(char.id.toString())
      );
      targetChars = unknownCharacters.slice(0, targetCount);
    }
    
    if (targetChars.length < targetCount) {
      const remainingCount = targetCount - targetChars.length;
      const usedIds = new Set(targetChars.map(char => char.id));
      const availableChars = chineseCharacters.filter(char => !usedIds.has(char.id));
      
      const shuffled = [...availableChars].sort(() => Math.random() - 0.5);
      targetChars = [...targetChars, ...shuffled.slice(0, remainingCount)];
    }

    await preloadAudios(targetChars);

    setGameState({
      targetCharacters: targetChars,
      currentTarget: targetChars[0],
      gridCards: Array(totalGridCells).fill(null),
      flippedIndex: null,
      lastFlippedIndex: null,
      score: 0,
      gameStatus: 'playing',
      correctCount: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      loadingProgress: 100,
      loadingText: '加载完成',
      totalTargets: 10,
      maskVisible: config.enableMask
    });

    if (targetChars[0]) {
      playCharacterAudio(targetChars[0].character);
    }

    gameTimerRef.current = setTimeout(() => {
      flipNextCard(targetChars, targetChars[0]);
    }, 1000);
  }, [clearAllTimers, totalGridCells, config.enableMask]);

  // 组件加载时自动开始游戏初始化
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // 翻转下一张卡片
  const flipNextCard = useCallback((targetChars: Character[], currentTarget: Character | null) => {
    if (!currentTarget) return;

    if (flipTimerRef.current) {
      clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }

    setGameState(prev => {
      let availablePositions = Array.from({ length: totalGridCells }, (_, i) => i);
      if (prev.lastFlippedIndex !== null) {
        availablePositions = availablePositions.filter(pos => pos !== prev.lastFlippedIndex);
      }
      
      const randomPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      const showTarget = Math.random() < 1/3;
      const characterToShow = showTarget ? currentTarget : getRandomCharacter();

      return {
        ...prev,
        gridCards: prev.gridCards.map((card, index) => 
          index === randomPosition ? characterToShow : card
        ),
        flippedIndex: randomPosition,
        lastFlippedIndex: randomPosition
      };
    });

    flipTimerRef.current = setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        gridCards: prev.gridCards.map((card, index) => 
          index === prev.flippedIndex ? null : card
        ),
        flippedIndex: null
      }));

      gameTimerRef.current = setTimeout(() => {
        setGameState(current => {
          if (current.gameStatus === 'playing' && current.currentTarget) {
            if (gameTimerRef.current) {
              flipNextCard(current.targetCharacters, current.currentTarget);
            }
          }
          return current;
        });
      }, 200);
    }, 2000);
  }, [totalGridCells]);

  // 获取随机字符（非目标字符）
  const getRandomCharacter = (): Character => {
    const availableChars = chineseCharacters.filter(char => 
      char.id !== gameState.currentTarget?.id
    );
    return availableChars[Math.floor(Math.random() * availableChars.length)];
  };

  // 处理卡片点击
  const handleCardClick = (index: number) => {
    if (gameState.flippedIndex !== index || !gameState.gridCards[index]) return;

    const clickedCharacter = gameState.gridCards[index];
    const isCorrect = clickedCharacter?.id === gameState.currentTarget?.id;

    if (isCorrect) {
      const newConsecutiveCorrect = gameState.consecutiveCorrect + 1;
      console.log(`正确！${clickedCharacter.character} (${newConsecutiveCorrect}/3)`);
      
      if (gameState.currentTarget) {
        playCharacterAudio(gameState.currentTarget.character);
      }
      
      setTimeout(() => {
        playRandomVoicePrompt('success');
      }, 1000);
      
      setAnimatingCard(index);
      
      setTimeout(() => {
        setAnimatingCard(null);
        
        if (newConsecutiveCorrect >= 3) {
          const newCorrectCount = gameState.correctCount + 1;
          
          if (newCorrectCount >= gameState.totalTargets) {
            setGameState(prev => ({
              ...prev,
              gameStatus: 'finished',
              score: prev.score + 30,
              correctCount: newCorrectCount,
              consecutiveCorrect: 0,
              consecutiveWrong: 0
            }));
            console.log('恭喜！游戏完成！');
            playRandomVoicePrompt('remove');
          } else {
            const nextTarget = gameState.targetCharacters[newCorrectCount];
            setGameState(prev => ({
              ...prev,
              currentTarget: nextTarget,
              score: prev.score + 30,
              correctCount: newCorrectCount,
              consecutiveCorrect: 0,
              consecutiveWrong: 0,
              gridCards: Array(totalGridCells).fill(null),
              flippedIndex: null,
              lastFlippedIndex: null,
              maskVisible: config.enableMask && newCorrectCount < 3 // 遮挡逻辑：前3个目标有遮挡
            }));
            
            console.log(`目标完成！2秒后进入下一个目标：${nextTarget.character}`);
            
            if (flipTimerRef.current) {
              clearTimeout(flipTimerRef.current);
              flipTimerRef.current = null;
            }
            if (gameTimerRef.current) {
              clearTimeout(gameTimerRef.current);
              gameTimerRef.current = null;
            }
            if (audioTimerRef.current) {
              clearTimeout(audioTimerRef.current);
              audioTimerRef.current = null;
            }
            
            audioTimerRef.current = setTimeout(() => {
              playCharacterAudio(nextTarget.character);
              gameTimerRef.current = setTimeout(() => {
                flipNextCard(gameState.targetCharacters, nextTarget);
              }, 1000);
            }, 2000);
          }
        } else {
          setGameState(prev => ({
            ...prev,
            score: prev.score + 10,
            consecutiveCorrect: newConsecutiveCorrect,
            consecutiveWrong: 0,
            gridCards: Array(totalGridCells).fill(null),
            flippedIndex: null
          }));
        }
      }, 500);
    } else {
      const newConsecutiveWrong = gameState.consecutiveWrong + 1;
      
      if (newConsecutiveWrong >= 3) {
        console.log(`连续错误3次！仔细看看这个字`);
        playRandomVoicePrompt('unknown');
        
        setTimeout(() => {
          if (gameState.currentTarget) {
            playCharacterAudio(gameState.currentTarget.character);
          }
        }, 1500);
        
        setGameState(prev => ({
          ...prev,
          consecutiveCorrect: 0,
          consecutiveWrong: 0
        }));
      } else {
        console.log(`错误！这是 ${clickedCharacter?.character}，连续正确次数重置`);
        playRandomVoicePrompt('failure');
        
        setGameState(prev => ({
          ...prev,
          consecutiveCorrect: 0,
          consecutiveWrong: newConsecutiveWrong
        }));
      }
      
      setShakeWindow(true);
      setTimeout(() => {
        setShakeWindow(false);
      }, 600);
    }
  };

  const handleBack = () => {
    navigate('/level');
  };

  const handleRestart = () => {
    clearAllTimers();
    initializeGame();
  };

  // 计算网格列数
  const getColSpan = () => {
    return 24 / config.gridSize;
  };

  // 渲染遮挡区（只遮挡内容区域，不遮挡标题和按钮）
  const renderMask = () => {
    if (!config.enableMask || !gameState.maskVisible) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: '55px', // 从标题下方开始遮挡，留出标题和按钮区域
          left: '24px',
          right: '24px',
          bottom: '24px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '0 0 8px 8px', // 只有底部圆角
          transition: 'opacity 1s ease-out'
        }}
      >
        <Text style={{ color: '#fff', fontSize: isMobile ? '14px' : '16px' }}>
          目标汉字已隐藏，请点击播放读音按钮
        </Text>
      </div>
    );
  };

  return (
    <Layout 
      style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        animation: shakeWindow ? 'shake 0.6s ease-in-out' : 'none'
      }}
    >
      <Header style={{ 
        height: '80px',
        background: 'transparent',
        padding: '0 20px',
        position: 'relative'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}>
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
              {isMobile ? "返回" : "返回关卡"}
            </Button>
          </div>
          <Title level={isMobile ? 2 : 1} style={{ color: '#fff', margin: '0' }}>
            {config.gameTitle}
          </Title>
        </div>
      </Header>

      <Content style={{ padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {gameState.gameStatus === 'loading' && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999
            }}>
              <Title level={1} style={{ color: '#fff', marginBottom: '40px', fontSize: '2.5rem' }}>
                游戏加载中...
              </Title>
              <div style={{ 
                background: '#fff', 
                borderRadius: '12px', 
                padding: '30px', 
                maxWidth: '500px', 
                width: '80%',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ 
                  height: '12px', 
                  background: '#f0f0f0', 
                  borderRadius: '6px', 
                  overflow: 'hidden',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #1890ff, #52c41a)',
                    width: `${gameState.loadingProgress}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <Text>{gameState.loadingText}</Text>
              </div>
            </div>
          )}

          {gameState.gameStatus !== 'waiting' && (
            <>
              {/* 游戏状态栏 */}
              <Card style={{ marginBottom: '20px', textAlign: 'center' }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Text strong>得分: {gameState.score}</Text>
                  </Col>
                  <Col span={6}>
                    <Text strong>进度: {gameState.correctCount}/{gameState.totalTargets}</Text>
                  </Col>
                  <Col span={6}>
                    <Text strong style={{ color: '#1890ff' }}>连击: {gameState.consecutiveCorrect}/3</Text>
                  </Col>
                  <Col span={6}>
                    {gameState.gameStatus === 'finished' ? (
                      <Button type="primary" onClick={handleRestart}>
                        重新开始
                      </Button>
                    ) : (
                      <Text strong style={{ color: '#52c41a' }}>游戏中...</Text>
                    )}
                  </Col>
                </Row>
              </Card>

              {/* 目标栏 */}
              {gameState.currentTarget && gameState.gameStatus === 'playing' && (
                <div style={{ position: 'relative', marginBottom: '30px' }}>
                  {renderMask()}
                  <Card 
                    title="当前目标" 
                    style={{ textAlign: 'center' }}
                    extra={
                      <Button 
                        type="text" 
                        icon={<SoundOutlined />}
                        onClick={() => playCharacterAudio(gameState.currentTarget!.character)}
                      >
                        播放读音
                      </Button>
                    }
                  >
                    {(!config.enableMask || !gameState.maskVisible) && (
                      <>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1890ff' }}>
                          {gameState.currentTarget.character}
                        </div>
                        <div style={{ fontSize: '18px', color: '#666', marginTop: '10px' }}>
                          {gameState.currentTarget.pinyin} - {gameState.currentTarget.meaning} - {gameState.currentTarget.word}
                        </div>
                      </>
                    )}
                    {config.enableMask && gameState.maskVisible && (
                      <div style={{ fontSize: '24px', color: '#666', padding: '40px 0' }}>
                        目标汉字已隐藏，请仔细听读音
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* 网格 */}
              <Row gutter={[15, 15]} style={{ maxWidth: config.gridSize === 3 ? '400px' : '600px', margin: '0 auto' }}>
                {gameState.gridCards.map((character, index) => (
                  <Col key={index} span={getColSpan()}>
                    <div
                      onClick={() => handleCardClick(index)}
                      className={animatingCard === index ? 'card-animate' : ''}
                      style={{
                        width: '100%',
                        height: config.gridSize === 3 ? '100px' : '80px',
                        position: 'relative',
                        cursor: 'pointer',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.3s',
                        transform: gameState.flippedIndex === index ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* 卡片背面 */}
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}>
                        <Text style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>?</Text>
                      </div>

                      {/* 卡片正面 */}
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: character ? '#fff' : 'transparent',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: character ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                        border: character ? '2px solid #1890ff' : 'none'
                      }}>
                        {character && (
                          <Text style={{ 
                            fontSize: config.gridSize === 3 ? '36px' : '28px', 
                            fontWeight: 'bold', 
                            color: '#1890ff' 
                          }}>
                            {character.character}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default WhackAMoleGame;

// 添加样式
const styles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  @keyframes cardPop {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.8; }
    100% { transform: scale(1.5); opacity: 0; }
  }

  .card-animate {
    animation: cardPop 0.5s ease-out forwards;
  }
`;

// 将样式添加到页面
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}