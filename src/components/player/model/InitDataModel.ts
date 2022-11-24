
import { ICON_PLAY_CIRCLE, POINT_RANDOM } from '@/config/params';
import utils from '@/util/util';
import { Point } from 'accessibility';
import { RootAutomator2 } from 'root_automator';

/** 音符以及时刻  */
export type MusicNote = { 
  key: string,
  time: number
};
/** 一首歌的所有音符 */
type MusicItemItem = {
  songNotes: Array<MusicNote>
}
/** 一首歌，歌名和歌的所有音符。是符合sky studio的格式的 */
type MusicItemType = {
  name: string,
  data: Array<MusicItemItem>
}
export type MusicNameType = {
  id: number,
  name: string,
  icon: string
}
type AutomatorType = RootAutomator2 | 
  { press: ((x: number, y: number, duration: number) => Promise<boolean>) } |
  null

export default class InitDataModel {
  private static _points: Point[] = [];                                       // 15个弹奏坐标
  private static _musicList: MusicItemType[] = [];                            // 所有音乐信息
  private static _musicNameList: MusicNameType[] = [];                        // 所有音乐名字
  private static _automator: AutomatorType = null;                            // 弹奏使用的api
  public static getPointsLength(): number {
    return InitDataModel._points.length;
  }
  public static getPointByIndex(index: number): Point {
    return InitDataModel._points[index];
  }
  public static setPoints(points: Point[]) {
    InitDataModel._points = points;
  }
  public static addMusic(music: MusicItemType) {
    // 音乐信息，用于弹奏音乐
    InitDataModel._musicList.push(music);
    // 音乐名字，用于选择哪首音乐
    InitDataModel._musicNameList.push({
      id: InitDataModel._musicNameList.length,
      name: music.name,
      icon: ICON_PLAY_CIRCLE
    });
  }
  public static getMusicListLength() {
    return InitDataModel._musicList.length;
  }
  public static getMusicByMusicName(musicName: string) {
    for (let i = 0; i < InitDataModel._musicList.length; i++) {
      const { name } = InitDataModel._musicList[i];
      if (name === musicName) {
        return i;
      }
    }
  }
  /** 通过索引获取_musicList中的某首音乐信息 */
  public static getSongNotesByIndex(index: number) {
    if (index < 0 || index >= InitDataModel._musicList.length) return
    const music = InitDataModel._musicList[index];
    if (music && music.data && music.data[0]) {
      return music.data[0].songNotes;
    }
  }
  /** 通过索引获取_musicList中的某首音乐的名字 */
  public static getMusicNameByIndex(index: number) {
    if (index < 0 || index >= InitDataModel._musicList.length) return
    const music = InitDataModel._musicList[index];
    if (music && music.name) {
      return music.name;
    }
  }
  public static get musicNameList(): MusicNameType[] {
    return InitDataModel._musicNameList;
  }
  public static get automator(): AutomatorType {
    return InitDataModel._automator;
  }
  public static set automator(automator: AutomatorType) {
    InitDataModel._automator = automator;
  }
  public static getPointByNote(note: MusicNote): Point | undefined {
    if (!note.key || note.time == null) {
      console.error("音乐按键数据错误 note", note);
      return;
    }
    if (InitDataModel._points == null || !InitDataModel._points.length) return; // 解决飘红的问题
    // 根据音符来获取_points中对应的坐标。play studio的key是 0Key14的样子(0~14，刚好符合_points的索引)
    const index = Number(note.key.substring(note.key.indexOf('Key') + 3));
    const p: Point = InitDataModel._points[index];
    // 添加随机的因素
    const x = p.x + utils.selectFrom((-1)*POINT_RANDOM, POINT_RANDOM);
    const y = p.y + utils.selectFrom((-1)*POINT_RANDOM, POINT_RANDOM);
    return { x, y };
  }
}