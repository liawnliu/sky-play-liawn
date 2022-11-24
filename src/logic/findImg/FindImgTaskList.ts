import { IMG_POWER } from '@/config/params';
import FindImgTask, { FindImgTaskMode } from '@/logic/findImg/FindImgTask';

enum TaskRunStatus {
  INIT = 'INIT',
  RUNNING = 'RUNNING'
}
export enum RunDirection {
  FORWARD = 'FORWARD', // 向前执行（从索引0开，每次索引自增）
  BACKWARD = 'BACKWARD' // 向前执行（从索引length-1开，每次索引自减）
}
/**
 * 这里我就不抽象一个TaskList，直接写FindImgTaskList了。
 * FindImgTaskList是一个任务链，只有每个子任务成功执行，它才算成功
 * 核心：每次只添加一个任务就开始执行，执行结果为“成功”那么就是达成目的，比如要让一个业务层次很深的
 * 页面打开，如果目前页面刚好是这个页面那就只需一个任务就能完成，如果目前页面处于目标页面的上一个层级
 * 那么就需要两个任务才能完成整个任务链，以此类推。
 * 在任务链执行完，要将每个任务的相关信息存储起来，下次只要识别到当前页面，并能匹配到以前的存储的信息
 * 就可以快速执行（跳过一些细节）。比如，一个任务链有5个任务，这次执行完整个任务链，下次再进入，先获取
 * 截图，匹配是哪个任务链里的那个任务节点的，就可以直接从这个节点开始并直接拿上次的坐标信息进行点击。
 * 
 */
export default class FindImgTaskList<T extends FindImgTask> {
  // 任务仓库
  private _taskList: Array<T> = [];
  // 目前整体任务执行的状态
  private _runStatus: TaskRunStatus = TaskRunStatus.INIT;
  constructor() { }
  // 添加一些任务
  public addSomeTask(tasks: Array<T>) {
    if (tasks == null || !tasks.length) {
      console.error('新添加的任务为空，添加无效')
      return;
    }
    if (this._runStatus === TaskRunStatus.RUNNING) {
      console.error('当前有任务链正在执行中，无法添加')
      return;
    }
    this._taskList = this._taskList.concat(tasks);
  }
  // 从任务链的某个节点开始往前执行
  public async runAllTask(targetIndex: number = 0) {
    try {
      if (this._runStatus == TaskRunStatus.RUNNING) throw new Error('当前有任务链正在执行中，请勿重复执行')
      if (!this._taskList.length) throw new Error('请至少添加一个任务后再执行')
      if (targetIndex < 0 || targetIndex >= this._taskList.length) throw new Error('请确认targetIndex入参是否有效的再执行')
      // 执行状态
      this._runStatus = TaskRunStatus.RUNNING;
      // 先向前执行
      const runForwardRlt = await this._runForward(targetIndex);
      if (runForwardRlt == null) {
        console.log('没有找到任何目标');
        return false
      }
      if (runForwardRlt === targetIndex) {
        console.log('运气不错，目前就在弹奏界面，无需再截图找图了');
        return true
      };
      // 再向后执行
      const runBackwardRlt = await this._runBackward(runForwardRlt);
      console.log('targetIndex runBackwardRlt', targetIndex, runBackwardRlt);
      if (runBackwardRlt && runBackwardRlt !== targetIndex) {
        console.log('截图找图也打不开弹奏界面');
        return false
      }

      return true;
    } catch ({ message }) {
      console.error(message)
      return false
    } finally {
      this._runStatus = TaskRunStatus.INIT;
    }
  }
  // 向前执行，做一种“赌”，我赌目前的页面就是我想要的，那么就不用再向后执行，比较差的情况就是目前页面是顶级入口，需要一层一层向后执行
  private async _runForward(index: number) {
    let point, screenCapture;
    for (let i = index; i < this._taskList.length; i++) {
      const task = this._taskList[i];
      task.setRunMode(FindImgTaskMode.ONLY_FIND_IMG);
      // 第一个任务要是没拿到point，就至少把screenCapture拿到，screenCapture会给后面的任务用（赌目前页面至少能有一个target是能被找到的，就看是哪一个了）
      if (i === index) {
        point = await task.runTask(); // 先执行，执行后就能拿到screenCapture给后面的用
        screenCapture = task.getScreenCapture();
      } else {
        task.setScreenCapture(screenCapture); // 后面每一个任务都用第一个任务的screenCapture（每次都赌当前页面screenCapture）
        point = await task.runTask();
      }
      if (screenCapture == null) return // 第一次截图都没有拿到，那证明没有截图权限，必要再走下去了
      if (point) { // 找到坐标证明找到小图了
        task.setPoint(point); // 这个坐标可能在“向后执行”的第一个任务用到
        console.log('_runForward point', point);
        return i; // 记录索引值，后面会与入参index进行比较，如果相同那就直接达到终极目标了。如果不同就把targetIndex作为“向后执行”的入参index
      }
    }
  }
  // 向后执行，从最顶（外）层执行到内层业务页面去
  private async _runBackward(index: number) {
    let point;
    // for循环跑完就能达到终极目标了
    for (let i = index; i >= 0; i--) {
      const task = this._taskList[i];
      task.setScreenCapture(); // 从顶层往里层执行，需要每次重新截图，那么这里将screenCapture重置为undefined
      if (i === index) { // 第一个任务，因为“向前执行”阶段中已经拿到了point并存在了这个任务中，直接点击即可
        task.setRunMode(FindImgTaskMode.ONLY_CLICK); // 在“向后执行”的阶段，索引为index的任务肯定是有point的，直接点击就行了
      } else {
        task.setRunMode(FindImgTaskMode.FIND_IMG_AND_CLICK);
      }
      point = await task.runTask();
      if (point == null) {
        return i;
      }
    }
  }
  public clearAllTask() {
    this._taskList = [];
  }
}
