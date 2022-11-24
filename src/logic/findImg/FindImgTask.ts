import Settings from '@/components/Settings';
import { ADB_CAPTURE_SAVE } from '@/config/params';
import { Point2 } from '@autojs/opencv';
import { click } from 'accessibility';
import { findImage, FindImageOptions, Image, readImage } from 'image';
import { delay } from 'lang';
import { requestScreenCapture } from 'media_projection';
import { RootAutomator2 } from 'root_automator';
import { createShell } from "shell";
import { unlink } from 'node:fs/promises'

const shell = createShell({ adb: true });

export enum FindImgTaskMode {
  ONLY_CLICK = 'ONLY_CLICK',                            // 已经有图的坐标了，只需要点击和延时即可
  ONLY_FIND_IMG = 'ONLY_FIND_IMG',                      // 只找图，并返回图个坐标
  FIND_IMG_AND_CLICK = 'FIND_IMG_AND_CLICK'             // 找到图，并点击它
}
export type FindImgTaskParams = {
  target: string,
  delayTime?: number,
  needClick?: boolean,
  automator?: RootAutomator2,
  findImageOpt?: FindImageOptions,
  spare?: Point2
}

export default class FindImgTask {
  private _runMode: FindImgTaskMode = FindImgTaskMode.ONLY_FIND_IMG;
  private _target: string;                              // 要找的目标图
  private _screenCapture: Image | undefined;            // 要在哪个截图源信息上找目标图
  private _needClick: boolean | undefined;              // 找图完毕后需要点击吗
  private _delayTime: number | undefined;               // 点击完延迟多久执行下一步
  private _point: Point2 | undefined;                   // 找到了，目标图的坐标
  private _automator: RootAutomator2 | undefined;       // adb的点击按压等
  private _findImageOpt: FindImageOptions | undefined;  // 找图选项
  private _spare: Point2 | undefined;                   // 如果图没有找到，那么人为设置它的备用点击位置（一般用于顶级入口）
  constructor(params: FindImgTaskParams) {
    this._target = params.target;
    this._delayTime = params.delayTime;
    this._needClick = params.needClick;
    this._automator = params.automator;
    this._findImageOpt = params.findImageOpt
    this._spare = params.spare
  }
  public setRunMode(runMode: FindImgTaskMode) {
    this._runMode = runMode;
  }
  public getScreenCapture(): Image | undefined {
    return this._screenCapture;
  }
  public async setScreenCapture(screenCapture: Image | undefined = undefined) {
    if (screenCapture == undefined) {
      this._screenCapture?.recycle();
      // await unlink(ADB_CAPTURE_SAVE)
    }
    this._screenCapture = screenCapture;
  }
  public setPoint(point: Point2) {
    this._point = point;
  }
  // 执行这个任务
  public async runTask() {
    try {
      switch(this._runMode) {
        case FindImgTaskMode.ONLY_CLICK:
          // 有了坐标直接点击
          await this._clickByPoint(this._point, this._delayTime, this._needClick);
          return this._point;
        case FindImgTaskMode.ONLY_FIND_IMG:
          // 截图并寻图
          return this._screenCaptureAndFindImg(this._target, this._screenCapture);
        case FindImgTaskMode.FIND_IMG_AND_CLICK:
          // 截图、寻图、点图
          const point = await this._screenCaptureAndFindImg(this._target, this._screenCapture);
          await this._clickByPoint(point, this._delayTime, this._needClick);
          return point;
      }
    } catch (error) {
      console.error(error)
    }
  }
  private async _screenCaptureAndFindImg(target: string, screenCapture: Image | undefined): Promise<Point2 | undefined> {
    try {
      // 先看有没有截图可用
      if (screenCapture == null) {
        // 没有就去截图
        screenCapture = await this._toScreenCapture();
        // 还没有就直接返回
        if (screenCapture == null) return;
      }
      // 有的话就去寻找target，找到就返回坐标
      let point = await this._findImg(target, screenCapture);
      // 如果没有找到图，再看有没有备用的（人为设置的）
      if (point == null && this._spare) {
        point = this._spare
        console.log('找不到图，已经用备用方案替代', target);
      }
      return point ? point : undefined;
    } catch (error) {
      console.error(error);
    }
  }
  // 进行一次截图
  private async _toScreenCapture(): Promise<Image | undefined> {
    try {
      let screenCapture
      // 进行截图
      if (Settings.settings && Settings.settings.adbMode) {
        await shell.submit(`screencap ${ADB_CAPTURE_SAVE}`);
        await delay(2000) // 让截图尽可能已经保存了
        screenCapture = await readImage(ADB_CAPTURE_SAVE);
      } else {
        // 请求截图的权限
        const capturer = await requestScreenCapture();
        screenCapture = await capturer.nextImage();
      }
      if (!screenCapture) throw new Error("没有截到图");
      // 保存一下
      this._screenCapture = screenCapture;
      // 可能后面的任务会用到
      return screenCapture;
    } catch (error) {
      console.error(error);
    }
  }
  // 在截图中寻找小图target
  private async _findImg(target: string, screenCapture: Image): Promise<Point2 | null> {
    try {
      // 拿取小图
      const targetImg = await readImage(target);
      // console.log('_findImg targetImg screenCapture', targetImg, screenCapture);
      // 开始找图，将图片相似度调到0.7
      const point = await findImage(screenCapture, targetImg, { threshold: 0.7 });
      console.log('_findImg point', point, this._target);
      return point;
    } catch (error) {
      console.error(error)
      return null;
    }
  }
  // 点击某个图
  private async _clickByPoint(point: Point2 | undefined, delayTime: number = 0, needClick: boolean = true) {
    try {
      if (!needClick) return
      if (!point) return
      // 点击找到的这个小图
      if (this._automator) {
        await this._automator.tap(point.x, point.y)
      } else {
        await click(point.x, point.y);
      }
      
      // 点击后，页面会变化，等待一段时间再进行下一步
      if (delayTime) {
        await delay(delayTime)
      }
    } catch (error) {
      console.error(error);
    }
  }
}