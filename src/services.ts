export const getImg = (name: string) => {
  // return fetch(`https://api.unsplash.com/photos?query=${name}&client_id=KAkpgm_aUtrO5UAmzqhCHC2PUOrOYRWgq7KMOhK86rs`);
  return fetch(`https://api.unsplash.com/photos/random?query=${name}&client_id=VgXXwwxZfmVMlgHvbyGWx4oFI0sA5Al5WannrsoMQEU`);
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

// 语音提示文本
const VOICE_TEXTS = {
  unknown: ["这个有点难哦", "先记到生词本里", "帮我记一下吧", "好好标记一下", "记得复习"],
  known: ["我记住你了", "这个很简单", "我真棒,难不倒我", "这个我早就会了", "终于记住你了"],
  remove: ["好久不看,我忘记了", "我再看看", "我也不确定能不能记住", "在学习学习吧"]
};

// 预加载的音频缓存
const audioCache = new Map<string, HTMLAudioElement>();

// 预加载所有语音提示
export const preloadVoicePrompts = async () => {
  const allTexts = [...VOICE_TEXTS.unknown, ...VOICE_TEXTS.known, ...VOICE_TEXTS.remove];
  
  // 使用Promise.allSettled来并行处理，避免单个失败影响整体
  const results = await Promise.allSettled(
    allTexts.map(async (text) => {
      try {
        const response = await getMp3(text);
        if (response.ok) {
          const audioData = await response.json();
          if (audioData.status === 1 && audioData.data?.file_url) {
            const audio = new Audio(audioData.data.file_url);
            audio.preload = 'auto';
            audioCache.set(text, audio);
            return { text, success: true };
          }
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
};

// 播放随机语音提示
export const playRandomVoicePrompt = async (type: 'unknown' | 'known' | 'remove') => {
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
      const response = await getMp3(randomText);
      if (response.ok) {
        const audioData = await response.json();
        if (audioData.status === 1 && audioData.data?.file_url) {
          audio = new Audio(audioData.data.file_url);
          audio.play().catch(error => {
            console.error('实时语音播放失败:', error);
          });
          // 缓存这个音频供下次使用
          audioCache.set(randomText, audio);
        }
      }
    } catch (error) {
      console.error('实时获取语音失败:', error);
    }
  }
};