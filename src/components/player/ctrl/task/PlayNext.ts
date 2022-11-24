import Player from "@/components/player";
import { showToast } from "toast";
import ActionDataModel, { PlayPattern, PlayStatus, PlayTask } from "../../model/ActionDataModel";
import BasicTask, { TaskStatus } from "./BasicTask";

export default class PlayNext extends BasicTask {
  constructor() {
    super(PlayTask.PLAY_NEXT)
  }
  public run() {
    // 任务状态置为Running
    this.status = TaskStatus.Running;
    // 播放新歌，那么currMusicProgress置为0
    ActionDataModel.I.currMusicProgress = 0;
    // 播放状态置为START
    ActionDataModel.I.playStatus = PlayStatus.START
    // 播放下一曲的准备工作（给_currMusicIndex赋予新值）
    if (ActionDataModel.I.playPattern === PlayPattern.LIST_REPEAT) {
      // 如果是列表循环下的“下一曲”，就让currIndex加一
      ActionDataModel.I.addCurrMusicIndex();
    } else if (ActionDataModel.I.playPattern === PlayPattern.RANDOM_PLAY) {
      // 随机循环就优先取_randomMusicList里的，不行就随机下一曲
      ActionDataModel.I.nextOrBackAtRandomPattern()
    } // 单曲循环就开始放之前的那首歌，不处理currIndex
    // 更新StartPlay里的播放状态的图标
    Player.I.switchPlayIcon(ActionDataModel.I.playStatus);
    showToast(`下一曲${ActionDataModel.I.currMusicName ? ': ' + ActionDataModel.I.currMusicName : ''}`);
    // 开始播放，播放完会将任务状态置为Stop并且会调用afterFinsh
    this._play();
  }
}