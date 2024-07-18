let safeRepeatList: any[] = [];
export const safeList = (c: any): boolean => {
  const time = Date.now();
  // 过滤出10分钟内的交易请求
  safeRepeatList = safeRepeatList.filter((trade: any) => trade.time > time - 1000 * 60 * 10);
  // 检查是否存在重复的交易请求
  const hasRepeat = safeRepeatList.some((trade: any) => JSON.stringify(trade.c) === JSON.stringify(c));
  if (!hasRepeat) {
    safeRepeatList.unshift({ time, c });
    return false;
  } else if (safeRepeatList.length > 1000) {
    safeRepeatList.pop();
  }
  return true;
};
