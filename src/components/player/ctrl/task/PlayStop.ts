import Player from "@/components/player";
import { showToast } from "toast";
import ActionDataModel, { FinishType, PlayStatus, PlayTask } from "../../model/ActionDataModel";
import ActionPlayerCtrl from "../ActionPlayerCtrl";
import BasicTask, { TaskStatus } from "./BasicTask";

export default class PlayStop extends BasicTask {
  constructor() {
    super(PlayTask.PLAY_STOP)
  }
  public async run() {
    // 任务状态置为Running
    this.status = TaskStatus.Running;
    // 播放状态置为STOP
    ActionDataModel.I.playStatus = PlayStatus.STOP;
    // 更新StartPlay里的播放状态的图标
    Player.I.switchPlayIcon(ActionDataModel.I.playStatus);
    showToast('停止播放');
    // 保存状态到本地
    // await ActionDataModel.I.saveData();
    // 当前播放信息重置
    ActionDataModel.I.currMusicName = '';
    ActionDataModel.I.currMusicIndex = 0;
    ActionDataModel.I.currMusicProgress = 0;
    // 任务状态置为Stop
    this.status = TaskStatus.Stop;
    // 任务完成后尝试执行下一个任务
    ActionPlayerCtrl.I.afterFinsh(FinishType.TaskFinsh);
  }
}