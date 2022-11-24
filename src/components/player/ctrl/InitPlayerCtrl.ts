import { DATA_STORE_NAME, DATA_STORE_POINTS, MUSIC_DIR_PATH } from "@/config/params";
import { accessibility, Point, press } from "accessibility";
import { createDatastore } from "datastore";
import { showToast } from "toast";
import InitDataModel from "../model/InitDataModel";
import { readdir, readFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { extname } from 'path';
import Settings from "@/components/Settings";
import { checkAccess } from "shell";
import { createRootAutomator2 } from "root_automator";

const datastore = createDatastore(DATA_STORE_NAME);

/** 和播放有关的初始化的东西，InitPlayerCtrl和InitDataModel不用单例的原因是，它无需考虑销毁的情况，只考虑变更的情况 */
export default class InitPlayerCtrl {
  /* 检查15个弹奏坐标是否已经设置好了 */
  public static async checkPonits() {
    try {
      if (InitDataModel.getPointsLength() === 15) return true;
      const hasPoints = await datastore.contains(DATA_STORE_POINTS);
      if (!hasPoints) {
        showToast('请在“设置”中设置好15个弹奏坐标!');
        return false;
      }
      const points: Point[] | undefined = await datastore.get(DATA_STORE_POINTS)
      if (points == null || points.length < 15) {
        showToast('15个弹奏坐标数据异常，请在“设置”中重新设置！');
        return false;
      }
      InitDataModel.setPoints(points)
      console.log('checkPonits 15个弹奏坐标 PlayMusic.points', JSON.stringify(points));
      return true;
    } catch (error) {
      showToast('checkPonits异常，请联系管理员！');
      console.error(error);
    }
  }
  /* 检查是否有音乐信息，系统至少自带一首 */
  public static async checkMusicList() {
    try {
      if (InitDataModel.getMusicListLength()) return true;
      const files = await readdir(MUSIC_DIR_PATH);
      for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const filePath = MUSIC_DIR_PATH + fileName;
        // 是.json文件
        if(statSync(filePath).isFile() && extname(fileName) === '.json'){
          const data = await readFile(filePath, 'utf8');
          InitDataModel.addMusic({
            name: fileName.replace('.json', ''),
            data: JSON.parse(data)
          });
        }
      }
      return !!InitDataModel.getMusicListLength();
    } catch (error) {
      showToast('checkMusicList异常，请联系管理员！');
      console.error(error);
    }
  }
  public static async checkAuth() {
    try {
      if (Settings.settings && Settings.settings.adbMode) {
        const hasAdb = await checkAccess("adb");
        console.log('hasAdb', hasAdb);
        if (hasAdb) {
          InitDataModel.automator = await createRootAutomator2({ adb: true });
          return true
        }
        showToast('请给本应用赋予ADB权限');
      } else if (accessibility && accessibility.enabled) {
        InitDataModel.automator = { press };
        return true
      } else {
        showToast('请给本应用赋予无障碍权限');
      }
      return false
    } catch (error) {
      showToast('checkAuth异常，请联系管理员！');
      console.error(error);
    }
  }
}