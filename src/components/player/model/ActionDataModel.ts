import { DATA_STORE_NAME, DATA_STORE_PLAY_STATE } from "@/config/params";
import utils from "@/util/util";
import { createDatastore } from "datastore";
import { showToast } from "toast";
import BasicTask from "../ctrl/task/BasicTask";
import InitDataModel, { MusicNote } from "./InitDataModel";

// 播放模式
export enum PlayPattern {
  LIST_REPEAT = 'LIST_REPEAT',                // 通常是列表循环
  ONE_REPEAT = 'ONE_REPEAT',                  // 单曲循环
  RANDOM_PLAY = 'RANDOM_PLAY'                 // 随机循环
}
// 播放状态
export enum PlayStatus {
  STOP = 'STOP',                              // 已停止
  START = 'START',                            // 正在播放
  PAUSE = 'PAUSE',                            // 已暂停
}
export type LastPlayState = {
  currMusicName: string,
  currMusicProgress: number,
  playPattern: PlayPattern,
  randomMusicList: string[],
  randomIndex: number,
}
enum HandleRandomMusicList {
  Tail = 'Tail',
  Head = 'Head'
}
export enum NextOrBack {
  Next = 'Next', // 下一曲
  Back = 'Back', // 上一曲
}

export enum PlayTask {
  SWITCH_PLAY_PATTERN = 'SWITCH_PLAY_PATTERN', // 切换播放模式
  PLAY_START = 'PLAY_START',                   // 开始播放
  PLAY_PAUSE = 'PLAY_PAUSE',                   // 暂停播放
  PLAY_BACK = 'PLAY_BACK',                     // 上一曲
  PLAY_NEXT = 'PLAY_NEXT',                     // 下一曲
  PLAY_STOP = 'PLAY_STOP',                     // 停止播放
  CLOSE_PLAYER = 'CLOSE_PLAYER',               // 关闭播放器
  SELECT_MUSIC = 'SELECT_MUSIC',               // 选择歌曲（打开/关闭）
}
export enum FinishType {
  Break = 'Break',
  PlayFinsh = 'PlayFinsh',
  TaskFinsh = 'TaskFinsh'
}

const datastore = createDatastore(DATA_STORE_NAME);

/** 播放器需要的数据 */
export default class ActionDataModel {
  private static _instance: ActionDataModel | null;
  public static get I(): ActionDataModel {
    return ActionDataModel._instance ? ActionDataModel._instance : (ActionDataModel._instance = new ActionDataModel())
  }
  private _taskList: Array<BasicTask> = [];                            // 任务列表
  private _currMusicName: string = '';                                 // 当前歌曲的名字（文件名）
  private _currMusicIndex: number = 0;                                 // 当前歌曲的的索引
  private _currMusicProgress: number = 0;                              // 当前歌曲播放到哪了（时间进度）
  private _playStatus: PlayStatus = PlayStatus.STOP;                   // 播放状态（停止/播放/暂停）
  private _playPattern: PlayPattern = PlayPattern.LIST_REPEAT;         // 播放模式（列表循环/单曲循环/随机循环）
  private _randomMusicList: string[] = [];                             // 用于随机模式下的上一曲/下一曲（目前只存10个）
  private _randomIndex: number = -1;                                   // 正在操作_randomMusicList的哪一项
  private _selectMusic: boolean = false;                               // 是否打开了选择歌曲悬浮窗
  private _songNotes: MusicNote[] | undefined;                         // 当前歌曲的音乐信息
  private _seekBarAction: boolean = false;                             // 进度条是否正在被拖动
  private _tempProgress: number | null = null;                         // 进度条在人为拖动或点击时，记录变动的progress
  constructor() {}
  // 在播放器打开时需要获取上次的播放信息
  public async getData() {
    try {
      // 在关闭音乐播放器后，会存储一些信息，供下次打开时使用，比如上次播放的是哪首歌、播放模式
      const state: LastPlayState | undefined = await datastore.get(DATA_STORE_PLAY_STATE);
      if (state != null) {
        this._currMusicName = state.currMusicName != null ? state.currMusicName : '';
        this._currMusicProgress = state.currMusicProgress != null ? state.currMusicProgress : 0;
        this._playPattern = state.playPattern || PlayPattern.LIST_REPEAT;
        this._randomMusicList = state.randomMusicList || [];
        this._randomIndex = state.randomIndex != null ? state.randomIndex: -1;
      }
      // _currMusicIndex要与之对应
      const music = InitDataModel.getMusicByMusicName(this._currMusicName)
      music && (this._currMusicIndex = music)
    } catch (error) {
      showToast('ActionDataModel _init 异常，请通知管理员！')
      console.error(error);
    }
  }
  // 在播放器关闭时需要保存当前的播放信息
  public async saveData() {
    try {
      await datastore.set(DATA_STORE_PLAY_STATE, {
        currMusicName: this._currMusicName,
        currMusicProgress: this._currMusicProgress,
        playPattern: this._playPattern,
        randomMusicList: this._randomMusicList,
        randomIndex: this._randomIndex,
      })
    } catch (error) {
      showToast('ActionDataModel saveData 异常，请通知管理员！')
      console.error(error);
    }
  }
  public addTask(task: BasicTask) {
    this._taskList.push(task);
  }
  public removeTask(): BasicTask | undefined {
    return this._taskList.shift();
  }
  public removeTaskByIndex(index: number) {
    this._taskList.splice(index, 1);
  }
  public getTaskByIndex(index: number): BasicTask | undefined {
    if (index < 0 || index >= this._taskList.length) return
    return this._taskList[index];
  }
  public getTaskLength(): number {
    return this._taskList.length;
  }
  public get currMusicName(): string {
    return this._currMusicName;
  }
  public set currMusicName(name: string) {
    this._currMusicName = name;
  }
  public get currMusicIndex(): number {
    return this._currMusicIndex;
  }
  public set currMusicIndex(index: number) {
    this._currMusicIndex = index;
    // 当_currMusicIndex变化时也要更新_currMusicName
    const musicName = InitDataModel.getMusicNameByIndex(index)
    this._currMusicName = musicName || '';
  }
  public reduceCurrMusicIndex() {
    this.currMusicIndex = this._currMusicIndex - 1;
    this._handleCurrIndex();
  }
  public addCurrMusicIndex() {
    this.currMusicIndex = this._currMusicIndex + 1;
    this._handleCurrIndex();
  }
  private _handleCurrIndex() {
    const musicListLength = InitDataModel.getMusicListLength()
    // 列表循环时，一直“上一曲”（currMusic一直减去1），会被减成负数，我们手动把它变到末尾去，“下一曲”同理
    if (this._currMusicIndex < 0) {
      this.currMusicIndex = this._currMusicIndex + musicListLength;
    } else if (this._currMusicIndex >= musicListLength) {
      this.currMusicIndex = this._currMusicIndex - musicListLength
    }
  }
  public get currMusicProgress(): number {
    return this._currMusicProgress;
  }
  public set currMusicProgress(progress: number) {
    this._currMusicProgress = progress;
  }
  public get playStatus(): PlayStatus {
    return this._playStatus;
  }
  public set playStatus(status: PlayStatus) {
    this._playStatus = status;
  }
  public get playPattern(): PlayPattern {
    return this._playPattern;
  }
  public set playPattern(pattern: PlayPattern) {
    this._playPattern = pattern;
  }
  public get randomIndex(): number {
    return this._randomIndex;
  }
  public set randomIndex(index: number) {
    this._randomIndex = index;
  }
  /** 获取RandomMusicList的长度 */
  public getRandomMusicListLength(): number {
    return this._randomMusicList.length;
  }
  /** 根据索引来获取RandomMusicList里的某项 */
  public getRandomMusicListByIndex(index: number): string | undefined {
    if (index < 0 || index >= this._randomMusicList.length) {
      console.error("请确认index的合法性")
      return
    }
    return this._randomMusicList[index];
  }
  /** 向尾部或者头部添加item，默认往尾部添加 */
  public addItemToRandomMusicList(item: string, type: HandleRandomMusicList = HandleRandomMusicList.Tail) {
    if (!item) {
      console.error("请不要往RandomMusicList添加空字符串")
      return
    }
    (type == null || type === HandleRandomMusicList.Tail) ? this._randomMusicList.push(item) : this._randomMusicList.unshift(item);
  }
  /** 从尾部或者头部移除一项 */
  public removeItemFromRandomMusicList(type: HandleRandomMusicList = HandleRandomMusicList.Tail) {
    return (type == null || type === HandleRandomMusicList.Tail) ? this._randomMusicList.pop() : this._randomMusicList.unshift()
  }
  public clearRandomMusicList() {
    this._randomMusicList = [];
    this._randomIndex = -1;
  }
  public get selectMusic(): boolean {
    return this._selectMusic;
  }
  public set selectMusic(isSelect: boolean) {
    this._selectMusic = isSelect;
  }
  public setCurrMusicIndexByMusicName(musicName: string | undefined) {
    let target = 0;
    if (!musicName) {
      this.currMusicIndex = target;
      return;
    }
    const rlt = InitDataModel.getMusicByMusicName(musicName)
    this.currMusicIndex = rlt || target;
  }
  public randomCurrMusicIndex(): string | undefined {
    this.currMusicIndex = utils.selectFrom(0, InitDataModel.getMusicListLength() - 1);
    return InitDataModel.getMusicNameByIndex(this._currMusicIndex)
  }
  public nextOrBackAtRandomPattern(type: NextOrBack = NextOrBack.Next) {
    // 优先从backRandomMusicList中取旧的，大于等于2的意思是，正在播的算一个，剩一个就是可以“上一曲/下一曲”的
    let randomIndex = this._randomIndex;
    if (this._randomMusicList.length >= 2 && (
        (type === NextOrBack.Back && this._randomIndex >= 1) || // 大于等于1的意思是，至少留1个让它进行“上一曲”，也就是留了索引0
        (type === NextOrBack.Next && this._randomIndex <= (this._randomMusicList.length - 2)) // 至少留1个让它进行“下一曲”，也就是留了索引length-1
      )
    ) {
      randomIndex = type === NextOrBack.Next ? (randomIndex + 1) : (randomIndex - 1); // 上一曲或下一曲是在目前的randomIndex操作的
      // 让Play的_currMusicIndex取backRandomMusicList里的旧值
      const musicName = this._randomMusicList[randomIndex]; // 根据randomIndex取_randomMusicList里的musicName
      ActionDataModel.I.randomIndex = randomIndex;
      // 根据旧的来更新当前的Play的_currMusicIndex
      this.setCurrMusicIndexByMusicName(musicName);
    } else {
      // 没法取旧的了，那就让Play的_currMusicIndex随机取
      const musicName = this.randomCurrMusicIndex();
      if (!musicName) {
        console.error('获取音乐名异常')
        return;
      }
      const param1 = type === NextOrBack.Next ? HandleRandomMusicList.Tail : HandleRandomMusicList.Head
      const param2 = type === NextOrBack.Next ? HandleRandomMusicList.Head : HandleRandomMusicList.Tail
      // 如果是下一曲，就将新的放到末尾；如果是上一曲，就将新的放到首部
      this.addItemToRandomMusicList(musicName, param1);
      // 超出10个，下一曲就去掉首部那个，上一曲就去掉尾部那个
      this._randomMusicList.length > 10 && this.removeItemFromRandomMusicList(param2)
      // 因为取的是新的，那么要让_randomIndex的值始终处于首部或者尾部
      this._randomIndex = type === NextOrBack.Next ? (this._randomMusicList.length - 1) : 0;
    }
  }
  public updateSongNotes() {
    this._songNotes = InitDataModel.getSongNotesByIndex(ActionDataModel.I.currMusicIndex)
  }
  public getSongNotesLength(): number | undefined {
    return this._songNotes?.length;
  }
  public getSongNoteByIndex(index: number) {
    return this._songNotes ? this._songNotes[index] : null;
  }
  public get tempProgress(): number | null {
    return this._tempProgress;
  }
  public set tempProgress(progress: number | null) {
    this._tempProgress = progress;
  }
  public get seekBarAction(): boolean {
    return this._seekBarAction;
  }
  public set seekBarAction(action: boolean) {
    this._seekBarAction = action;
  }
  public static destroy() {
    this._instance = null;
  }
}