import {
  FloatingWindow,
  createWindow,
  FLAG_NOT_TOUCHABLE, // FLAG_NOT_TOUCHABLE会让窗口不可触摸
  FLAG_NOT_FOCUSABLE, // FLAG_NOT_FOCUSABLE会让窗口不可获得焦点
  FLAG_LAYOUT_NO_LIMITS, // FLAG_LAYOUT_NO_LIMITS会让窗口可超出显示区域
} from "floating_window";
import engines from 'engines';
import { SELECT_FUNC_WIDTH, SELECT_FUNC_HEIGHT, SELECT_FUNC_POSITION, SELECT_FUNC_PARAMS, ADB_CAPTURE_SAVE } from '@/config/params'
import SavePoints from "@/components/SavePoints";
import Player from "@/components/player";
import { showToast } from "toast";
import InitPlayerCtrl from "./player/ctrl/InitPlayerCtrl";

type FuncItem = {
  id: string,
  name: string
}

export default class SelectFunc {
  // 单例模式
  private static _instance: SelectFunc | null;
  private _window: FloatingWindow;
  private _list: Array<FuncItem>;
  private _currItem: number = -1;
  public static get I(): SelectFunc {
    return this._instance
      ? this._instance
      : (this._instance = new SelectFunc());
  }
  public get window(): FloatingWindow {
    return this._window;
  }
  private constructor() {
    this._list = SELECT_FUNC_PARAMS || [];
    let text = '';
    this._list.forEach(({ id, name}) => {
      text += `<button id="btn-${id}" w="auto" h="auto" bg="#DCDCDC">${name}</button>`
    });
    // 生成悬浮窗
    this._window = createWindow();
    // 使用xml渲染悬浮窗里的内容
    this._window.setViewFromXml(`
      <frame gravity="center" id="frameId" bg="#F0FFFF">
          <vertical w="*" h="*" gravity="center">
            ${text}
          </vertical>
      </frame>`);
    this._list.forEach(({ id, name}, key) => {
      this._window.view.findView(`btn-${id}`).on("click", () => {
          console.log(`${name}被点击了`);
          this._currItem = key;
          this.closeWindow();
      });
    });
    // 用removeFlags去掉悬浮窗一些自带的标识，为了让图标可触摸、可获取焦点、在可视范围内
    this._window.removeFlags(
      FLAG_NOT_TOUCHABLE | FLAG_NOT_FOCUSABLE | FLAG_LAYOUT_NO_LIMITS
    );
  }
  public async showWindow() {
    // 设置大小
    await this._window.setSize(SELECT_FUNC_WIDTH, SELECT_FUNC_HEIGHT);
    // 让悬浮窗显示
    await this._window.show();
    // 设置悬浮窗位置
    await this._window.setPosition(SELECT_FUNC_POSITION.x, SELECT_FUNC_POSITION.y);
  }
  // 本来想用visible等来控制显示隐藏，到目前版本好像没有这些属性，并且考虑到这个界面用得不是特别频繁，就直接close销毁
  public async closeWindow(onlyClose: boolean = false) {
    if (!onlyClose) {
      this._runFunc();
    }
    if (SelectFunc._instance == null) return;
    await this._window.close();
    SelectFunc._instance = null;
  }
  public changeCurrItem(index: number) {
    if (index === this._currItem) return;
    this._currItem = index;
    const view = this._window.view
    this._list?.forEach((item, key) => {
      if (key === index) {
        view.findView(`btn-${key+1}`).attr('bg', '#1E90FF');
      } else {
        view.findView(`btn-${key+1}`).attr('bg', '#DCDCDC');
      }
    })
  }
  private async _runFunc() {
    if (this._currItem === -1) return
    switch (this._currItem) {
      case 0: // 快速开始
        // 检查无障碍或者ADB权限
        if (!await InitPlayerCtrl.checkAuth()) return
        const hasPoints = await InitPlayerCtrl.checkPonits();
        if (!hasPoints) {
          showToast('请先在设置中设置好15个坐标!')
        } else if (Player.hasInstance()) {
          showToast('已经打开播放器了，不要再重复打开了!')
        } else {
          await Player.I.init();
        }
        break;
      case 1: // 设置（暂时是“收集坐标”）
        if (Player.hasInstance()) {
          showToast('请先关闭播放器!')
        } else {
          await SavePoints.I.init();
        }
        break;
      case 2: // 退出
        // 退出时如果弹奏界面存在，就保存一下当前播放信息，其他界面的信息暂时没有保存的必要
        if (Player.hasInstance()) {
          // 如果没有这个if，StartPlay不存在的情况下这里还要生成一个实例才去调用closeWindow就显得很没必要了
          await Player.I.closeWindow();
        }
        // 强制结束脚本
        engines.stopAll();
        break;
    }
  }
}
