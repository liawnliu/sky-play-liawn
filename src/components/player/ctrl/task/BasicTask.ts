import IconBtn from "@/components/IconBtn";
import Settings from "@/components/Settings";
import runFindImg, { checkMusicNoteBtn } from "@/logic/FindImg";
import utils from "@/util/util";
import { delay } from "lang";
import { showToast } from "toast";
import ActionDataModel, { FinishType, PlayStatus, PlayTask } from "../../model/ActionDataModel";
import InitDataModel from "../../model/InitDataModel";
import ActionPlayerCtrl from "../ActionPlayerCtrl";

export enum TaskStatus {
  Stop = 'Stop',
  Running = 'Running'
}

export default class BasicTask {
  private _status: TaskStatus = TaskStatus.Stop;
  private _type: PlayTask;
  constructor(type: PlayTask) {
    this._type = type;
  }
  public set status(s: TaskStatus) {
    this._status = s;
  }
  public get status() {
    return this._status;
  }
  public get type() {
    return this._type;
  }
  public run() {}
  protected async _play() {
    if (Settings.settings?.intellectOpen) {
      if (!await runFindImg()) {
        showToast('打开弹奏键盘失败，请在“设置”中关闭“智能打开键盘”')
        ActionPlayerCtrl.I.addTask(PlayTask.PLAY_PAUSE);
      }
    } else {
      if (!await checkMusicNoteBtn()) {
        showToast('请确认页面中是否有弹奏键盘')
        ActionPlayerCtrl.I.addTask(PlayTask.PLAY_PAUSE);
      }
    }
    // 获取要播放的音乐的具体数据
    ActionDataModel.I.updateSongNotes();
    const songNotesLength = ActionDataModel.I.getSongNotesLength()
    // 没有可弹奏的音符
    if (!songNotesLength) {
      // 状态重置
      this._status = TaskStatus.Stop;
      // 进度重置
      ActionDataModel.I.currMusicProgress = 0
      // 立即完成
      ActionPlayerCtrl.I.afterFinsh(FinishType.PlayFinsh);
      return
    }

    // 进度条的最大值
    ActionPlayerCtrl.I.setSeekBarMax(songNotesLength)

    // 当前音乐演奏到第几个音符了，这个currMusicProgress会从本地存储中取上次播放器关闭时的currMusicProgress
    const progress = ActionDataModel.I.currMusicProgress
    console.log('_playDetail progress', progress);
    // 上一个音符的时间是多少
    let lastTime = 0; // 先默认为0
    if (progress && songNotesLength >= 2) { // 如果是从一首音乐的中途的开始的
      // 那么就获取该音符的上一个音符的时间作为lastTime
      const music = ActionDataModel.I.getSongNoteByIndex(progress-1);
      if (music && music.time) {
        lastTime = music.time
      }
    }
    try {
      // 一旦开始弹奏，就得禁用入口的拖拽功能
      IconBtn.dragGesture.setEnabled(false);
      let checkTask;
      let checkSeekBarActionRlt;
      let i = progress; // 从currMusicProgress开始
      for (; i < songNotesLength; i++) {
        // 当前这个音符
        const note = ActionDataModel.I.getSongNoteByIndex(i);
        if (!note) continue;
        // 当前这个音符对应的真实坐标
        const point = InitDataModel.getPointByNote(note);
        // 拿不到真实坐标就跳过
        if (!point) continue;
        // 当前音符与它前面的音符的时间差，会作为延迟播放的时间
        const timeDiff = note.time - lastTime
        // 延迟播放一个音符，使用delay的好处就是它不阻塞事件循环
        await delay(timeDiff)
        // 弹奏前检查进度条是否被拖动或者点击了。在await delay(timeDiff)后面检查，是因为在delay期间是收到拖动或者点击的动作的，在press前是避免按压动作影响拖动事件
        checkSeekBarActionRlt = await ActionPlayerCtrl.I.checkSeekBarAction();
        // 那么采用最新的进度index和时间基准lastTime
        if (checkSeekBarActionRlt) {
          lastTime = checkSeekBarActionRlt.lastTime
          i = checkSeekBarActionRlt.index
          continue;
        }

        // 每轮都要检查是否有暂停\停止等任务是否需要执行
        checkTask = ActionPlayerCtrl.I.tryToRun(true)
        if (checkTask) break

        // 第一个要保证adb shell能正常执行所以await一下，其他的暂时不需要
        if (i === progress) {
          await InitDataModel.automator?.press(point.x, point.y, 1)
        } else {
          InitDataModel.automator?.press(point.x, point.y, 1)
        }
        // 更新进度条和时间的显示，索引为0的音符的time不一定是0，那么它在进度条上对应就不能从0开始，应该从1开始，那么这里就要加一
        timeDiff && ActionPlayerCtrl.I.updateSeekBarProgress(i+1, note.time);

        // 下一次的时间差判断基准
        lastTime = note.time;
      }

      // 打开入口的拖拽功能
      IconBtn.dragGesture.setEnabled(true);
      // 状态重置
      this._status = TaskStatus.Stop;
      // 进度条的最大值
      checkTask !== PlayStatus.PAUSE && ActionPlayerCtrl.I.setSeekBarMax(0)
      // 保存最新进度
      ActionDataModel.I.currMusicProgress = i === songNotesLength ? 0 : i
      // 要区分是什么情况下的完成
      ActionPlayerCtrl.I.afterFinsh(i === songNotesLength ? FinishType.PlayFinsh : FinishType.Break);
    } catch (error) {
      console.error('error', error);
      showToast("音乐播放出错!");
    }
  }
}