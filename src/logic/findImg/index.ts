import Settings from "@/components/Settings";
import { IMG_MUSIC_NOTE, IMG_PIANO, IMG_POWER, CHECK_IMG_TIME, HOME_BTN_POSITION } from "@/config/params";
import { Point2 } from "@autojs/opencv";
import { createRootAutomator2 } from "root_automator";
import FindImgTask from "./FindImgTask";
import FindImgTaskList from "./FindImgTaskList";

/** 
 * 截图找图，智能打开弹奏键盘，目前只添加了三个任务，也就是在三个画面中找图
 * 第一个图：弹奏界面，这是最好的结果
 * 第二个图：背包打开了，钢琴按钮在界面上
 * 第三个图：什么都没有打开，只有顶部的能量按钮（背包入口，顶级入口）（并且只给这个图做了“找不到图”的备用方案——直接点击顶部）
 * 其他的：只做了三个任务，其他的情况暂时不管，如果要把所有的场景都适配会比较麻烦。所以还有很大的改进，目前比较耦合比较简单，
 * 可以做成多场景多任务的复杂自动化任务的，暂时不做了，那已经不属于本项目了，属于公共的一套自动化解决方案了。
 * 
  */
export default async function runFindImg() {
  let automator; // adb模式下的点击按压等
  if (Settings.settings?.adbMode) {
    automator = await createRootAutomator2({ adb: true })
  }
  const taskContainer = new FindImgTaskList();
  // 情况最差的数据准备好
  const tasks = [
    new FindImgTask({target: IMG_MUSIC_NOTE, delayTime: 0, needClick: false, automator}),
    new FindImgTask({target: IMG_PIANO, delayTime: CHECK_IMG_TIME, needClick: true, automator}),
    new FindImgTask({
      target: IMG_POWER,
      delayTime: CHECK_IMG_TIME,
      needClick: true,
      automator,
      spare: new Point2(HOME_BTN_POSITION.x, HOME_BTN_POSITION.y)
    })
  ];
  taskContainer.addSomeTask(tasks);
  const rlt = await taskContainer.runAllTask();
  taskContainer.clearAllTask();

  return rlt;
}
export async function checkMusicNoteBtn() {
  let automator; // adb模式下的点击按压等
  if (Settings.settings?.adbMode) {
    automator = await createRootAutomator2({ adb: true })
  }
  const taskContainer = new FindImgTaskList();
  // 情况最差的数据准备好
  const tasks = [
    new FindImgTask({target: IMG_MUSIC_NOTE, delayTime: 0, needClick: false, automator})
  ];
  taskContainer.addSomeTask(tasks);
  const rlt = await taskContainer.runAllTask();
  taskContainer.clearAllTask();

  return rlt;
}