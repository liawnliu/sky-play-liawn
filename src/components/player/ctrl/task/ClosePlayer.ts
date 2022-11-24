import Player from "@/components/player";
import { showToast } from "toast";
import ActionDataModel, { PlayTask } from "../../model/ActionDataModel";
import ActionPlayerCtrl from "../ActionPlayerCtrl";
import BasicTask, { TaskStatus } from "./BasicTask";

export default class ClosePlayer extends BasicTask {
  constructor() {
    super(PlayTask.CLOSE_PLAYER)
  }
  public async run() {
    this.status = TaskStatus.Running;
    // 注释的原因：在this._play中检查到已经添加到PlayStop任务了，就会break打断弹奏，并将PlayStatus置为STOP
    // ActionDataModel.I.playStatus = PlayStatus.STOP;
    // 更新StartPlay里的播放状态的图标
    Player.I.switchPlayIcon(ActionDataModel.I.playStatus);
    showToast('播放器关闭');
    // 保存状态到本地
    await ActionDataModel.I.saveData();
    this.status = TaskStatus.Stop;
    ActionPlayerCtrl.destroy();
    ActionDataModel.destroy();
    Player.I.closeWindow();
  }
}