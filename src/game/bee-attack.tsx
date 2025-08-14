import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chineseCharacters } from '../data/characters';
import pinyin from 'tiny-pinyin';

interface Bee {
  id: string;
  character: string;
  pinyin: string;
  x: number;
  y: number;
  isAttacking: boolean;
  attackPath: number; // 攻击轨迹类型 0-4
  attackProgress: number; // 攻击进度 0-1
}

interface Ship {
  x: number;
  health: number;
  isRecording: boolean;
  hasShield: boolean;
  shieldTime: number;
}

interface Laser {
  id: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
  phase: 'expanding' | 'shrinking'; // 激光动画阶段
}

const BeeAttackGame: React.FC = () => {
  const [bees, setBees] = useState<Bee[]>([]);
  const [ship, setShip] = useState<Ship>({
    x: 400, // 屏幕中央
    health: 10,
    isRecording: false,
    hasShield: false,
    shieldTime: 0
  });
  const [lasers, setLasers] = useState<Laser[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentPinyin, setCurrentPinyin] = useState('');
  const [consecutiveHits, setConsecutiveHits] = useState(0);
  const [formationOffset, setFormationOffset] = useState(0); // 蜜蜂阵型左右移动偏移
  const [formationDirection, setFormationDirection] = useState(1); // 1向右，-1向左
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const attackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 初始化蜜蜂阵型
  const initializeBees = useCallback(() => {
    const savedWords = JSON.parse(localStorage.getItem('unknownWords') || '[]');
    const allWords = [...chineseCharacters.slice(0, 15).map(c => c.character), ...savedWords.slice(0, 5)]; // 取20个字
    
    const newBees: Bee[] = allWords.slice(0, 20).map((char, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      return {
        id: `bee-${index}`,
        character: char,
        pinyin: pinyin.convertToPinyin(char, '', true), // 转换为小写拼音
        x: 150 + col * 100, // 5列排列
        y: 50 + row * 60,   // 4行排列
        isAttacking: false,
        attackPath: 0,
        attackProgress: 0
      };
    });
    
    setBees(newBees);
  }, []);

  // 攻击轨迹计算函数
  const getAttackPosition = (path: number, progress: number, startX: number): { x: number; y: number } => {
    const startY = 50;
    const endY = 500;
    const y = startY + (endY - startY) * progress;
    
    switch (path) {
      case 0: // 直线下降
        return { x: startX, y };
      case 1: // 左弧线
        return { x: startX - 100 * Math.sin(progress * Math.PI), y };
      case 2: // 右弧线
        return { x: startX + 100 * Math.sin(progress * Math.PI), y };
      case 3: // S型
        return { x: startX + 50 * Math.sin(progress * Math.PI * 2), y };
      case 4: // Z型
        return { x: startX + (progress < 0.5 ? -50 : 50), y };
      default:
        return { x: startX, y };
    }
  };

  // 开始语音识别
  const startVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.log('浏览器不支持语音识别');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setShip(prev => ({ ...prev, isRecording: true }));
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        const pinyinResult = pinyin.convertToPinyin(finalTranscript, '', true);
        setCurrentPinyin(pinyinResult);
        checkHit(pinyinResult);
      }
    };
    
    recognition.onerror = () => {
      setShip(prev => ({ ...prev, isRecording: false }));
    };
    
    recognition.onend = () => {
      if (gameStarted && !gameOver) {
        recognition.start(); // 重新开始识别
      } else {
        setShip(prev => ({ ...prev, isRecording: false }));
      }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  }, [gameStarted, gameOver]);

  // 检查拼音命中
  const checkHit = useCallback((inputPinyin: string) => {
    const targetBee = bees.find(bee => 
      !bee.isAttacking && bee.pinyin === inputPinyin
    );
    
    if (targetBee) {
      // 移动飞船到目标位置并发射激光
      setShip(prev => ({ ...prev, x: targetBee.x }));
      
      // 创建激光
      const newLaser: Laser = {
        id: `laser-${Date.now()}`,
        x: targetBee.x,
        y: 500,
        width: 1,
        opacity: 0.9,
        phase: 'expanding'
      };
      
      setLasers(prev => [...prev, newLaser]);
      
      // 移除被击中的蜜蜂
      setTimeout(() => {
        setBees(prev => prev.filter(bee => bee.id !== targetBee.id));
      }, 200);
      
      // 增加连击数
      setConsecutiveHits(prev => {
        const newHits = prev + 1;
        if (newHits >= 3) {
          // 激活护盾
          setShip(shipPrev => ({ 
            ...shipPrev, 
            hasShield: true, 
            shieldTime: 5000 
          }));
          return 0; // 重置连击数
        }
        return newHits;
      });
    }
  }, [bees]);

  // 游戏主循环
  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) return;
    
    // 更新蜜蜂阵型移动
    setFormationOffset(prev => {
      const newOffset = prev + formationDirection * 0.5;
      if (newOffset > 100 || newOffset < -100) {
        setFormationDirection(dir => -dir);
      }
      return newOffset;
    });
    
    // 更新攻击中的蜜蜂位置
    setBees(prev => prev.map(bee => {
      if (bee.isAttacking) {
        const newProgress = bee.attackProgress + 0.01;
        if (newProgress >= 1) {
          // 蜜蜂到达底部，玩家受伤
          if (!ship.hasShield) {
            setShip(shipPrev => ({ 
              ...shipPrev, 
              health: Math.max(0, shipPrev.health - 1) 
            }));
          }
          return { ...bee, isAttacking: false, attackProgress: 0 };
        }
        return { ...bee, attackProgress: newProgress };
      }
      return bee;
    }));
    
    // 更新激光动画
    setLasers(prev => prev.map(laser => {
      if (laser.phase === 'expanding') {
        const newWidth = laser.width + 2;
        if (newWidth >= 10) {
          return { ...laser, width: newWidth, phase: 'shrinking' };
        }
        return { ...laser, width: newWidth };
      } else {
        const newWidth = laser.width - 1;
        const newOpacity = laser.opacity - 0.1;
        if (newWidth <= 0 || newOpacity <= 0) {
          return null;
        }
        return { ...laser, width: newWidth, opacity: newOpacity };
      }
    }).filter(Boolean) as Laser[]);
    
    // 更新护盾时间
    if (ship.hasShield) {
      setShip(prev => {
        const newShieldTime = prev.shieldTime - 16; // 约60fps
        if (newShieldTime <= 0) {
          return { ...prev, hasShield: false, shieldTime: 0 };
        }
        return { ...prev, shieldTime: newShieldTime };
      });
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, gameOver, ship.hasShield, formationDirection]);

  // 随机蜜蜂攻击
  const triggerBeeAttack = useCallback(() => {
    setBees(prev => {
      const availableBees = prev.filter(bee => !bee.isAttacking);
      if (availableBees.length === 0) return prev;
      
      const randomBee = availableBees[Math.floor(Math.random() * availableBees.length)];
      const attackPath = Math.floor(Math.random() * 5);
      
      return prev.map(bee => 
        bee.id === randomBee.id 
          ? { ...bee, isAttacking: true, attackPath, attackProgress: 0 }
          : bee
      );
    });
  }, []);

  // 开始游戏
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    initializeBees();
    startVoiceRecognition();
    
    // 每5秒触发一次蜜蜂攻击
    attackIntervalRef.current = setInterval(triggerBeeAttack, 5000);
  };

  // 游戏结束检查
  useEffect(() => {
    if (ship.health <= 0 && !gameOver) {
      setGameOver(true);
      setGameStarted(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [ship.health, gameOver]);

  // 启动游戏循环
  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, gameOver, gameLoop]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="bee-attack-game" style={{ 
      width: '800px', 
      height: '600px', 
      position: 'relative', 
      background: 'linear-gradient(to bottom, #87CEEB, #98FB98)',
      border: '2px solid #333',
      margin: '20px auto',
      overflow: 'hidden'
    }}>
      {/* 游戏信息 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: '#333',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        生命值: {ship.health} | 连击: {consecutiveHits} | 当前拼音: {currentPinyin}
      </div>

      {/* 蜜蜂阵型 */}
      {bees.map(bee => {
        const position = bee.isAttacking 
          ? getAttackPosition(bee.attackPath, bee.attackProgress, bee.x)
          : { x: bee.x + formationOffset, y: bee.y };
        
        return (
          <div
            key={bee.id}
            style={{
              position: 'absolute',
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: '40px',
              height: '40px',
              backgroundColor: '#FFD700',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              border: '2px solid #FFA500',
              transition: bee.isAttacking ? 'none' : 'left 0.1s ease-in-out',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {bee.character}
          </div>
        );
      })}

      {/* 飞船 */}
      <div
        style={{
          position: 'absolute',
          left: `${ship.x - 25}px`,
          bottom: '20px',
          width: '50px',
          height: '50px',
          backgroundColor: '#4169E1',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          transition: 'left 0.3s ease-in-out',
          transform: ship.isRecording ? 'scale(1.1)' : 'scale(1)',
          animation: ship.isRecording ? 'pulse 1s infinite' : 'none',
          border: ship.hasShield ? '3px solid #00FF00' : 'none',
          boxShadow: ship.hasShield ? '0 0 20px #00FF00' : '0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        {/* 录音指示器 */}
        {ship.isRecording && (
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            backgroundColor: '#FF0000',
            borderRadius: '50%',
            animation: 'blink 0.5s infinite'
          }} />
        )}
      </div>

      {/* 护盾效果 */}
      {ship.hasShield && (
        <div style={{
          position: 'absolute',
          left: `${ship.x - 40}px`,
          bottom: '5px',
          width: '80px',
          height: '80px',
          border: '3px solid #00FF00',
          borderRadius: '50%',
          opacity: 0.6,
          animation: 'shield-pulse 0.5s infinite'
        }} />
      )}

      {/* 激光 */}
      {lasers.map(laser => (
        <div
          key={laser.id}
          style={{
            position: 'absolute',
            left: `${laser.x - laser.width / 2}px`,
            bottom: '70px',
            width: `${laser.width}px`,
            height: '400px',
            backgroundColor: `rgba(255, 255, 255, ${laser.opacity})`,
            boxShadow: `0 0 ${laser.width * 2}px rgba(255, 255, 255, ${laser.opacity})`,
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* 游戏开始/结束界面 */}
      {!gameStarted && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
            {gameOver ? '游戏结束!' : '蜜蜂攻击战'}
          </h2>
          <p style={{ margin: '0 0 20px 0', color: '#666' }}>
            {gameOver 
              ? '你的飞船被击毁了！' 
              : '说出汉字的拼音来攻击蜜蜂！连续命中3次可获得护盾！'
            }
          </p>
          <button
            onClick={startGame}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4169E1',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {gameOver ? '重新开始' : '开始游戏'}
          </button>
        </div>
      )}

      {/* CSS动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes shield-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default BeeAttackGame;