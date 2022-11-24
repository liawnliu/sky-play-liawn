import { readFile, writeFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { throws } from 'node:assert';

console.log('process.argv.slice(2)', );
const params = process.argv.slice(2)

// 将'assets/music/abc/'下的abc形式的曲谱转换成sky studio形式，并存到'assets/music/sky-studio/'下
try {
  if (!params || !params.length) {
    throw new Error("请在工程根目录下输入例如：npm run convert 'Done for me.txt' 280")
  }
  const bpm = Number(params[1]);
  if (!bpm) {
    throw new Error("请检查输入的BPM，它不能为0")
  }
  const time = Math.floor(60 / Number(bpm) * 1000);
  const dirPath = 'assets/music/abc/'
  const fileName = params[0];
  const filePath = dirPath + fileName;
  // 是文件
  if(!statSync(filePath).isFile()){
    throw new Error("请检查输入的文件名是否完整并且有效，最后确认该文件是否存在，也请确保它是utf-8的编码格式。")
  }
  const contents = await readFile(filePath, { encoding: 'utf8' });
  console.log('源文件内容：', contents);
  const songNotes = [];
  let lastMusicKey = '';
  let lastDelayTime = 0;
  for (let i = 0; i < contents.length; i++) {
    const s = contents[i];
    if (s === ' ' || s === '.') {
      if (lastMusicKey) {
        for (let j = 0; j <= lastMusicKey.length - 2; j += 2) {
          let musicKey = '';
          // 暂时这么转，实际不是123
          switch(lastMusicKey[j]) {
            case 'A':
              musicKey = 0;
              break;
            case 'B':
              musicKey = 5;
              break;
            case 'C':
              musicKey = 10;
              break;
          }
          musicKey = 'Key' + (musicKey + Number(lastMusicKey[j+1]) - 1); // 减一的原因是sky studio是从0开始的
          songNotes.push({ key: musicKey, time: lastDelayTime });
        }
        lastMusicKey = ''
      }
      if (s === ' ') {
        lastDelayTime += time;
      }
    } else {
      lastMusicKey += s;
    }
  }
  const newFilePath = filePath.replace('assets/music/abc/', 'assets/music/sky-studio/').replace('.txt', '.json');
  const newContents = JSON.stringify([{songNotes}]);
  console.log('新文件路径：', newFilePath);
  console.log('新文件内容：', newContents);
  await writeFile(newFilePath, newContents, 'utf8');
} catch (err) {
  console.error('文件转换失败', err);
}