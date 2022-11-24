import { FloatingWindow, createWindow } from "floating_window";
import { createDatastore } from 'datastore';
import { SettingsType } from '@/components/Settings'
import {
  DATA_STORE_NAME,
  DATA_STORE_SETTINGS,
  START_PLAY_WIDTH,
  START_PLAY_HEIGHT,
  START_PLAY_POSITION,
  ICON_BACK,
  ICON_CLOSE,
  ICON_LIST_REPEAT,
  ICON_MUSIC_LIST,
  ICON_NEXT,
  ICON_ONE_REPEAT,
  ICON_PAUSE_CIRCLE,
  ICON_PLAY_CIRCLE,
  ICON_RANDOM_PLAY,
  ICON_STOP } from '@/config/params';

import ActionDataModel, { PlayPattern, PlayStatus, PlayTask } from './model/ActionDataModel';
import ActionPlayerCtrl from "./ctrl/ActionPlayerCtrl";
import SelectMusicWin from "./SelectMusicWin";
import InitDataModel from "./model/InitDataModel";
import { delay } from "lang";

const datastore = createDatastore(DATA_STORE_NAME);

/** StartPlay是一个纯粹的播放UI，控制播放行为、模式、数据读写等操作被剥离到src/logic/PlayCtrl.ts了 */
export default class Player {
  // 单例模式
  private static _instance: Player | null;
  private _window: FloatingWindow;
  // 退出程序的时候如果StartPlay的实例存在再去调用this._window.close()，如果实例直接不存在就完全没必要调用了
  public static hasInstance(): boolean {
    return this._instance ? true : false;
  }
  public static get I(): Player {
    return this._instance
      ? this._instance
      : (this._instance = new Player());
  }
  public get window(): FloatingWindow {
    return this._window;
  }
  public set window(param: any) {
    console.error('请不要对StartPlay的window设置新值');
  }
  private constructor() {
    // 生成悬浮窗
    this._window = createWindow();
    // 使用xml渲染悬浮窗里的内容
    this._window.setViewFromXml(`
      <frame bg="#B0C4DE" alpha="0.7">
        <vertical>
          <horizontal>
            <seekbar thumbTint="#ffffff" id="seekBar" h="14" margin="0" layout_weight="15"/>
            <text id="seekBarText" textSize="10sp" text="00:00" layout_weight="1" maxLines="1"></text>
          </horizontal>
          <horizontal>
            <img src="${ICON_MUSIC_LIST}" id="icon-select-music" w="38" h="38" margin="0 9" layout_weight="1" />
            <img src="${ICON_LIST_REPEAT}" id="icon-play-mode" w="35" h="35"  margin="0 10" layout_weight="1" />
            <img src="${ICON_BACK}" id="icon-back" w="35" h="35"  margin="0 10" layout_weight="1.5" />
            <img src="${ICON_PLAY_CIRCLE}" id="icon-play-status" w="50" h="50"  margin="0 2" layout_weight="2" />
            <img src="${ICON_NEXT}" id="icon-next" w="35" h="35"  margin="0 10" layout_weight="1.5" />
            <img src="${ICON_STOP}" id="icon-stop" w="30" h="30"  margin="0 12" layout_weight="1" />
            <img src="${ICON_CLOSE}" id="icon-close" w="35" h="35"  margin="0 10" layout_weight="2" />
          </horizontal>
        </vertical>
      </frame>
    `);
    const view = this._window.view;
    // 选择歌曲
    view.findView('icon-select-music').on("click", () => {
      ActionPlayerCtrl.I.addTask(PlayTask.SELECT_MUSIC);
    });
    // 切换播放模式
    view.findView('icon-play-mode').on("click", () => {
      ActionPlayerCtrl.I.addTask(PlayTask.SWITCH_PLAY_PATTERN);
    });
    // 播放上一曲
    view.findView('icon-back').on("click", () => {
      ActionPlayerCtrl.I.addTask(PlayTask.PLAY_BACK);
    });
    // 播放or暂停
    view.findView('icon-play-status').on("click", () => {
      ActionPlayerCtrl.I.addTask();
    });
    // 播放下一曲
    view.findView('icon-next').on("click", () => {
      ActionPlayerCtrl.I.addTask(PlayTask.PLAY_NEXT);
    });
    // 停止播放
    view.findView('icon-stop').on("click", () => {
      ActionPlayerCtrl.I.addTask(PlayTask.PLAY_STOP);
    });
    // 关闭按钮
    view.findView('icon-close').on("click", () => {
      ActionPlayerCtrl.I.addTask(PlayTask.CLOSE_PLAYER);
    });
    view.findView('seekBar').setOnSeekBarChangeListener({
      // 按下
      onStartTrackingTouch: function (seekBar: any) {
        console.log('按下');
        ActionDataModel.I.seekBarAction = true;
      },
      // 滑动
      onProgressChanged: function (seekBar: any, progress: any, fromUser: any) {
        // 是人为的拖动或者点击
        if (fromUser) {
          console.log('滑动', progress);
          console.log('滑动2', fromUser);
          // 不直接修改ActionDataModel.I.currMusicProgress，以免出现未知错误
          ActionDataModel.I.tempProgress = progress - 1; // 因为在BasicTask里加一，这里将进度条的progress转换成音乐的progress就需要减一
          // 滑到当前歌曲的哪个音符了
          const musicNote = ActionDataModel.I.getSongNoteByIndex(progress)
          if (musicNote) {
            // 拿到这个音符对应的时刻，去更新进度条的时间显示
            ActionPlayerCtrl.I.updateSeekBarText(musicNote.time)
          }
        }
      },
      // 松手
      onStopTrackingTouch: async function (seekBar: any) {
        console.log('松手');
        ActionDataModel.I.seekBarAction = false;
      }
    });
  }
  public async init() {
    // 让悬浮窗显示
    await this._window.show();
    await this._window.setSize(START_PLAY_WIDTH, START_PLAY_HEIGHT);
    // 设置悬浮窗位置
    await this._window.setPosition(START_PLAY_POSITION.x, START_PLAY_POSITION.y);
    // 初始化选歌界面
    SelectMusicWin.I.init();

    const settings: SettingsType | undefined = await datastore.get(DATA_STORE_SETTINGS);
    // 初始化播放器控制逻辑
    await ActionPlayerCtrl.I.init();
    // “设置”中要求立即播放
    if (settings && settings.immediatelyPlay) {
      // 继续播放“上次退出”时的歌
      ActionPlayerCtrl.I.addTask();
    }
  }
  public changeModeIcon() {
    this._window.view.findView('icon-play-mode').attr('src', ICON_LIST_REPEAT);
  }
  /* 切换播放模式的图标 */
  public switchPatternIcon(mode: PlayPattern) {
    const view = this._window.view
    switch (mode) {
      case PlayPattern.LIST_REPEAT:
        view.findView('icon-play-mode').attr('src', ICON_LIST_REPEAT);
        break;
      case PlayPattern.ONE_REPEAT:
        view.findView('icon-play-mode').attr('src', ICON_ONE_REPEAT);
        break;
      case PlayPattern.RANDOM_PLAY:
        view.findView('icon-play-mode').attr('src', ICON_RANDOM_PLAY);
        break;
    }
  }
  /* 切换开始或暂停的图标 */
  public switchPlayIcon(status: PlayStatus) {
    if (status === PlayStatus.START) {
      // 正在播放的状态，但是要把按钮设置为“待暂停”的图标
      this._window.view.findView('icon-play-status').attr('src', ICON_PAUSE_CIRCLE);
    } else {
      // 暂停的状态，但是要把按钮设置为“待播放”的图标
      this._window.view.findView('icon-play-status').attr('src', ICON_PLAY_CIRCLE);
    }
    SelectMusicWin.I.updateIconByIndex();
  }
  /* 关闭弹奏的界面 */
  public async closeWindow() {
    if (Player._instance == null) return;
    SelectMusicWin.I.closeWindow();
    await this._window.close();
    Player._instance = null;
  }
}