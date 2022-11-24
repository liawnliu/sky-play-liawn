import {
  FloatingWindow,
  createWindow,
  DragGesture,
  FLAG_NOT_TOUCHABLE, // FLAG_NOT_TOUCHABLE会让窗口不可触摸
  FLAG_NOT_FOCUSABLE, // FLAG_NOT_FOCUSABLE会让窗口不可获得焦点
  FLAG_LAYOUT_NO_LIMITS, // FLAG_LAYOUT_NO_LIMITS会让窗口可超出显示区域
} from "floating_window";
import { IMG_POSITION, IMG_WIDTH, IMG_HEIGHT, SELECT_FUNC_PARAMS, SELECT_FUNC_HEIGHT, SELECT_FUNC_POSITION } from '@/config/params'
import utils from "@/util/util";
import SelectFunc from "@/components/SelectFunc";
import ActionDataModel, { PlayStatus } from "./player/model/ActionDataModel";
enum OneClickOrTouchMove {
  Init = 'Init',
  OneClick = 'OneClick',
  TouchMove = 'TouchMove'
}

export default class IconBtn {
  // 单例模式
  private static _instance: IconBtn;
  private _window: FloatingWindow;
  private static _isOneClickOrTouchMove: OneClickOrTouchMove = OneClickOrTouchMove.Init;
  public static dragGesture: DragGesture;
  public static get I(): IconBtn {
    return this._instance
      ? this._instance
      : (this._instance = new IconBtn());
  }
  public get window(): FloatingWindow {
    return this._window;
  }
  private constructor() {
    // 生成悬浮窗
    this._window = createWindow();
    // 使用xml渲染悬浮窗里的内容
    this._window.setViewFromXml(`
        <frame gravity="center">
            <img
                id="iconId"
                w="${IMG_WIDTH}"
                h="${IMG_HEIGHT}"
                tint="#dd7694"
                src="https://webinput.nie.netease.com/img/sky/logo4.png"
            />
        </frame>`);
    // 用removeFlags去掉悬浮窗一些自带的标识，为了让图标可触摸、可获取焦点、在可视范围内
    this._window.removeFlags(
      FLAG_NOT_TOUCHABLE | FLAG_NOT_FOCUSABLE | FLAG_LAYOUT_NO_LIMITS
    );
  }
  public async init() {
    // 让悬浮窗显示
    await this._window.show();
    // 设置悬浮窗位置
    await this._window.setPosition(IMG_POSITION.x, IMG_POSITION.y);
    // 启动悬浮窗的拖拽功能
    IconBtn.dragGesture = this._window.enableDrag(this._window.view.findView("iconId"), {
      keepToEdge: true,
      onClick: () => {
        this._handleClick();
      },
    });
    this._initTouchData();
  }
  private _initTouchData() {
    const targetY = SELECT_FUNC_POSITION.y; // 基准值y，以SelectFunc的y为准
    const num = SELECT_FUNC_PARAMS.length; // 有几个功能选项
    const cellHeight = SELECT_FUNC_HEIGHT / num; // 算出每个选项的大致高度
    // utils.throttle对其节流，并多传了3个常用参数
    this._window.on("touch", utils.throttle(this._handleTouch, 100, { targetY, num, cellHeight}));
  }
  // 处理点击
  private _handleClick() {
    // 已经展开了就关闭
    if (IconBtn._isOneClickOrTouchMove === OneClickOrTouchMove.OneClick) {
      IconBtn._isOneClickOrTouchMove = OneClickOrTouchMove.Init;
      SelectFunc.I.closeWindow(true);
    } else { // 没有展开就让它展开
      IconBtn._isOneClickOrTouchMove = OneClickOrTouchMove.OneClick;
      SelectFunc.I.showWindow();
    }
  }
  // 处理拖拽
  private async _handleTouch(event: any, ...params: any) {
    if (ActionDataModel.I.playStatus === PlayStatus.START) return; // 正在弹奏就不让IconBtn进行触摸了
    // console.log("_handleTouch", event);
    const action = event.getActionMasked();
    console.log("_handleTouch action", action);
    const selectFuncInstance = SelectFunc.I;
    if (action === 2) { // 2 表示按住移动
      IconBtn._isOneClickOrTouchMove = OneClickOrTouchMove.TouchMove;
      const x = event.getRawX(); // 实际x坐标
      const y = event.getRawY(); // 实际x坐标
      console.log("_handleTouch x y", x, y);
      if (x >= SELECT_FUNC_POSITION.x) {
        // 显示出待选择的功能选择区
        await selectFuncInstance.showWindow();
        // 根据目前手指的y值判断应该让哪个功能被选中
        const { targetY, num, cellHeight } = params[0]
        let index = 0;
        if (y >= targetY) {
          index = Math.floor((y - targetY) / cellHeight)
        }
        index = index > (num - 1) ? (num - 1) : index;
        // 手指移动的Y坐标，决定在功能选择区里面选什么功能选项
        selectFuncInstance.changeCurrItem(index);
      } else {
        // 一项都不想项，直接关闭
        selectFuncInstance.closeWindow(true);
      }
    } else if (action === 1) { // 1 表示放手（包括点击也会走这里，只是点击少了TouchMove）
      // 是触摸再放手的，不是的话就是点击了（没经过TouchMove就认为是点击的情况）。
      if (IconBtn._isOneClickOrTouchMove === OneClickOrTouchMove.TouchMove) {
        // 选了一项，关闭时进到选的功能里面
        await selectFuncInstance.closeWindow();
        // 回到原来位置
        await IconBtn.I._window.setPosition(IMG_POSITION.x, IMG_POSITION.y)
      }
      // 还原状态
      IconBtn._isOneClickOrTouchMove = OneClickOrTouchMove.Init;
    }
  }
}
