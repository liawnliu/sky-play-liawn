import Player from "@/components/player";
import { showToast } from "toast";
import ActionDataModel, { PlayTask, PlayStatus, FinishType } from "../../model/ActionDataModel";
import ActionPlayerCtrl from "../ActionPlayerCtrl";
import BasicTask, { TaskStatus } from "./BasicTask";

export default class PlayPause extends BasicTask {
  constructor() {
    super(PlayTask.PLAY_PAUSE)
  }
  public async run() {
    // 任务状态置为Running
    this.status = TaskStatus.Running;
    // 播放状态置为PAUSE
    ActionDataModel.I.playStatus = PlayStatus.PAUSE;
    // 更新StartPlay里的播放状态的图标
    Player.I.switchPlayIcon(ActionDataModel.I.playStatus);
    showToast('暂停播放');
    // 任务状态置为Stop
    this.status = TaskStatus.Stop;
    // 任务完成后尝试执行下一个任务
    ActionPlayerCtrl.I.afterFinsh(FinishType.TaskFinsh);
  }
}