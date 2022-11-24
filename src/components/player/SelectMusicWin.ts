import { FloatingWindow, createWindow } from "floating_window";
import { ICON_CLOSE, ICON_PAUSE_CIRCLE, ICON_PLAY_CIRCLE, SELECT_MUSIC_HEIGHT, SELECT_MUSIC_POSITION, SELECT_MUSIC_WIDTH } from '@/config/params';
import InitDataModel, { MusicNameType } from "./model/InitDataModel";
import ActionPlayerCtrl from "./ctrl/ActionPlayerCtrl";
import ActionDataModel, { PlayStatus, PlayTask } from "./model/ActionDataModel";

export default class SelectMusicWin {
  // 单例模式
  private static _instance: SelectMusicWin | null;
  private _window: FloatingWindow;
  private _musicNameList: Array<MusicNameType> | undefined;
  public static get I(): SelectMusicWin {
    return this._instance
      ? this._instance
      : (this._instance = new SelectMusicWin());
  }
  public get window(): FloatingWindow {
    return this._window;
  }
  private constructor() {
    // 生成悬浮窗
    this._window = createWindow();
    // 使用xml渲染悬浮窗里的内容，gravity是决定它内部子元素的排列方式，layout_gravity是决定自己在父级内部的排列方式
    this._window.setViewFromXml(`
        <frame id="outer" bg="#B0C4DE" alpha="0.7">
          <img src="${ICON_CLOSE}" id="icon-close" w="23" h="23" layout_gravity="top|right" />
          <list id="list" bg="#d0dff3" margin="5 25 5 5"></list>
        </frame>`);
    // 关闭按钮
    this._window.view.findView('icon-close').on("click", () => {
      ActionPlayerCtrl.I.addTask(PlayTask.SELECT_MUSIC);
    });
  }
  public async init() {
    // 让悬浮窗显示
    await this._window.show();
    // 宽度设置为0暂时隐藏
    await this._window.setSize(0, SELECT_MUSIC_HEIGHT); // SELECT_MUSIC_WIDTH
    // 设置悬浮窗位置
    await this._window.setPosition(SELECT_MUSIC_POSITION.x, SELECT_MUSIC_POSITION.y);
    // 获取音乐列表
    this._musicNameList = InitDataModel.musicNameList;
    this._initList(this._window.view.findView('list'));
  }
  private _initList(list: any) {
    list.setItemTemplate(`
        <vertical w="*">
            <horizontal margin="0 1" bg="#F5F5F5" h="20">
              <text textSize="14sp" text="{{this.name}}" layout_weight="13" maxLines="1" ellipsize="end"></text>
              <frame layout_weight="1" margin="0 1">
                <img src="{{this.icon}}" id="icon-play-status" w="18" h="18" layout_gravity="right" />
              </frame>
            </horizontal>
        </vertical>
    `);
    list.on("item_created", (itemView: any, itemHolder: any) => {
        itemView.findView("icon-play-status").setOnClickListener((e: any) => {
          console.log('itemView', itemView);
          console.log('itemHolder', itemHolder);
          console.log('itemHolder.position', itemHolder.position);
          if (this._musicNameList) {
            this.playOrPause(itemHolder.position);
          }
        });
    });
    list.setDataSource(this._musicNameList);
  }
  public playOrPause(index: number) {
    if (ActionDataModel.I.currMusicIndex === index) {
      // 对同一首进行操作，那么以前是暂停的现在就播放，以前是播放的现在就暂停
      ActionPlayerCtrl.I.addTask()
    } else {
      // 不是同一首，那么直接按照索引播放（当然，会自动停止前面正在播放的歌）
      ActionPlayerCtrl.I.addTask(PlayTask.PLAY_START, index)
    }
  }
  public updateIconByIndex() {
    if (!this._musicNameList) return
    for (let i = 0; i < this._musicNameList.length; i++) {
      const music = this._musicNameList[i];
      if (i === ActionDataModel.I.currMusicIndex && ActionDataModel.I.playStatus === PlayStatus.START) {
        music.icon = ICON_PAUSE_CIRCLE
      } else {
        music.icon = ICON_PLAY_CIRCLE
      }
    }
    // 通知视图，icon变化了
    this._window.view.findView('list').getAdapter().notifyDataSetChanged();
  }
  // 显示
  public async showWindow() {
    // 宽度设置为SELECT_MUSIC_WIDTH，显示
    await this._window.setSize(SELECT_MUSIC_WIDTH, SELECT_MUSIC_HEIGHT);
  }
  // 临时隐藏
  public async hideWindow() {
    // 宽度设置为0，隐藏
    await this._window.setSize(0, SELECT_MUSIC_HEIGHT);
  }
  // 销毁
  public async closeWindow() {
    if (SelectMusicWin._instance == null) return;
    await this._window.close();
    SelectMusicWin._instance = null;
  }
}