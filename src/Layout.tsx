import React, { useState, useEffect } from 'react';
import MusicPlayer from './components/MusicPlayer';
import { getMusicList } from './services';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [musicList, setMusicList] = useState<string[]>([]);

  useEffect(() => {
    // 初始化音乐列表
    const initMusicList = async () => {
      try {
        const musicFiles = await getMusicList();
        setMusicList(musicFiles);
        console.log('音乐列表加载完成:', musicFiles);
      } catch (error) {
        console.error('音乐列表加载失败:', error);
        // 如果获取失败，使用默认列表
        setMusicList([]);
      }
    };

    initMusicList();
  }, []);

  return (
    <>
      {children}
      <MusicPlayer musicList={musicList} />
    </>
  );
};

export default Layout;