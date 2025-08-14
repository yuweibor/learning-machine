export const getImg = async (name: string) => {
  const clientIds = [
    'KAkpgm_aUtrO5UAmzqhCHC2PUOrOYRWgq7KMOhK86rs',
    'VgXXwwxZfmVMlgHvbyGWx4oFI0sA5Al5WannrsoMQEU'
  ];
  
  // 尝试使用第一个client_id
  try {
    const response = await fetch(`https://api.unsplash.com/photos/random?query=${name}&client_id=${clientIds[0]}`);
    if (response.ok) {
      return response;
    }
    throw new Error(`First client_id failed with status: ${response.status}`);
  } catch (error) {
    console.warn('第一个client_id请求失败，尝试使用第二个client_id:', error);
    
    // 尝试使用第二个client_id
    try {
      const response = await fetch(`https://api.unsplash.com/photos/random?query=${name}&client_id=${clientIds[1]}`);
      if (response.ok) {
        return response;
      }
      throw new Error(`Second client_id failed with status: ${response.status}`);
    } catch (secondError) {
      console.error('两个client_id都请求失败:', secondError);
      throw new Error('所有client_id都请求失败');
    }
  }
};
// 获取音频URL，带指纹缓存机制
export const getMp3WithCache = async (name: string): Promise<string | null> => {
  // 检查指纹缓存
  const cachedUrl = urlFingerprintCache.get(name);
  if (cachedUrl) {
    console.log(`使用缓存的音频URL: ${name} -> ${cachedUrl}`);
    return cachedUrl;
  }

  // 如果缓存中没有，则请求新的URL
  try {
    const response = await getMp3(name);
    if (response.ok) {
      const audioData = await response.json();
      if (audioData.status === 1 && audioData.data?.file_url) {
        const url = audioData.data.file_url;
        // 缓存URL指纹
        urlFingerprintCache.set(name, url);
        console.log(`缓存新的音频URL: ${name} -> ${url}`);
        return url;
      }
    }
  } catch (error) {
    console.error(`获取音频URL失败: ${name}`, error);
  }
  
  return null;
};

export const getMp3 = (name: string) => {
  const formData = new URLSearchParams();
  formData.append('text', name);
  formData.append('voice', 'zhiwei');
  formData.append('format', 'mp3');
  formData.append('speed', '0.5');
  formData.append('pitch', '1');
  formData.append('volume', '100');
  formData.append('quality', 'standard');
  
  return fetch(`https://hbapi.qikekeji.com/freetts/tts/generate/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });
};

// 获取音乐文件列表
export const getMusicList = async (): Promise<string[]> => {
  // 直接返回音乐文件列表，不进行网络验证
  // 因为webpack dev server的静态文件服务可能不支持HEAD请求
  const musicFiles = [
    '儿童歌曲-读书郎.mp3'
  ];

  return musicFiles;
};

// 语音提示文本
const VOICE_TEXTS = {
  unknown: ["这个有点难哦", "先记到生词本里", "帮我记一下吧", "好好标记一下", "记得复习"],
  known: ["我记住你了", "这个很简单", "我真棒,难不倒我", "这个我早就会了", "终于记住你了"],
  remove: ["好久不看,我忘记了", "我再看看", "我也不确定能不能记住", "在学习学习吧"],
  success: ["bingo!", "correct!", "good!", "excellent!", "太棒了!", "抓到我了!"],
  failure: ["啊欧!", "不对!", "你行不行啊?", "咋回事呀?", "错了错了!", "再接再厉!"]
};

// 预加载的音频缓存
const audioCache = new Map<string, HTMLAudioElement>();

// URL指纹缓存 - 使用文件名作为指纹映射到URL
const urlFingerprintCache = new Map<string, string>();

// 检查音频是否已缓存
export const isAudioCached = (characters: string[]): boolean => {
  // 检查所有语音提示是否已缓存
  const allTexts = [...VOICE_TEXTS.unknown, ...VOICE_TEXTS.known, ...VOICE_TEXTS.remove, ...VOICE_TEXTS.success, ...VOICE_TEXTS.failure];
  const voicesCached = allTexts.every(text => audioCache.has(text));
  
  // 检查所有字符读音是否已缓存
  const charactersCached = characters.every(char => audioCache.has(`character_${char}`));
  
  return voicesCached && charactersCached;
};

// 预加载所有语音提示
export const preloadVoicePrompts = async () => {
  const allTexts = [...VOICE_TEXTS.unknown, ...VOICE_TEXTS.known, ...VOICE_TEXTS.remove, ...VOICE_TEXTS.success, ...VOICE_TEXTS.failure];
  
  // 使用Promise.allSettled来并行处理，避免单个失败影响整体
  const results = await Promise.allSettled(
    allTexts.map(async (text) => {
      try {
        const audioUrl = await getMp3WithCache(text);
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.preload = 'auto';
          audioCache.set(text, audio);
          return { text, success: true };
        }
        return { text, success: false, reason: '音频URL获取失败' };
      } catch (error) {
        console.warn(`预加载语音失败: ${text}`, error);
        return { text, success: false, reason: error };
      }
    })
  );
  
  const successCount = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;
  
  console.log(`语音预加载完成: ${successCount}/${allTexts.length} 个音频加载成功`);
  return { successCount, totalCount: allTexts.length };
};

// 预加载汉字读音
export const preloadCharacterAudios = async (characters: string[]) => {
  const results = await Promise.allSettled(
    characters.map(async (character) => {
      try {
        const audioUrl = await getMp3WithCache(character);
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.preload = 'auto';
          audioCache.set(`character_${character}`, audio);
          return { character, success: true };
        }
        return { character, success: false, reason: '音频URL获取失败' };
      } catch (error) {
        console.warn(`预加载汉字读音失败: ${character}`, error);
        return { character, success: false, reason: error };
      }
    })
  );
  
  const successCount = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;
  
  console.log(`汉字读音预加载完成: ${successCount}/${characters.length} 个音频加载成功`);
  return { successCount, totalCount: characters.length };
};

// 播放汉字读音
export const playCharacterAudio = async (character: string) => {
  let audio = audioCache.get(`character_${character}`);
  
  if (audio) {
    // 使用预加载的音频
    audio.currentTime = 0;
    audio.play().catch(error => {
      console.error('预加载汉字读音播放失败:', error);
    });
  } else {
    // 预加载失败时，实时获取音频
    console.warn(`未找到预加载的汉字读音，实时获取: ${character}`);
    try {
      const audioUrl = await getMp3WithCache(character);
      if (audioUrl) {
        audio = new Audio(audioUrl);
        audio.play().catch(error => {
          console.error('实时汉字读音播放失败:', error);
        });
        // 缓存这个音频供下次使用
        audioCache.set(`character_${character}`, audio);
      }
    } catch (error) {
      console.error('实时获取汉字读音失败:', error);
    }
  }
};

// 播放随机语音提示
export const playRandomVoicePrompt = async (type: 'unknown' | 'known' | 'remove' | 'success' | 'failure') => {
  const texts = VOICE_TEXTS[type];
  const randomText = texts[Math.floor(Math.random() * texts.length)];
  let audio = audioCache.get(randomText);
  
  if (audio) {
    // 使用预加载的音频
    audio.currentTime = 0;
    audio.play().catch(error => {
      console.error('预加载语音播放失败:', error);
    });
  } else {
    // 预加载失败时，实时获取音频
    console.warn(`未找到预加载的语音，实时获取: ${randomText}`);
    try {
      const audioUrl = await getMp3WithCache(randomText);
      if (audioUrl) {
        audio = new Audio(audioUrl);
        audio.play().catch(error => {
          console.error('实时语音播放失败:', error);
        });
        // 缓存这个音频供下次使用
        audioCache.set(randomText, audio);
      }
    } catch (error) {
      console.error('实时获取语音失败:', error);
    }
  }
};

// 清除URL指纹缓存（可选，用于调试或重置）
export const clearUrlFingerprintCache = () => {
  urlFingerprintCache.clear();
  console.log('URL指纹缓存已清除');
};

// 获取当前缓存状态（可选，用于调试）
export const getCacheStatus = () => {
  return {
    urlCacheSize: urlFingerprintCache.size,
    audioCacheSize: audioCache.size,
    urlCacheEntries: Array.from(urlFingerprintCache.entries())
  };
};