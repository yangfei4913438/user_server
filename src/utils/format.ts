const argon2 = require('argon2');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (
  date: Date,
  format: string = 'YYYY-MM-DD HH:mm:ssZ',
  timezone: string = 'Asia/Shanghai',
) => {
  return dayjs(date).tz(timezone).format(format);
};

export const formatHash = async (
  text: string,
  salt: string = 'are you ok?',
) => {
  return argon2.hash(text, {
    type: argon2.argon2id, // 哈希类型
    memoryCost: 40960, // 内存使用量，千字节，这里是10MB
    timeCost: 3, // 迭代次数
    parallelism: 2, // 线程数
    raw: true, // 原始哈希
    salt,
  });
};
