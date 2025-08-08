// 100个简单的汉字数据
export interface Character {
  id: number;
  character: string;
  pinyin: string;
  meaning: string;
  word: string; // 组词
}

export const chineseCharacters: Character[] = [
  { id: 1, character: '人', pinyin: 'rén', meaning: 'people', word: '人民' },
  { id: 2, character: '大', pinyin: 'dà', meaning: 'everyone', word: '大家' },
  { id: 3, character: '小', pinyin: 'xiǎo', meaning: 'child', word: '小孩' },
  { id: 4, character: '水', pinyin: 'shuǐ', meaning: 'fruit', word: '水果' },
  { id: 5, character: '火', pinyin: 'huǒ', meaning: 'train', word: '火车' },
  { id: 6, character: '山', pinyin: 'shān', meaning: 'landscape', word: '山水' },
  { id: 7, character: '天', pinyin: 'tiān', meaning: 'sky', word: '天空' },
  { id: 8, character: '地', pinyin: 'dì', meaning: 'place', word: '地方' },
  { id: 9, character: '日', pinyin: 'rì', meaning: 'days', word: '日子' },
  { id: 10, character: '月', pinyin: 'yuè', meaning: 'moon', word: '月亮' },
  { id: 11, character: '木', pinyin: 'mù', meaning: 'wood', word: '木头' },
  { id: 12, character: '金', pinyin: 'jīn', meaning: 'money', word: '金钱' },
  { id: 13, character: '土', pinyin: 'tǔ', meaning: 'land', word: '土地' },
  { id: 14, character: '手', pinyin: 'shǒu', meaning: 'mobile phone', word: '手机' },
  { id: 15, character: '足', pinyin: 'zú', meaning: 'football', word: '足球' },
  { id: 16, character: '口', pinyin: 'kǒu', meaning: 'saliva', word: '口水' },
  { id: 17, character: '目', pinyin: 'mù', meaning: 'goal', word: '目标' },
  { id: 18, character: '心', pinyin: 'xīn', meaning: 'mood', word: '心情' },
  { id: 19, character: '门', pinyin: 'mén', meaning: 'entrance', word: '门口' },
  { id: 20, character: '车', pinyin: 'chē', meaning: 'car', word: '汽车' },
  { id: 21, character: '马', pinyin: 'mǎ', meaning: 'road', word: '马路' },
  { id: 22, character: '牛', pinyin: 'niú', meaning: 'milk', word: '牛奶' },
  { id: 23, character: '羊', pinyin: 'yáng', meaning: 'wool', word: '羊毛' },
  { id: 24, character: '鸟', pinyin: 'niǎo', meaning: 'bird', word: '小鸟' },
  { id: 25, character: '鱼', pinyin: 'yú', meaning: 'fish', word: '鱼儿' },
  { id: 26, character: '虫', pinyin: 'chóng', meaning: 'insect', word: '虫子' },
  { id: 27, character: '花', pinyin: 'huā', meaning: 'flower', word: '花朵' },
  { id: 28, character: '草', pinyin: 'cǎo', meaning: 'grass', word: '草地' },
  { id: 29, character: '树', pinyin: 'shù', meaning: 'tree', word: '大树' },
  { id: 30, character: '叶', pinyin: 'yè', meaning: 'leaf', word: '叶子' },
  { id: 31, character: '风', pinyin: 'fēng', meaning: 'scenery', word: '风景' },
  { id: 32, character: '雨', pinyin: 'yǔ', meaning: 'rain', word: '下雨' },
  { id: 33, character: '雪', pinyin: 'xuě', meaning: 'snowflake', word: '雪花' },
  { id: 34, character: '云', pinyin: 'yún', meaning: 'cloud', word: '白云' },
  { id: 35, character: '电', pinyin: 'diàn', meaning: 'telephone', word: '电话' },
  { id: 36, character: '光', pinyin: 'guāng', meaning: 'sunshine', word: '阳光' },
  { id: 37, character: '色', pinyin: 'sè', meaning: 'color', word: '颜色' },
  { id: 38, character: '声', pinyin: 'shēng', meaning: 'sound', word: '声音' },
  { id: 39, character: '音', pinyin: 'yīn', meaning: 'music', word: '音乐' },
  { id: 40, character: '字', pinyin: 'zì', meaning: 'Chinese character', word: '汉字' },
  { id: 41, character: '书', pinyin: 'shū', meaning: 'book', word: '书本' },
  { id: 42, character: '学', pinyin: 'xué', meaning: 'study', word: '学习' },
  { id: 43, character: '生', pinyin: 'shēng', meaning: 'student', word: '学生' },
  { id: 44, character: '老', pinyin: 'lǎo', meaning: 'teacher', word: '老师' },
  { id: 45, character: '师', pinyin: 'shī', meaning: 'teacher', word: '老师' },
  { id: 46, character: '友', pinyin: 'yǒu', meaning: 'friend', word: '朋友' },
  { id: 47, character: '家', pinyin: 'jiā', meaning: 'family', word: '家庭' },
  { id: 48, character: '国', pinyin: 'guó', meaning: 'China', word: '中国' },
  { id: 49, character: '中', pinyin: 'zhōng', meaning: 'middle', word: '中间' },
  { id: 50, character: '文', pinyin: 'wén', meaning: 'Chinese', word: '中文' },
  { id: 51, character: '白', pinyin: 'bái', meaning: 'white', word: '白色' },
  { id: 52, character: '黑', pinyin: 'hēi', meaning: 'black', word: '黑色' },
  { id: 53, character: '红', pinyin: 'hóng', meaning: 'red', word: '红色' },
  { id: 54, character: '绿', pinyin: 'lǜ', meaning: 'green', word: '绿色' },
  { id: 55, character: '蓝', pinyin: 'lán', meaning: 'blue', word: '蓝色' },
  { id: 56, character: '黄', pinyin: 'huáng', meaning: 'yellow', word: '黄色' },
  { id: 57, character: '一', pinyin: 'yī', meaning: 'one', word: '一个' },
  { id: 58, character: '二', pinyin: 'èr', meaning: 'twenty', word: '二十' },
  { id: 59, character: '三', pinyin: 'sān', meaning: 'three', word: '三个' },
  { id: 60, character: '四', pinyin: 'sì', meaning: 'season', word: '四季' },
  { id: 61, character: '五', pinyin: 'wǔ', meaning: 'five', word: '五个' },
  { id: 62, character: '六', pinyin: 'liù', meaning: 'six', word: '六月' },
  { id: 63, character: '七', pinyin: 'qī', meaning: 'seven', word: '七天' },
  { id: 64, character: '八', pinyin: 'bā', meaning: 'eight', word: '八点' },
  { id: 65, character: '九', pinyin: 'jiǔ', meaning: 'nine', word: '九月' },
  { id: 66, character: '十', pinyin: 'shí', meaning: 'ten', word: '十分' },
  { id: 67, character: '百', pinyin: 'bǎi', meaning: 'hundred', word: '一百' },
  { id: 68, character: '千', pinyin: 'qiān', meaning: 'thousand', word: '一千' },
  { id: 69, character: '万', pinyin: 'wàn', meaning: 'ten thousand', word: '一万' },
  { id: 70, character: '年', pinyin: 'nián', meaning: 'year', word: '今年' },
  { id: 71, character: '月', pinyin: 'yuè', meaning: 'month', word: '这月' },
  { id: 72, character: '日', pinyin: 'rì', meaning: 'day', word: '今日' },
  { id: 73, character: '时', pinyin: 'shí', meaning: 'time', word: '时间' },
  { id: 74, character: '分', pinyin: 'fēn', meaning: 'minute', word: '分钟' },
  { id: 75, character: '秒', pinyin: 'miǎo', meaning: 'second', word: '秒钟' },
  { id: 76, character: '早', pinyin: 'zǎo', meaning: 'morning', word: '早上' },
  { id: 77, character: '晚', pinyin: 'wǎn', meaning: 'evening', word: '晚上' },
  { id: 78, character: '今', pinyin: 'jīn', meaning: 'today', word: '今天' },
  { id: 79, character: '明', pinyin: 'míng', meaning: 'tomorrow', word: '明天' },
  { id: 80, character: '昨', pinyin: 'zuó', meaning: 'yesterday', word: '昨天' },
  { id: 81, character: '来', pinyin: 'lái', meaning: 'come over', word: '过来' },
  { id: 82, character: '去', pinyin: 'qù', meaning: 'go out', word: '出去' },
  { id: 83, character: '走', pinyin: 'zǒu', meaning: 'walk', word: '走路' },
  { id: 84, character: '跑', pinyin: 'pǎo', meaning: 'run', word: '跑步' },
  { id: 85, character: '飞', pinyin: 'fēi', meaning: 'airplane', word: '飞机' },
  { id: 86, character: '游', pinyin: 'yóu', meaning: 'swim', word: '游泳' },
  { id: 87, character: '吃', pinyin: 'chī', meaning: 'eat', word: '吃饭' },
  { id: 88, character: '喝', pinyin: 'hē', meaning: 'drink', word: '喝水' },
  { id: 89, character: '睡', pinyin: 'shuì', meaning: 'sleep', word: '睡觉' },
  { id: 90, character: '起', pinyin: 'qǐ', meaning: 'get up', word: '起床' },
  { id: 91, character: '坐', pinyin: 'zuò', meaning: 'sit down', word: '坐下' },
  { id: 92, character: '站', pinyin: 'zhàn', meaning: 'stand', word: '站立' },
  { id: 93, character: '看', pinyin: 'kàn', meaning: 'read book', word: '看书' },
  { id: 94, character: '听', pinyin: 'tīng', meaning: 'listen', word: '听话' },
  { id: 95, character: '说', pinyin: 'shuō', meaning: 'speak', word: '说话' },
  { id: 96, character: '读', pinyin: 'dú', meaning: 'read', word: '读书' },
  { id: 97, character: '写', pinyin: 'xiě', meaning: 'write', word: '写字' },
  { id: 98, character: '画', pinyin: 'huà', meaning: 'draw', word: '画画' },
  { id: 99, character: '唱', pinyin: 'chàng', meaning: 'sing', word: '唱歌' },
  { id: 100, character: '跳', pinyin: 'tiào', meaning: 'dance', word: '跳舞' }
];

// 随机选择12个汉字用于学习（保留兼容性）
export const getRandomCharacters = (count: number = 12): Character[] => {
  const shuffled = [...chineseCharacters].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// 按顺序获取汉字用于学习
export const getSequentialCharacters = (startIndex: number = 0, count: number = 12): Character[] => {
  const totalChars = chineseCharacters.length;
  const characters: Character[] = [];
  
  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    if (index >= totalChars) {
      break; // 超出范围时停止添加
    }
    characters.push(chineseCharacters[index]);
  }
  
  return characters;
};

// 获取总字符数
export const getTotalCharacterCount = (): number => {
  return chineseCharacters.length;
};