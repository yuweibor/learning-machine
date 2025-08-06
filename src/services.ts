export const getImg = (name: string) => {
  return fetch(`https://api.unsplash.com/photos/random?query=${name}&count=9&client_id=KAkpgm_aUtrO5UAmzqhCHC2PUOrOYRWgq7KMOhK86rs`);
};
