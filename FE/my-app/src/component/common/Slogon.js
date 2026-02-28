export const PLAYER_SLOGANS = {
  1: "Anh chả ngán ai bao giờ! 😎",
  2: "Cờ thấp nhưng lòng tự trọng cao.",
  3: "Độc Cô Cầu Bại",
  4: "Chiếu hết trong 3 nốt nhạc...",
  5: "Thắng không kiêu, bại... xóa game.",
  // Bạn có thể map theo userId từ database
};

export const getSlogan = (userId) => {
  return PLAYER_SLOGANS[userId] || "Kỳ thủ đang ẩn mình...";
};