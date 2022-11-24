import Player from "@/components/player";
import { showToast } from "toast";
import ActionDataModel, { PlayTask, PlayPattern, FinishType } from "../../model/ActionDataModel";
import ActionPlayerCtrl from "../ActionPlayerCtrl";
import BasicTask, { TaskStatus } from "./BasicTask";

export default class SwitchPlayPattern extends BasicTask {
  constructor() {
    super(PlayTask.SWITCH_PLAY_PATTERN)
  }
  public run(): void {
    // 任务状态置为Running
    this.status = TaskStatus.Running;
    // 更改播放模式
    switch (ActionDataModel.I.playPattern) {
      // 如果之前是列表循环，那么现在应该是单曲循环
      case PlayPattern.LIST_REPEAT:
        ActionDataModel.I.playPattern = PlayPattern.ONE_REPEAT;
        // 单曲循环时不需要使用RandomMusicList
        ActionDataModel.I.clearRandomMusicList();
        showToast('单曲循环');
        break;
      // 如果之前是单曲循环，那么现在应该是随机循环
      case PlayPattern.ONE_REPEAT:
        ActionDataModel.I.playPattern = PlayPattern.RANDOM_PLAY;
        showToast('随机循环');
        break;
      // 如果之前是随机循环，那么现在应该是列表循环
      case PlayPattern.RANDOM_PLAY:
        ActionDataModel.I.playPattern = PlayPattern.LIST_REPEAT;
        // 单曲循环时不需要使用RandomMusicList
        ActionDataModel.I.clearRandomMusicList();
        showToast('列表循环');
        break;
    }
    // 更新StartPlay里的播放模式的图标
    Player.I.switchPatternIcon(ActionDataModel.I.playPattern);
    // 任务状态置为Stop
    this.status = TaskStatus.Stop;
    // 任务完成后尝试执行下一个任务
    ActionPlayerCtrl.I.afterFinsh(FinishType.TaskFinsh);
  }
}