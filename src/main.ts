import { canDrawOverlays, manageDrawOverlays } from "floating_window";
import engines from 'engines';
import IconBtn from "@/components/IconBtn";
import Settings from '@/components/Settings';
import InitPlayerCtrl from "@/components/player/ctrl/InitPlayerCtrl";

async function main() {
    // console.setLogFilePath(LOG_SAVE_PATH);
    // 获取悬浮权限
    if (!canDrawOverlays()) {
        manageDrawOverlays();
        engines.stopAll();
    }
    // 暂时以代码的形式初始化“设置”参数
    // await Settings.clearSettings(); // TODO
    await Settings.I.initSettings(); // TODO
    await Settings.getSettings(); // TODO
    // 侧边按钮（入口）
    await IconBtn.I.init();
    // 在入口出现就获取所有歌曲
    await InitPlayerCtrl.checkMusicList();
}

main();
$autojs.keepRunning();
