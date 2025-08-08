import React, { useState, useRef, useEffect } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import './MusicPlayer.css';

interface MusicPlayerProps {
  musicList: string[];
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ musicList }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true; // 单曲循环
      audioRef.current.volume = 0.3; // 设置音量为30%
    }
  }, []);

  useEffect(() => {
    if (audioRef.current && musicList.length > 0) {
      // 直接使用原始文件名，让浏览器处理编码
      audioRef.current.src = `/assets/music/${musicList[currentIndex]}`;
      console.log('Loading audio:', `/assets/music/${musicList[currentIndex]}`);
      // 强制重新加载音频元素
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentIndex, musicList]);

  // 点击外部区域收起播放器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && playerRef.current && !playerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      // 不需要手动设置isPlaying，让audio的onPlay/onPause事件处理
    }
  };

  const playPrevious = () => {
    if (musicList.length > 0) {
      const newIndex = currentIndex === 0 ? musicList.length - 1 : currentIndex - 1;
      setCurrentIndex(newIndex);
    }
  };

  const playNext = () => {
    if (musicList.length > 0) {
      const newIndex = currentIndex === musicList.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
    }
  };

  if (musicList.length === 0) {
    return null;
  }

  return (
    <div ref={playerRef} className={`music-player ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          // 单曲循环：歌曲结束后重新播放
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }
        }}
        onError={(e) => {
          console.error('Audio loading error:', e);
          console.error('Audio src:', audioRef.current?.src);
        }}
        onLoadStart={() => console.log('Audio load started')}
        onCanPlay={() => console.log('Audio can play')}
        loop={false}
      />
      
      {/* 收缩状态下的触发按钮 */}
      {!isExpanded && (
        <button 
          className="drawer-trigger" 
          onClick={() => setIsExpanded(true)}
        >
          {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        </button>
      )}
      
      {/* 展开状态下的完整控制面板 */}
      {isExpanded && (
        <div className="music-controls-panel">
          <div className="music-controls">
            <button 
              className="control-btn prev-btn" 
              onClick={playPrevious}
              disabled={musicList.length <= 1}
            >
              <LeftOutlined />
            </button>
            
            <button className="control-btn play-btn" onClick={togglePlay}>
              {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            </button>
            
            <button 
              className="control-btn next-btn" 
              onClick={playNext}
              disabled={musicList.length <= 1}
            >
              <RightOutlined />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;