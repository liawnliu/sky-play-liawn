import ActionDataModel, { FinishType, PlayTask } from "../../model/ActionDataModel";
import ActionPlayerCtrl from "../ActionPlayerCtrl";
import BasicTask, { TaskStatus } from "./BasicTask";
import SelectMusicWin from '../../SelectMusicWin'

export default class SelectMusic extends BasicTask {
  constructor() {
    super(PlayTask.SELECT_MUSIC)
  }
  public async run() {
    // 任务状态置为Running
    this.status = TaskStatus.Running;
    const isSelect = ActionDataModel.I.selectMusic;
    if (isSelect) {
      ActionDataModel.I.selectMusic = false;
      await SelectMusicWin.I.hideWindow();
    } else {
      ActionDataModel.I.selectMusic = true;
      await SelectMusicWin.I.showWindow();
    }
    // 任务状态置为Stop
    this.status = TaskStatus.Stop;
    // 任务完成后尝试执行下一个任务
    ActionPlayerCtrl.I.afterFinsh(FinishType.TaskFinsh);
  }
}