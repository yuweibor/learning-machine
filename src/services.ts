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