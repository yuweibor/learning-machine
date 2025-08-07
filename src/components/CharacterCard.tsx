import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { Character } from '../data/characters';
import { getImg, getMp3 } from '../services';

interface CharacterCardProps {
  character: Character;
}

interface CardData {
  imageUrl?: string;
  audioUrl?: string;
  isLoading: boolean;
  error?: string;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardData, setCardData] = useState<CardData>({ isLoading: false });
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // 加载图片和音频数据
  const loadCardData = async () => {
    if (cardData.imageUrl && cardData.audioUrl) return; // 已加载过
    
    setCardData(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('开始加载卡片数据:', character.character, character.word);
      
      // 并行加载图片和音频
      const [imageResponse, audioResponse] = await Promise.all([
        getImg(character.word), // 使用组词获取图片
        getMp3(`${character.character},${character.word}`) // 使用"字,词"格式获取音频
      ]);
      
      console.log('音频请求响应状态:', audioResponse.status, audioResponse.ok);
      
      let imageUrl = '';
      let audioUrl = '';
      
      // 处理图片响应
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrl = imageData.urls?.small || imageData.urls?.regular || '';
        console.log('图片URL获取成功:', imageUrl);
      }
      
      // 处理音频响应
      if (audioResponse.ok) {
        const audioData = await audioResponse.json();
        console.log('音频API响应数据:', audioData);
        if (audioData.status===1 && audioData.data?.file_url) {
          audioUrl = audioData.data.file_url;
          console.log('音频URL获取成功:', audioUrl);
        } else {
          console.log('音频URL获取失败，响应数据:', audioData);
        }
      } else {
        console.log('音频请求失败，状态码:', audioResponse.status);
      }
      
      setCardData({
        imageUrl,
        audioUrl,
        isLoading: false
      });
      
      // 预加载音频并在加载完成后播放
      if (audioUrl) {
        console.log('创建音频对象:', audioUrl);
        const audioElement = new Audio(audioUrl);
        audioElement.preload = 'auto';
        
        // 监听音频加载完成事件
        audioElement.addEventListener('canplaythrough', () => {
          console.log('音频加载完成，准备播放');
          // 第一次翻转时自动播放
          console.log('开始播放音频');
          audioElement.play().then(() => {
            console.log('音频播放成功');
          }).catch(error => {
            console.error('音频播放失败:', error);
          });
        });
        
        // 监听音频加载错误
        audioElement.addEventListener('error', (e) => {
          console.error('音频加载错误:', e);
        });
        
        setAudio(audioElement);
      } else {
        console.log('没有获取到音频URL，无法播放');
      }
      
    } catch (error) {
      console.error('加载卡片数据失败:', error);
      setCardData({
        isLoading: false,
        error: '加载失败'
      });
    }
  };

  // 播放音频
  const playAudio = () => {
    if (audio) {
      audio.currentTime = 0; // 重置播放位置
      audio.play().catch(error => {
        console.error('音频播放失败:', error);
      });
    }
  };

  // 处理卡片点击
  const handleCardClick = () => {
    if (!isFlipped) {
      // 第一次点击：翻转到背面并加载数据
      setIsFlipped(true);
      loadCardData();
    } else {
      // 再次点击：翻转回正面并播放音频
      setIsFlipped(false);
      playAudio();
    }
  };

  // 当翻转到背面且数据加载完成时播放音频（仅在音频已预加载的情况下）
  useEffect(() => {
    if (isFlipped && !cardData.isLoading && audio && cardData.audioUrl) {
      // 如果音频已经加载完成，立即播放
      if (audio.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
        playAudio();
      }
    }
  }, [isFlipped, cardData.isLoading, audio]);

  return (
    <div className="character-card" onClick={handleCardClick}>
      <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
        {/* 正面：显示汉字、拼音、组词、含义 */}
        <div className="card-front">
          <div className="character">{character.character}</div>
          <div className="pinyin">{character.pinyin}</div>
          <div className="word">{character.word}</div>
          <div className="meaning">{character.meaning}</div>
        </div>
        
        {/* 背面：显示图片和汉字信息 */}
        <div className="card-back">
          {cardData.isLoading ? (
            <div className="loading">
              <Spin size="large" />
              <div className="loading-text">加载中...</div>
            </div>
          ) : cardData.error ? (
            <div className="error">
              <div className="character">{character.character}</div>
              <div className="pinyin">{character.pinyin}</div>
              <div style={{ color: '#ff6b6b', marginTop: '10px' }}>加载失败</div>
            </div>
          ) : (
            <>
              {cardData.imageUrl && (
                <img 
                  src={cardData.imageUrl} 
                  alt={character.meaning}
                  className="character-image"
                  onError={(e) => {
                    // 图片加载失败时隐藏
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="character-info">
                <div className="character">{character.character}</div>
                <div className="word">{character.word}</div>
                <div className="pinyin">{character.pinyin}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;