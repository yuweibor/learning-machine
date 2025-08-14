import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Typography, Layout, Space, Row, Col, message } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Character, chineseCharacters } from '../data/characters';
import { playRandomVoicePrompt, getMp3, preloadVoicePrompts, preloadCharacterAudios, playCharacterAudio, isAudioCached } from '../services';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

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
  totalTargets: number; // 总目标数量
}

const WhackAMolePage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    targetCharacters: [],
    currentTarget: null,
    gridCards: Array(9).fill(null),
    flippedIndex: null,
    lastFlippedIndex: null,
    score: 0,
    gameStatus: 'loading',
    correctCount: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    loadingProgress: 0,
    loadingText: '',
    totalTargets: 10 // 默认10个目标
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
    // 检查是否已经缓存了所需的音效
    const characters = targetChars.map(char => char.character);
    
    if (isAudioCached(characters)) {
      // 如果已缓存，直接跳过加载界面
      console.log('音效已缓存，跳过加载过程');
      return;
    }
    
    setGameState(prev => ({ ...prev, gameStatus: 'loading', loadingProgress: 0, loadingText: '正在加载音效...' }));
    
    // 预加载语音提示
    const voiceResult = await preloadVoicePrompts();
    setGameState(prev => ({ ...prev, loadingProgress: 30, loadingText: `音效加载: ${voiceResult.successCount}/${voiceResult.totalCount}` }));
    
    // 预加载汉字读音
    const characterResult = await preloadCharacterAudios(characters);
    setGameState(prev => ({ ...prev, loadingProgress: 80, loadingText: `汉字读音加载: ${characterResult.successCount}/${characterResult.totalCount}` }));
    
    // 加载完成
    setGameState(prev => ({ ...prev, loadingProgress: 100, loadingText: '加载完成！' }));
    
    // 等待一下再开始游戏
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  // 初始化游戏
  const initializeGame = useCallback(async () => {
    // 清理所有现有定时器
    clearAllTimers();
    
    // 从localStorage获取生词本
    const unknownWords = JSON.parse(localStorage.getItem('unknownWords') || '[]');
    
    // 获取目标字符集合（优先生词本，不足则从全部字符中补充）
    let targetChars: Character[] = [];
    const targetCount = 10; // 总共10个目标字符
    
    if (unknownWords.length > 0) {
      // 从生词本中获取字符
      const unknownCharacters = chineseCharacters.filter(char => 
        unknownWords.includes(char.id.toString())
      );
      targetChars = unknownCharacters.slice(0, targetCount);
    }
    
    // 如果生词本不足10个，从全部字符中随机补充
    if (targetChars.length < targetCount) {
      const remainingCount = targetCount - targetChars.length;
      const usedIds = new Set(targetChars.map(char => char.id));
      const availableChars = chineseCharacters.filter(char => !usedIds.has(char.id));
      
      // 随机选择剩余字符
      const shuffled = [...availableChars].sort(() => Math.random() - 0.5);
      targetChars = [...targetChars, ...shuffled.slice(0, remainingCount)];
    }

    // 预加载音频
    await preloadAudios(targetChars);

    setGameState({
      targetCharacters: targetChars,
      currentTarget: targetChars[0],
      gridCards: Array(9).fill(null),
      flippedIndex: null,
      lastFlippedIndex: null,
      score: 0,
      gameStatus: 'playing',
      correctCount: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      loadingProgress: 100,
      loadingText: '加载完成',
      totalTargets: 10
    });

    // 播放第一个目标字符的读音
    if (targetChars[0]) {
      playCharacterAudio(targetChars[0].character);
    }

    // 开始翻卡片
    gameTimerRef.current = setTimeout(() => {
      flipNextCard(targetChars, targetChars[0]);
    }, 1000);
  }, [clearAllTimers]);

  // 组件加载时自动开始游戏初始化
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // 翻转下一张卡片
  const flipNextCard = useCallback((targetChars: Character[], currentTarget: Character | null) => {
    if (!currentTarget) return;

    // 清理现有的翻卡定时器
    if (flipTimerRef.current) {
      clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }

    setGameState(prev => {
      // 获取可用位置（排除上次翻转的位置）
      let availablePositions = Array.from({ length: 9 }, (_, i) => i);
      if (prev.lastFlippedIndex !== null) {
        availablePositions = availablePositions.filter(pos => pos !== prev.lastFlippedIndex);
      }
      
      const randomPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];

      // 决定是否显示目标字符（1/3概率）
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

    // 2秒后自动翻回去
    flipTimerRef.current = setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        gridCards: prev.gridCards.map((card, index) => 
          index === prev.flippedIndex ? null : card
        ),
        flippedIndex: null
      }));

      // 如果游戏还在进行，继续翻下一张卡片
      gameTimerRef.current = setTimeout(() => {
        setGameState(current => {
          if (current.gameStatus === 'playing' && current.currentTarget) {
            // 再次检查定时器状态，确保没有重复调用
            if (gameTimerRef.current) {
              flipNextCard(current.targetCharacters, current.currentTarget);
            }
          }
          return current;
        });
      }, 200);
    }, 2000);
  }, []);

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
      // 正确点击
      const newConsecutiveCorrect = gameState.consecutiveCorrect + 1;
      message.success(`正确！${clickedCharacter.character} (${newConsecutiveCorrect}/3)`);
      
      // 先播放目标字的读音
      if (gameState.currentTarget) {
        playCharacterAudio(gameState.currentTarget.character);
      }
      
      // 1秒后播放鼓励音效
      setTimeout(() => {
        playRandomVoicePrompt('success');
      }, 1000);
      
      // 立即播放卡片放大消失动画
      setAnimatingCard(index);
      
      // 动画完成后处理游戏逻辑
      setTimeout(() => {
        setAnimatingCard(null);
        
        // 处理游戏状态更新和翻转回去的逻辑
        if (newConsecutiveCorrect >= 3) {
          // 连续正确3次，通过当前目标
          const newCorrectCount = gameState.correctCount + 1;
          
          // 检查游戏结束条件：完成所有目标
          if (newCorrectCount >= gameState.totalTargets) {
            // 游戏结束
            setGameState(prev => ({
                ...prev,
                gameStatus: 'finished',
                score: prev.score + 30,
                correctCount: newCorrectCount,
                consecutiveCorrect: 0,
                consecutiveWrong: 0
              }));
            message.success('恭喜！游戏完成！');
            playRandomVoicePrompt('remove'); // 使用现有的音效
          } else {
            // 切换到下一个目标
            const nextTarget = gameState.targetCharacters[newCorrectCount];
            setGameState(prev => ({
                ...prev,
                currentTarget: nextTarget,
                score: prev.score + 30,
                correctCount: newCorrectCount,
                consecutiveCorrect: 0,
                consecutiveWrong: 0,
                gridCards: Array(9).fill(null),
              flippedIndex: null,
              lastFlippedIndex: null
            }));
            
            message.success(`目标完成！2秒后进入下一个目标：${nextTarget.character}`);
            
            // 清理所有现有定时器，避免重复调用
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
            
            // 等待2秒后播放下一个目标的读音并开始新的翻卡循环
            audioTimerRef.current = setTimeout(() => {
              playCharacterAudio(nextTarget.character);
              // 开始新的翻卡循环
              gameTimerRef.current = setTimeout(() => {
                flipNextCard(gameState.targetCharacters, nextTarget);
              }, 1000);
            }, 2000);
          }
        } else {
          // 正确但未达到3次，继续当前目标
          setGameState(prev => ({
            ...prev,
            score: prev.score + 10,
            consecutiveCorrect: newConsecutiveCorrect,
            consecutiveWrong: 0,
            gridCards: Array(9).fill(null),
            flippedIndex: null
          }));
        }
      }, 500);
    } else {
      // 错误点击，增加连续错误次数
      const newConsecutiveWrong = gameState.consecutiveWrong + 1;
      
      if (newConsecutiveWrong >= 3) {
        // 连续错误3次，播放特殊提示
        message.error(`连续错误3次！仔细看看这个字`);
        
        // 播放"仔细看看这个字"提示音
         playRandomVoicePrompt('unknown');
        
        // 然后播放目标汉字读音
        setTimeout(() => {
          if (gameState.currentTarget) {
            playCharacterAudio(gameState.currentTarget.character);
          }
        }, 1500);
        
        // 重置连续错误次数
        setGameState(prev => ({
          ...prev,
          consecutiveCorrect: 0,
          consecutiveWrong: 0
        }));
      } else {
        // 普通错误
        message.error(`错误！这是 ${clickedCharacter?.character}，连续正确次数重置`);
        
        // 播放失败音效
        playRandomVoicePrompt('failure');
        
        setGameState(prev => ({
          ...prev,
          consecutiveCorrect: 0,
          consecutiveWrong: newConsecutiveWrong
        }));
      }
      
      // 播放窗口晃动动画
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
            🎯 打地鼠游戏
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
                <Card 
                  title="当前目标" 
                  style={{ marginBottom: '30px', textAlign: 'center' }}
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
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1890ff' }}>
                    {gameState.currentTarget.character}
                  </div>
                  <div style={{ fontSize: '18px', color: '#666', marginTop: '10px' }}>
                    {gameState.currentTarget.pinyin} - {gameState.currentTarget.meaning} - {gameState.currentTarget.word}
                  </div>
                </Card>
              )}

              {/* 九宫格 */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px',
                maxWidth: '400px',
                margin: '0 auto',
                perspective: '1000px'
              }}>
                {gameState.gridCards.map((character, index) => (
                  <div
                    key={index}
                    onClick={() => handleCardClick(index)}
                    className={animatingCard === index ? 'card-animate' : ''}
                    style={{
                      width: '100px',
                      height: '100px',
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
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      border: '2px solid #e9ecef'
                    }}>
                      <Text style={{ color: '#fff', fontSize: '24px' }}>?</Text>
                    </div>
                    
                    {/* 卡片正面 */}
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: '#fff',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      border: '2px solid #e9ecef'
                    }}>
                      {character && (
                        <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#1890ff' }}>
                          {character.character}
                        </Text>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {gameState.gameStatus === 'finished' && (
                <Card style={{ marginTop: '30px', textAlign: 'center' }}>
                  <Title level={3} style={{ color: '#52c41a' }}>
                    🎉 恭喜完成游戏！
                  </Title>
                  <Text style={{ fontSize: '18px' }}>
                    最终得分: {gameState.score} 分
                  </Text>
                </Card>
              )}
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default WhackAMolePage;

// 添加CSS样式
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

// 注入样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}