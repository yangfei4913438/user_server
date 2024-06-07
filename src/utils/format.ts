import * as argon2 from 'argon2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

export const formatDate = (
  date: Date,
  format: string = 'YYYY-MM-DD HH:mm:ssZ',
  zone: string = 'Asia/Shanghai',
) => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs(date).tz(zone).format(format);
};

export const formatHash = async (password: string) => {
  return await argon2.hash(password, {
    type: argon2.argon2id, // 哈希类型
  });
};

export const verifyHash = async (hash: string, password: string) => {
  return await argon2.verify(hash, password);
};
