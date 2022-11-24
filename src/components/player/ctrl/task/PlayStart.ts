import Settings from "@/components/Settings";
import Player from "@/components/player";
import runFindImg from "@/logic/FindImg";
import { showToast } from "toast";
import ActionDataModel, { PlayTask, PlayStatus } from "../../model/ActionDataModel";
import BasicTask, { TaskStatus } from "./BasicTask";

export default class PlayStart extends BasicTask {
  private _musicIndex: number | undefined;
  constructor(musicIndex: number | undefined = undefined) {
    super(PlayTask.PLAY_START)
    this._musicIndex = musicIndex;
  }
  public async run() {
    // 任务状态置为Running
    this.status = TaskStatus.Running;
    // _musicIndex存在的话，将目前的播放信息替换成musicIndex
    if (this._musicIndex != null) {
      ActionDataModel.I.currMusicIndex = this._musicIndex;
      ActionDataModel.I.currMusicProgress = 0;
    }
    // 播放状态置为START
    ActionDataModel.I.playStatus = PlayStatus.START;
    // 更新StartPlay里的播放状态的图标
    Player.I.switchPlayIcon(ActionDataModel.I.playStatus);
    showToast(`开始播放${ActionDataModel.I.currMusicName ? ': ' + ActionDataModel.I.currMusicName : ''}`);
    // 开始播放，播放完会将任务状态置为Stop并且会调用afterFinsh
    this._play();
  }
}