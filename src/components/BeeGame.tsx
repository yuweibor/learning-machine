import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chineseCharacters, Character } from '../data/characters';
import { preloadVoicePrompts, preloadCharacterAudios, isAudioCached } from '../services';
import pinyin from 'tiny-pinyin';

interface Bee {
  id: number;
  character: Character;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  attackStartX: number; // 攻击开始时的X坐标
  isAttacking: boolean;
  isReturning: boolean;
  attackPath: number; // 随机生成的攻击轨迹
  attackProgress: number; // 攻击进度 0-1
  returnProgress: number; // 返回进度 0-1
}

interface GameState {
  bees: Bee[];
  playerX: number;
  playerHealth: number;
  isRecording: boolean;
  currentPinyin: string;
  shield: boolean;
  shieldTime: number;
  consecutiveHits: number;
  gameOver: boolean;
  score: number;
  gameStatus: 'menu' | 'loading' | 'playing' | 'gameover';
  loadingProgress: number;
  loadingText: string;
}

const BeeGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    bees: [],
    playerX: 400, // 屏幕中央
    playerHealth: 10,
    isRecording: false,
    currentPinyin: '',
    shield: false,
    shieldTime: 0,
    consecutiveHits: 0,
    gameOver: false,
    score: 0,
    gameStatus: 'menu',
    loadingProgress: 0,
    loadingText: ''
  });

  const [laser, setLaser] = useState<{active: boolean, x: number, targetY: number}>({ active: false, x: 0, targetY: 0 });
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const gameLoopRef = useRef<number>(0);
  const lastAttackTimeRef = useRef<number>(0);

  // 获取响应式布局参数
  const getLayoutParams = () => {
    const screenWidth = window.innerWidth;
    const gameWidth = Math.min(800, screenWidth - 40); // 游戏区域宽度
    const beeSize = 40;
    const spacing = 10;
    const totalBeeWidth = beeSize + spacing;
    
    // 根据屏幕宽度计算列数
    const maxCols = Math.floor((gameWidth - 100) / totalBeeWidth);
    const cols = Math.max(4, Math.min(10, maxCols)); // 最少4列，最多10列
    
    return {
      gameWidth,
      cols,
      beeSize,
      spacing: totalBeeWidth
    };
  };

  // 初始化蜜蜂阵型
  const initializeBees = useCallback(() => {
    const selectedChars = chineseCharacters.slice(0, 20);
    const { cols, spacing } = getLayoutParams();
    
    const bees: Bee[] = selectedChars.map((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const originalX = 50 + col * spacing;
      const originalY = 80 + row * 60; // 为顶部标题栏留出空间
      
      return {
        id: index,
        character: char,
        x: originalX,
        y: originalY,
        originalX,
        originalY,
        attackStartX: originalX,
        isAttacking: false,
        isReturning: false,
        attackPath: Math.random() * 1000,
        attackProgress: 0,
        returnProgress: 0
      };
    });
    return bees;
  }, []);

  // 计算变速进度（慢-快-慢）
  const getEasedProgress = (linearProgress: number) => {
    // 使用三次贝塞尔曲线实现慢-快-慢效果
    const t = linearProgress;
    return 3 * t * t - 2 * t * t * t;
  };

  // 随机生成攻击轨迹函数
  const getRandomAttackPosition = (progress: number, startX: number, startY: number, seed: number, endX: number, endY: number = 550) => {
    const easedProgress = getEasedProgress(progress);
    
    // 使用种子生成随机但一致的轨迹
    const curveIntensity = Math.sin(seed * 2) * 60; // 适中的曲线强度
    const waveFreq = 1 + Math.abs(Math.sin(seed * 3)) * 1.2;
    
    // 在攻击后期减少曲线影响，确保最终精准命中目标
    const curveReduction = Math.max(0, 1 - easedProgress * 1.5);
    
    // 计算基础直线轨迹
    const baseX = startX + (endX - startX) * easedProgress;
    const baseY = startY + (endY - startY) * easedProgress;
    
    // 添加曲线偏移
    const curveOffset = curveIntensity * Math.sin(easedProgress * Math.PI * waveFreq) * curveReduction;
    
    return {
      x: baseX + curveOffset,
      y: baseY
    };
  };

  // 存储攻击路径点
  const attackPathsRef = useRef<Map<number, Array<{x: number, y: number}>>>(new Map());

  // 返回原位置的轨迹函数（沿原路径返回，最后归位到目标位置）
  const getReturnPosition = (progress: number, beeId: number, targetX: number, targetY: number) => {
    const pathPoints = attackPathsRef.current.get(beeId);
    if (!pathPoints || pathPoints.length === 0) {
      // 如果没有路径记录，直接返回目标位置
      return { x: targetX, y: targetY };
    }
    
    // 前80%的进度沿原路径反向返回，后20%的进度直接归位到目标位置
    if (progress < 0.8) {
      // 沿原路径反向返回
      const pathProgress = progress / 0.8; // 将前80%的进度映射到0-1
      const reversedProgress = 1 - pathProgress;
      const pointIndex = Math.floor(reversedProgress * (pathPoints.length - 1));
      const nextIndex = Math.min(pointIndex + 1, pathPoints.length - 1);
      
      if (pointIndex === nextIndex) {
        return pathPoints[pointIndex];
      }
      
      // 在两个点之间插值
      const localProgress = (reversedProgress * (pathPoints.length - 1)) - pointIndex;
      const currentPoint = pathPoints[pointIndex];
      const nextPoint = pathPoints[nextIndex];
      
      return {
        x: currentPoint.x + (nextPoint.x - currentPoint.x) * localProgress,
        y: currentPoint.y + (nextPoint.y - currentPoint.y) * localProgress
      };
    } else {
      // 最后20%的进度：从路径起点直接归位到目标位置
      const finalProgress = (progress - 0.8) / 0.2; // 将后20%的进度映射到0-1
      const startPoint = pathPoints[0]; // 路径起点（原始阵型位置）
      
      return {
        x: startPoint.x + (targetX - startPoint.x) * finalProgress,
        y: startPoint.y + (targetY - startPoint.y) * finalProgress
      };
    }
  };

  // 语音识别初始化
  const initSpeechRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          const pinyinResult = pinyin.convertToPinyin(finalTranscript, '', true);
          console.log('识别到:', finalTranscript, '拼音:', pinyinResult);
          setGameState(prev => ({ ...prev, currentPinyin: pinyinResult }));
          checkHit(pinyinResult);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.log('语音识别错误:', event.error);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  // 检查命中
  const checkHit = useCallback((inputPinyin: string) => {
    setGameState(prev => {
      const targetBee = prev.bees.find(bee => 
        !bee.isAttacking && pinyin.convertToPinyin(bee.character.character, '', true) === inputPinyin
      );
      
      if (targetBee) {
        // 发射激光
        setLaser({ active: true, x: targetBee.x, targetY: targetBee.y });
        
        // 飞船移动到目标位置
        const newPlayerX = targetBee.x;
        
        // 移除被击中的蜜蜂
        const newBees = prev.bees.filter(bee => bee.id !== targetBee.id);
        
        const newConsecutiveHits = prev.consecutiveHits + 1;
        const newShield = newConsecutiveHits >= 3;
        
        setTimeout(() => {
          setLaser({ active: false, x: 0, targetY: 0 });
        }, 500);
        
        return {
          ...prev,
          bees: newBees,
          playerX: newPlayerX,
          consecutiveHits: newShield ? 0 : newConsecutiveHits,
          shield: newShield,
          shieldTime: newShield ? 5000 : prev.shieldTime,
          score: prev.score + 10
        };
      } else {
        return {
          ...prev,
          consecutiveHits: 0
        };
      }
    });
  }, []);

  // 游戏主循环
  const gameLoop = useCallback(() => {
    const currentTime = Date.now();
    
    setGameState(prev => {
      if (prev.gameOver) return prev;
      
      let newState = { ...prev };
      
      // 蜜蜂阵型左右移动
      const formationOffset = Math.sin(currentTime * 0.001) * 50;
      
      // 每5秒随机一只蜜蜂攻击
      if (currentTime - lastAttackTimeRef.current > 5000) {
        const availableBees = newState.bees.filter(bee => !bee.isAttacking && !bee.isReturning);
        if (availableBees.length > 0) {
          const randomBee = availableBees[Math.floor(Math.random() * availableBees.length)];
          randomBee.isAttacking = true;
          randomBee.attackPath = Math.random() * 1000; // 新的随机种子
          randomBee.attackProgress = 0;
          randomBee.attackStartX = randomBee.x; // 记录攻击开始时的X坐标
          lastAttackTimeRef.current = currentTime;
        }
      }
      
      // 更新蜜蜂位置
      newState.bees = newState.bees.map(bee => {
        if (bee.isAttacking && !bee.isReturning) {
          const newProgress = Math.min(bee.attackProgress + 0.008, 1); // 基础攻击速度
          
          // 攻击起始坐标：当前蜂群位置 (bee.attackStartX + formationOffset, bee.originalY)
          // 攻击结束坐标：屏幕底部飞船位置 (newState.playerX, 550)
          const startX = bee.attackStartX + formationOffset;
          const startY = bee.originalY;
          const endX = newState.playerX;
          const endY = 550; // 屏幕底部
          
          const attackPos = getRandomAttackPosition(newProgress, startX, startY, bee.attackPath, endX, endY);
          
          // 记录攻击路径点
          if (!attackPathsRef.current.has(bee.id)) {
            attackPathsRef.current.set(bee.id, []);
          }
          attackPathsRef.current.get(bee.id)!.push({ x: attackPos.x, y: attackPos.y });
          
          // 检查是否撞到飞船或到达底部
          if (newProgress >= 0.9 && Math.abs(attackPos.x - newState.playerX) < 30 && !newState.shield) {
            newState.playerHealth = Math.max(0, newState.playerHealth - 1);
            if (newState.playerHealth <= 0) {
              newState.gameOver = true;
            }
            // 开始返回
            return { 
              ...bee, 
              isReturning: true, 
              isAttacking: false,
              returnProgress: 0,
              x: attackPos.x,
              y: attackPos.y
            };
          }
          
          // 攻击完成，开始返回
          if (newProgress >= 1) {
            return { 
              ...bee, 
              isReturning: true, 
              isAttacking: false,
              returnProgress: 0,
              x: attackPos.x,
              y: attackPos.y
            };
          }
          
          return {
            ...bee,
            x: attackPos.x,
            y: attackPos.y,
            attackProgress: newProgress
          };
        } else if (bee.isReturning) {
          // 沿原路径返回
          const newReturnProgress = Math.min(bee.returnProgress + 0.012, 1); // 返回速度
          
          // 返回目标坐标：当前蜂群位置 (bee.originalX + formationOffset, bee.originalY)
          const targetX = bee.originalX + formationOffset;
          const targetY = bee.originalY;
          
          const returnPos = getReturnPosition(newReturnProgress, bee.id, targetX, targetY);
          
          if (newReturnProgress >= 1) {
            // 返回完成，清除路径记录并重置状态
            attackPathsRef.current.delete(bee.id);
            return {
              ...bee,
              x: targetX, // 返回到当前蜂群位置
              y: targetY,
              isReturning: false,
              attackProgress: 0,
              returnProgress: 0
            };
          }
          
          return {
            ...bee,
            x: returnPos.x,
            y: returnPos.y,
            returnProgress: newReturnProgress
          };
        } else {
          // 阵型移动 - 所有非攻击状态的蜜蜂都跟随蜂群移动
          return {
            ...bee,
            x: bee.originalX + formationOffset
          };
        }
      });
      
      // 更新护盾时间
      if (newState.shield && newState.shieldTime > 0) {
        newState.shieldTime = Math.max(0, newState.shieldTime - 16);
        if (newState.shieldTime <= 0) {
          newState.shield = false;
        }
      }
      
      // 检查游戏胜利
      if (newState.bees.length === 0) {
        newState.gameOver = true;
        newState.gameStatus = 'gameover';
      }
      
      return newState;
    });
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [getRandomAttackPosition, getReturnPosition]);

  // 预加载音频
  const preloadAudios = useCallback(async () => {
    const bees = initializeBees();
    const characters = bees.map(bee => bee.character.character);
    
    if (isAudioCached(characters)) {
      console.log('音效已缓存，跳过加载过程');
      return bees;
    }
    
    setGameState(prev => ({ ...prev, gameStatus: 'loading', loadingProgress: 0, loadingText: '正在加载音效...' }));
    
    const voiceResult = await preloadVoicePrompts();
    setGameState(prev => ({ ...prev, loadingProgress: 30, loadingText: `音效加载: ${voiceResult.successCount}/${voiceResult.totalCount}` }));
    
    const characterResult = await preloadCharacterAudios(characters);
    setGameState(prev => ({ ...prev, loadingProgress: 80, loadingText: `汉字读音加载: ${characterResult.successCount}/${characterResult.totalCount}` }));
    
    setGameState(prev => ({ ...prev, loadingProgress: 100, loadingText: '加载完成！' }));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return bees;
  }, [initializeBees]);

  // 开始游戏
  const startGame = useCallback(async () => {
    const bees = await preloadAudios();
    setGameState({
      bees,
      playerX: 400,
      playerHealth: 10,
      isRecording: true,
      currentPinyin: '',
      shield: false,
      shieldTime: 0,
      consecutiveHits: 0,
      gameOver: false,
      score: 0,
      gameStatus: 'playing',
      loadingProgress: 100,
      loadingText: ''
    });
    
    lastAttackTimeRef.current = Date.now();
    
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [preloadAudios, gameLoop]);

  // 重新开始游戏
  const restartGame = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    setTimeout(startGame, 100);
  }, [startGame]);

  // 响应式布局监听
  useEffect(() => {
    const handleResize = () => {
      // 触发重新渲染以更新布局
      setGameState(prev => ({ ...prev }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [initSpeechRecognition]);

  const { gameWidth } = getLayoutParams();
  
  return (
    <div className="bee-game" style={{ 
      position: 'relative', 
      width: `${gameWidth}px`, 
      height: '600px', 
      margin: '0 auto', 
      border: '2px solid #333', 
      backgroundColor: '#001122',
      borderRadius: '10px',
      overflow: 'hidden'
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '50px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 15px',
        zIndex: 50
      }}>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '5px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          ← 返回
        </button>
        
        <h2 style={{
          margin: 0,
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          渐进佳境 - 小蜜蜂
        </h2>
        
        <div style={{ width: '60px' }}></div> {/* 占位符保持标题居中 */}
      </div>
      
      {/* 游戏区域 */}
      <div ref={gameAreaRef} style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '50px' }}>
        
        {/* 蜜蜂 */}
        {gameState.bees.map(bee => (
          <div
            key={bee.id}
            style={{
              position: 'absolute',
              left: bee.x,
              top: bee.y,
              width: '40px',
              height: '40px',
              backgroundColor: bee.isAttacking ? '#ff6b6b' : '#ffd93d',
              border: '2px solid #333',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              transition: bee.isAttacking ? 'none' : 'left 0.1s ease-out',
              zIndex: 10
            }}
          >
            {bee.character.character}
          </div>
        ))}
        
        {/* 激光 */}
        {laser.active && (
          <div
            style={{
              position: 'absolute',
              left: laser.x + 15,
              top: 500,
              width: '10px',
              height: Math.abs(laser.targetY - 500),
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              animation: 'laser-pulse 0.5s ease-out',
              zIndex: 20
            }}
          />
        )}
        
        {/* 飞船 */}
        <div
          style={{
            position: 'absolute',
            left: gameState.playerX - 25,
            top: 500,
            width: '50px',
            height: '50px',
            backgroundColor: gameState.shield ? '#4ecdc4' : '#74b9ff',
            border: gameState.shield ? '3px solid #00b894' : '2px solid #0984e3',
            borderRadius: '50% 50% 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            transition: 'left 0.3s ease-out',
            animation: gameState.isRecording ? 'ship-pulse 1s infinite' : 'none',
            boxShadow: gameState.shield ? '0 0 20px #00b894' : 'none',
            zIndex: 15
          }}
        >
          🚀
        </div>
        
        {/* 录音指示器 */}
        {gameState.isRecording && (
          <div
            style={{
              position: 'absolute',
              left: gameState.playerX - 10,
              top: 470,
              width: '20px',
              height: '20px',
              backgroundColor: '#e17055',
              borderRadius: '50%',
              animation: 'recording-pulse 0.8s infinite'
            }}
          />
        )}
      </div>
      
      {/* 美化的状态界面 */}
      <div style={{ 
        position: 'absolute', 
        top: '60px', 
        left: '10px', 
        right: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 30 
      }}>
        {/* 左侧状态 */}
         <div className="status-card" style={{
           background: 'rgba(0, 0, 0, 0.7)',
           padding: '8px 12px',
           borderRadius: '8px',
           backdropFilter: 'blur(10px)',
           border: '1px solid rgba(255, 255, 255, 0.1)'
         }}>
          <div style={{ color: '#ff6b6b', fontSize: '16px', marginBottom: '4px' }}>
            ❤️ {gameState.playerHealth}
          </div>
          <div style={{ color: '#ffd93d', fontSize: '14px' }}>
            🏆 {gameState.score}
          </div>
        </div>
        
        {/* 中间状态 */}
         <div className="status-card" style={{
           background: 'rgba(0, 0, 0, 0.7)',
           padding: '8px 12px',
           borderRadius: '8px',
           backdropFilter: 'blur(10px)',
           border: '1px solid rgba(255, 255, 255, 0.1)',
           textAlign: 'center',
           animationDelay: '0.5s'
         }}>
          <div style={{ color: '#74b9ff', fontSize: '14px', marginBottom: '4px' }}>
            连击: {gameState.consecutiveHits}/3
          </div>
          {gameState.shield && (
            <div style={{ color: '#4ecdc4', fontSize: '12px' }}>
              🛡️ {Math.ceil(gameState.shieldTime / 1000)}s
            </div>
          )}
        </div>
        
        {/* 右侧拼音显示 */}
         <div className="status-card" style={{
           background: 'rgba(0, 0, 0, 0.7)',
           padding: '8px 12px',
           borderRadius: '8px',
           backdropFilter: 'blur(10px)',
           border: '1px solid rgba(255, 255, 255, 0.1)',
           minWidth: '100px',
           textAlign: 'center',
           animationDelay: '1s'
         }}>
          <div style={{ color: '#a29bfe', fontSize: '12px', marginBottom: '2px' }}>当前拼音</div>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
            {gameState.currentPinyin || '...'}
          </div>
        </div>
      </div>
      
      {/* 游戏开始界面 */}
      {gameState.gameStatus === 'menu' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: 40
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            backdropFilter: 'blur(20px)'
          }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>🐝 小蜜蜂游戏</h1>
            <p style={{ margin: '10px 0', fontSize: '16px', opacity: 0.9 }}>通过语音说出汉字的拼音来攻击蜜蜂</p>
            <p style={{ margin: '10px 0 30px 0', fontSize: '16px', opacity: 0.9 }}>连续命中3次获得护盾</p>
            <button onClick={startGame} style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: 'linear-gradient(45deg, #00b894, #00cec9)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 184, 148, 0.4)',
              transition: 'all 0.3s ease'
            }}>🎮 开始游戏</button>
          </div>
        </div>
      )}
      
      {/* 加载界面 */}
      {gameState.gameStatus === 'loading' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: 45
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            minWidth: '300px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>🎵 准备中...</h3>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '15px'
            }}>
              <div style={{
                width: `${gameState.loadingProgress}%`,
                height: '100%',
                backgroundColor: '#00b894',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', margin: '0 0 10px 0' }}>
              {gameState.loadingText}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', margin: 0 }}>
              {gameState.loadingProgress}%
            </p>
          </div>
        </div>
      )}
      
      {/* 游戏结束遮罩和重新开始按钮 */}
      {gameState.gameOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: 50
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.9) 0%, rgba(255, 159, 67, 0.9) 100%)',
            padding: '40px',
            borderRadius: '20px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '32px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {gameState.bees.length === 0 ? '🎉 恭喜通关!' : '💥 游戏结束'}
            </h2>
            <p style={{ margin: '15px 0 30px 0', fontSize: '20px', opacity: 0.9 }}>最终得分: {gameState.score}</p>
            <button onClick={restartGame} style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: 'linear-gradient(45deg, #74b9ff, #0984e3)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(116, 185, 255, 0.4)',
              transition: 'all 0.3s ease'
            }}>🔄 重新开始</button>
          </div>
        </div>
      )}
      
      {/* CSS动画 */}
      <style>{`
        @keyframes ship-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes recording-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes laser-pulse {
          0% { width: 1px; opacity: 1; }
          50% { width: 10px; opacity: 0.8; }
          100% { width: 1px; opacity: 0.5; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .bee-game button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
        }
        
        .bee-game button:active {
          transform: translateY(0px);
        }
        
        .status-card {
          animation: float 3s ease-in-out infinite;
        }
        
        @media (max-width: 600px) {
          .bee-game {
            margin: 10px !important;
            width: calc(100vw - 20px) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BeeGame;