import { device } from "device";
import { FloatingWindow, createWindow } from "floating_window";
import { showToast } from 'toast';
import { DATA_STORE_NAME, DATA_STORE_POINTS } from '@/config/params';
import { createDatastore } from 'datastore';

const datastore = createDatastore(DATA_STORE_NAME);

type PointType = {
  x: number,
  y: number
}

export default class SavePoints {
  // 单例模式
  private static _instance: SavePoints | null;
  private _window: FloatingWindow;
  private _points: Array<PointType> = [];
  public static get I(): SavePoints {
    return this._instance
      ? this._instance
      : (this._instance = new SavePoints());
  }
  public get window(): FloatingWindow {
    return this._window;
  }
  private constructor() {
    // 生成悬浮窗
    this._window = createWindow();
    // 使用xml渲染悬浮窗里的内容，gravity是决定它内部子元素的排列方式，layout_gravity是决定自己在父级内部的排列方式
    this._window.setViewFromXml(`
        <frame id="outer">
          <text text="共15个键：当前要设置的是第1个。点完15个位置会自动关闭本页面！" id="text" layout_gravity="top" gravity="center" textColor="#1E90FF" textSize="20" w="*" h="auto" />
          <horizontal layout_gravity="bottom" gravity="center" w="*" h="auto">
            <button id="close" w="auto" h="auto">关闭</button>
            <button id="again" w="auto" h="auto">清空重试</button>
            <button id="lastStep" w="auto" h="auto">退一步</button>
          </horizontal>
        </frame>`);
    // 关闭按钮
    this._window.view.findView('close').on("click", () => {
        showToast('这个关闭并不会保存数据！');
        this._window.close();
        SavePoints._instance = null;
    });
    // 清空重试按钮
    this._window.view.findView('again').on("click", () => {
      this._points = [];
      this._window.view.findView('text').attr('text', `共15个键：当前要设置的是第${this._points.length+1}个。点完15个位置会自动关闭本页面！`)
    });
    const view = this._window.view;
    // 退一步按钮
    view.findView('lastStep').on("click", () => {
      if (this._points.length === 0) {
        showToast('数据已经一个不剩了！');
        return;
      }
      this._points.pop();
      view.findView('text').attr('text', `共15个键：当前要设置的是第${this._points.length+1}个。点完15个位置会自动关闭本页面！`)
    });
    // 收集坐标
    view.findView('outer').on("touch", (e: any) => {
        console.log('touch触摸触摸触摸触摸触摸', e.getRawX(), e.getRawY());
        this._addPoint(e.getRawX(), e.getRawY());
    });
  }
  public async init() {
    // 让悬浮窗显示
    await this._window.show();
    await this._window.setSize(device.screenHeight, device.screenWidth);
    // 设置悬浮窗位置
    await this._window.setPosition(0, 0);
  }
  private async _addPoint(x: number, y: number) {
    this._points.push({x, y});
    if (this._points.length === 15) {
      await datastore.set(DATA_STORE_POINTS, this._points)
      this._window.close();
      SavePoints._instance = null;
    } else {
      this._window.view.findView('text').attr('text', `共15个键：当前要设置的是第${this._points.length+1}个。点完15个位置会自动关闭本页面！`)
    }
  }
}