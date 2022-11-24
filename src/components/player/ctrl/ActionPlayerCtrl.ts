import { delay } from "lang";
import Player from "..";
import ActionDataModel, { FinishType, PlayStatus, PlayTask } from "../model/ActionDataModel";
import { MusicNote } from "../model/InitDataModel";
import BasicTask, { TaskStatus } from "./task/BasicTask";
import ClosePlayer from "./task/ClosePlayer";
import PlayBack from "./task/PlayBack";
import PlayNext from "./task/PlayNext";
import PlayPause from "./task/PlayPause";
import PlayStart from "./task/PlayStart";
import PlayStop from "./task/PlayStop";
import SelectMusic from "./task/SelectMusic";
import SwitchPlayPattern from "./task/SwitchPlayPattern";

export default class ActionPlayerCtrl {
  private static _instance: ActionPlayerCtrl | null;
  public static get I(): ActionPlayerCtrl {
    return this._instance ? this._instance : (this._instance = new ActionPlayerCtrl())
  }
  constructor() {}
  public async init() {
    await ActionDataModel.I.getData();
    Player.I.switchPatternIcon(ActionDataModel.I.playPattern);
  }
  /** 添加新任务，然后试图运行 */
  public addTask(taskName: PlayTask | undefined = undefined, musicIndex: number = 0) {
    let task: BasicTask;
    switch (taskName) {
      case PlayTask.SELECT_MUSIC:
        task = new SelectMusic()
        break;
      case PlayTask.SWITCH_PLAY_PATTERN:
        task = new SwitchPlayPattern()
        break;
      case PlayTask.PLAY_BACK:
        task = new PlayBack()
        break;
      case PlayTask.PLAY_START:
        task = new PlayStart(musicIndex)
        break;
      case PlayTask.PLAY_PAUSE:
        task = new PlayPause()
        break;
      case PlayTask.PLAY_NEXT:
        task = new PlayNext()
        break;
      case PlayTask.PLAY_STOP:
        task = new PlayStop()
        break;
      case PlayTask.CLOSE_PLAYER:
        task = new ClosePlayer()
        break;
      default:
        // 正在播放的状态，那么点击“播放/暂停”按钮，就表示要暂停
        if (ActionDataModel.I.playStatus === PlayStatus.START) {
          task = new PlayPause()
        } else {
          // 暂停或者停止状态，那么点击“播放/暂停”按钮，就表示要开始播放
          task = new PlayStart()
        }
        break;
    }
    ActionDataModel.I.addTask(task)
    // 添加任务后视图去执行任务，如果有任务在执行中就暂时不要执行了
    this.tryToRun();
  }
  public tryToRun(force: boolean = false) {
    // 强制执行，一般是正在播放的情况下点击了下一曲等按钮
    const taskOne: BasicTask | undefined = ActionDataModel.I.getTaskByIndex(0);
    if (force) {
      const taskTwo: BasicTask | undefined = ActionDataModel.I.getTaskByIndex(1);
      // 第一个任务正在运行（正在弹奏），并且它下一个任务是“关闭播放器、上一曲、下一曲、暂停、停止”任何一个，都需要将第一个任务break掉
      if (taskOne && taskTwo && taskOne.status === TaskStatus.Running && taskTwo.status === TaskStatus.Stop) {
        // 第二项任务是“打开选择音乐弹窗”或者“切换播放模式”，那么就暂时在第一个任务的“间隙处”执行第二个任务
        if (taskTwo.type === PlayTask.SWITCH_PLAY_PATTERN || taskTwo.type === PlayTask.SELECT_MUSIC) {
          taskTwo.run();
        } else {
          // 第二项任务是“关闭播放器、上一曲、下一曲、暂停、停止”任何一个都需要break掉第一个任务
          if (taskTwo.type === PlayTask.PLAY_PAUSE) {
            return PlayStatus.PAUSE; // 只有暂停稍微特殊（要记录progress，可能还需要progress来开始的）
          } else {
            return PlayStatus.STOP; // 其他基本都是属于停止的范畴（要么直接停止，要么先停止再执行其他）
          }
        }
      }
    } else if (taskOne && taskOne.status === TaskStatus.Stop) { // 非强制执行，一般是暂停状态下点击其他按钮
      // 取头部第一个任务开始执行（第一个都是Stop状态，那么整个taskList肯定还是停止的状态，那么直接执行第一个任务）
      taskOne.run();
    }
  }
  public afterFinsh(finishType: FinishType) {
    // 正常弹奏完的，就自然地下一曲
    if (finishType === FinishType.PlayFinsh) {
      // 移除已经完成的任务（弹奏肯定是第一个任务，那么直接移除头部也就是第一个任务即可）
      ActionDataModel.I.removeTask();
      // 下一曲
      ActionDataModel.I.addTask(new PlayNext())
    } else if (finishType === FinishType.Break) { // 弹奏被打断，就可以进行下一个任务的执行
      // 移除已经完成的任务（弹奏肯定是第一个任务，那么直接移除头部也就是第一个任务即可）
      ActionDataModel.I.removeTask();
    } else {
      // 任务执行完了要移除，但是我们不知道这个任务在哪里，需要找到它
      for (let i = 0; i < ActionDataModel.I.getTaskLength(); i++) {
        const task = ActionDataModel.I.getTaskByIndex(i);
        // 前面的任务正在执行，那么就移除后面的项。
        // 比如第一项任务正在弹奏，第二项任务是“打开选择音乐弹窗”或者“切换播放模式”，那么就可以在第二项任务执行完时移除它
        if (task?.status === TaskStatus.Stop) {
          ActionDataModel.I.removeTaskByIndex(i)
          // 只移除一个，后面的还没有执行状态还是STOP（其实TaskStatus应该设置三个状态的，未执行，执行中，已执行）
          break;
        }
      }
    }
    this.tryToRun();
  }
  // 进度条的最大值
  public setSeekBarMax(max: number) {
    Player.I.window.view.findView("seekBar").setMax(max);
  }
  // 更新进度条以及右边的时间显示
  public updateSeekBarProgress(progress: number, time: number) {
    Player.I.window.view.findView("seekBar").setProgress(progress);
    this.updateSeekBarText(time)
  }
  public updateSeekBarText(time: number) {
    const t = Math.ceil(time / 1000);
    const m = Math.floor(t / 60)
    const s = t - m * 60;
    const mText = m < 10 ? `0${m}` : `${m}`;
    const sText = s < 10 ? `0${s}` : `${s}`;
    const timeText = `${mText}:${sText}`;
    Player.I.window.view.findView("seekBarText").attr("text", timeText);
  }
  public async checkSeekBarAction() {
    while(ActionDataModel.I.seekBarAction) {
      console.log('等待');
      await delay(10);
    }
    if (ActionDataModel.I.tempProgress != null) {
      // 减一的原因是checkSeekBarAction在for循环的末尾进行的，之后会走“i++”的逻辑
      const index = ActionDataModel.I.tempProgress - 1; 
      const note = ActionDataModel.I.getSongNoteByIndex(index);
      if (note == null) return;
      ActionDataModel.I.tempProgress = null;
      return {
        lastTime: note.time,
        index
      }
    }
  }
  public static destroy() {
    this._instance = null;
  }
}